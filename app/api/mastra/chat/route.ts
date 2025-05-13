import { type NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";

// Allow up to 5 MB JSON bodies (App Router ignores Pages‑router bodyParser)
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
        You are an SQL assistant that helps users convert natural‑language questions into SQL.
        Given a database schema and sample rows, generate valid, executable SQL.
        Always wrap the SQL in a fenced code block:
        \u0060\u0060\u0060sql\nSELECT * FROM csv_data;\n\u0060\u0060\u0060
      `,
      model: openai("gpt-4o"),
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

    const { prompt, schema, sampleRows } = await req.json();

    if (
      typeof prompt !== "string" ||
      typeof schema !== "object" ||
      !Array.isArray(sampleRows)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid payload. Expect { prompt: string, schema: object, sampleRows: any[] }.",
        },
        { status: 400 },
      );
    }

    const agent = getAgent();

    const result = await agent.generate([
      { role: "system", content: `Schema: ${JSON.stringify(schema)}\nSampleRows: ${JSON.stringify(sampleRows)}` },
      { role: "user", content: prompt },
    ]);

    // Log the full agent result for debugging
    console.log("Mastra agent raw result:", result);

    if (typeof result.text !== "string") {
      return NextResponse.json({ error: "Mastra agent returned non‑string output" }, { status: 500 });
    }

    const sqlMatch = result.text.match(/```sql\s*([\s\S]*?)```/i);
    const sql = sqlMatch ? sqlMatch[1].trim() : "";

    return NextResponse.json({ reply: result.text, sql });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    console.error(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
