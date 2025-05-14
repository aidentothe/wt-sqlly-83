import { type NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";

// Allow up to 5 MB JSON bodies (App Router ignores Pages‑router bodyParser)
export const maxRequestBodySize = 5 * 1024 * 1024; // bytes

// ────────────────────────────────────────────────────────────────────────────────
// Simple echo tool – illustrates Mastra tool shape
// ────────────────────────────────────────────────────────────────────────────────
const echoTool = {
  id: "echo",
  description: "Echoes back the input string exactly as provided",
  parameters: {
    type: "object",
    properties: {
      input: { type: "string", description: "The input to echo" },
    },
    required: ["input"],
  },
  async run({ input }: { input: string }) {
    return input;
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// Lazily‑initialised Mastra agent
// ────────────────────────────────────────────────────────────────────────────────
let agentInstance: Agent | null = null;

function getAgent() {
  if (!agentInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    agentInstance = new Agent({
      name: "wt-sqlly-sql-converter",
      instructions: `
        You are an SQL assistant that helps users convert natural-language questions into SQL.
        You will be provided with:
        1. The schema for a table named "csv_data".
        2. Sample rows from this table.
        3. A specific FileID.

        Your task is to generate a SQL query that targets the "csv_data" table and MUST filter by the provided FileID.
        
        IMPORTANT DATABASE STRUCTURE:
        - The csv_data table has columns: id, file_id, row_index, row_data, created_at
        - The actual row data is stored in a JSONB column called "row_data"
        - To access a field within row_data JSON, use the "->" operator for JSON traversal or "->>" for extracting text values
        
        QUERY FORMAT:
        - For queries returning all data fields, use: SELECT row_data FROM csv_data WHERE ...
        - For queries needing specific fields, use: SELECT row_data->>'field1' as field1, row_data->>'field2' as field2 FROM csv_data WHERE ...
        
        FIELD ACCESS EXAMPLES:
        - Text comparison: row_data->>'Name' = 'John'
        - Numeric comparison: (row_data->>'Score')::numeric > 80
        - Date comparison: (row_data->>'Date')::date > '2023-01-01'
        - Boolean check: (row_data->>'Active')::boolean = true
        - IP address comparison: (row_data->>'IP')::inet > '192.168.1.1'::inet
        
        Always ensure the file_id filter is included in the WHERE clause: WHERE file_id = '[UUID]' AND ...

        Always do the following:

        1. Briefly restate in plain English what the user is asking for.
        2. Show the valid, executable SQL for the "csv_data" table, incorporating the provided FileID, wrapped in a fenced code block. For example:
          \`\`\`sql
          SELECT row_data FROM csv_data WHERE file_id = '59037db4-f134-41d6-9cea-931d56278a38' AND (row_data->>'GPA')::numeric > 3.5;
          \`\`\`
        3. Based on the provided sample rows from "csv_data", include a short paragraph describing what the query will return.
          
        IMPORTANT: The file_id column in the database has type UUID with the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx. 
        If a file name with extension is provided like "59037db4-f134-41d6-9cea-931d56278a38-Expected Outcomes.csv", extract just the UUID part.
      `,
      model: openai("gpt-4o-mini"),
      tools: {
        echo: echoTool,
      },
    });
  }
  return agentInstance;
}

// ────────────────────────────────────────────────────────────────────────────────
// Utility – rudimentary schema inference from CSV‑shaped data
// ────────────────────────────────────────────────────────────────────────────────
// This function is kept for reference but is now used client-side only
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extractSchemaFromCsv(columns: string[], sampleRows: Record<string, unknown>[]) {
  if (!columns?.length || !sampleRows) return {};

  const schema: Record<string, string> = {};

  for (const column of columns) {
    let type = "text";

    for (const row of sampleRows) {
      const value = row?.[column as keyof typeof row];
      if (value === null || value === undefined) continue;

      if (typeof value === "number") {
        type = Number.isInteger(value) ? "integer" : "numeric";
      } else if (typeof value === "boolean") {
        type = "boolean";
      } else if (typeof value === "string") {
        const datePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;
        if (datePattern.test(value)) type = "timestamp";
      }
      break;
    }

    schema[column] = type;
  }

  return schema;
}

// Utility - extract UUID from a string
function extractUuid(str: string): string {
  const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
  const match = str.match(uuidPattern);
  return match ? match[1] : str;
}

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/mastra/chat – turn NL -> SQL via Mastra agent
// ────────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured on the server" },
        { status: 500 },
      );
    }

    const { prompt, schema, sampleRows, fileId } = await req.json();

    if (
      typeof prompt !== "string" ||
      typeof schema !== "object" ||
      !Array.isArray(sampleRows) ||
      !fileId
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid payload. Expect { prompt: string, schema: object, sampleRows: any[], fileId: string }.",
        },
        { status: 400 },
      );
    }

    const agent = getAgent();
    
    // Extract the UUID part from fileId
    const cleanFileId = extractUuid(fileId);

    // Add file_id to each sample row for clarity in the AI model's context
    const enrichedSampleRows = sampleRows.map(row => ({
      ...row,
      file_id: cleanFileId
    }));

    const systemMessageContent = 
      `Schema: ${JSON.stringify(schema)}\n` +
      `SampleRows: ${JSON.stringify(enrichedSampleRows)}\n` +
      `FileID: ${cleanFileId}`;

    const result = await agent.generate([
      { role: "system", content: systemMessageContent },
      { role: "user", content: prompt },
    ]);

    // Log the full agent result for debugging
    console.log("Mastra agent raw result:", result);

    if (typeof result.text !== "string") {
      return NextResponse.json({ error: "Mastra agent returned non‑string output" }, { status: 500 });
    }

    const fullReply = result.text;
    let restatement = "";
    let sql = "";
    let resultDescription = "";

    // 1. Extract SQL
    const sqlRegex = /```sql\s*([\s\S]*?)```/i;
    const sqlMatchResult = fullReply.match(sqlRegex);

    if (sqlMatchResult && typeof sqlMatchResult.index === 'number' && sqlMatchResult[1]) {
      sql = sqlMatchResult[1].trim();

      // 2. Extract Restatement (Part 1: text before SQL block)
      const beforeSqlBlockContent = fullReply.substring(0, sqlMatchResult.index).trim();
      // Attempt to remove potential numbering like "1. " or "2. " that might be part of the intro
      const restatementContentMatch = beforeSqlBlockContent.match(/^(?:1\.\s*)?([\s\S]*?)(?:\n*2\.\s*[\s\S]*)?$/i);
      if (restatementContentMatch && restatementContentMatch[1]) {
        restatement = restatementContentMatch[1].trim();
      } else {
        restatement = beforeSqlBlockContent; // Fallback to the whole content before SQL
      }

      // 3. Extract Result Description (Part 3: text after SQL block)
      const afterSqlBlockContent = fullReply.substring(sqlMatchResult.index + sqlMatchResult[0].length).trim();
      // Attempt to remove potential numbering like "3. "
      const descriptionContentMatch = afterSqlBlockContent.match(/^(?:3\.\s*)?([\s\S]*)$/i);
      if (descriptionContentMatch && descriptionContentMatch[1]) {
        resultDescription = descriptionContentMatch[1].trim();
      } else {
        resultDescription = afterSqlBlockContent; // Fallback to the whole content after SQL
      }

    } else {
      // No SQL block found. The agent might be providing a general message or just the restatement.
      // Treat the whole reply as the restatement in this case, or if it seems like an error/clarification.
      restatement = fullReply.trim();
    }

    return NextResponse.json({
      reply: fullReply,
      restatement,
      sql,
      resultDescription,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    console.error(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
