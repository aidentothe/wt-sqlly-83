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
        3. A specific FileID that the user has selected to focus on.

        Your task is to generate a SQL query that targets the "csv_data" table and **MUST** filter by the provided FileID.
        The SQL query should look like: SELECT ... FROM csv_data WHERE file_id = 'THE_PROVIDED_FILE_ID' AND ...other_conditions...;

        Always do the following:

        1. Briefly restate in plain English what the user is asking for.
        2. Show the valid, executable SQL for the "csv_data" table, incorporating the provided FileID, wrapped in a fenced code block. For example, if the provided FileID is 'abc-123-xyz':
          \`\`\`sql
          SELECT * FROM csv_data WHERE file_id = 'abc-123-xyz' AND school = 'Harvard';
          \`\`\`
        3. Based on the provided sample rows from "csv_data" (and considering the FileID context), include a short paragraph in natural language describing the actual results the query would return. For example:
          "This query would return all graduates who attended Harvard from the dataset associated with FileID 'abc-123-xyz'; in the sample data, those are Alice Johnson and Carlos Ramirez."
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
      typeof fileId !== "string"
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
    
    const systemMessageContent = 
      `Schema: ${JSON.stringify(schema)}\n` +
      `SampleRows: ${JSON.stringify(sampleRows)}\n` +
      `FileID: ${fileId}`;

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
