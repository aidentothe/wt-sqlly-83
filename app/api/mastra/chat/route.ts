import { type NextRequest, NextResponse } from "next/server"
import { createOpenAI } from "@ai-sdk/openai"
import { Agent } from "@mastra/core/agent"

// Configure larger payload size limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb",
    },
  },
}

// Create the OpenAI provider with your API key
const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Example tool: Echo tool
const echoTool = {
  id: 'echo',
  description: 'Echoes back the input',
  async run({ input }: { input: string }) {
    return input;
  },
};

// Create the agent instance (server-side only)
let agentInstance: any = null

function getAgent() {
  if (!agentInstance) {
    // Check for required environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured")
    }

    if (!process.env.NEXT_PUBLIC_MASTRA_AGENT_URL) {
      throw new Error("NEXT_PUBLIC_MASTRA_AGENT_URL is not configured")
    }

    // Create the agent with proper configuration
    agentInstance = new Agent({
      name: "wt-sqlly-sql-converter",
      instructions: `
        You are an SQL assistant that helps users convert natural language queries into SQL.
        When given a database schema and sample data, generate appropriate SQL queries.
        Always return valid SQL that can be executed against the provided schema.
        Format your response with the SQL query inside a code block like this:
        \`\`\`sql
        SELECT * FROM table;
        \`\`\`
      `,
      model: openaiProvider("gpt-4o"),
      tools: {
        echo: echoTool,
      },
    })
  }
  return agentInstance
}

/**
 * Helper function to extract schema from CSV data
 */
function extractSchemaFromCsv(columns: string[], sampleRows: any[]) {
  if (!columns || !columns.length || !sampleRows) {
    console.warn("Invalid input to extractSchemaFromCsv")
    return {}
  }

  const schema: Record<string, string> = {}

  columns.forEach((column) => {
    // Determine column type based on sample data
    let type = "text"

    // Check first non-null value to determine type
    for (const row of sampleRows) {
      if (!row) continue

      const value = row[column]
      if (value !== null && value !== undefined) {
        if (typeof value === "number") {
          // Check if it's an integer or float
          type = Number.isInteger(value) ? "integer" : "numeric"
        } else if (typeof value === "boolean") {
          type = "boolean"
        } else if (typeof value === "string") {
          // Check if it's a date
          const datePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/
          if (datePattern.test(value)) {
            type = "timestamp"
          }
        }
        break
      }
    }

    schema[column] = type
  })

  return schema
}

/**
 * POST handler for /api/mastra/chat
 * Processes natural language queries and returns SQL
 */
export async function POST(req: NextRequest) {
  try {
    // Check for required environment variables first
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY environment variable is missing")
      return NextResponse.json(
        { error: "OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables." },
        { status: 500 },
      )
    }

    if (!process.env.NEXT_PUBLIC_MASTRA_AGENT_URL) {
      console.error("NEXT_PUBLIC_MASTRA_AGENT_URL environment variable is missing")
      return NextResponse.json(
        {
          error:
            "Mastra agent URL is not configured. Please add NEXT_PUBLIC_MASTRA_AGENT_URL to your environment variables.",
        },
        { status: 500 },
      )
    }

    try {
      // Parse the request body
      const { prompt, schema, sampleRows } = await req.json()

      // Validate required fields
      if (!prompt) {
        return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
      }

      if (!schema) {
        return NextResponse.json({ error: "Schema is required" }, { status: 400 })
      }

      if (!sampleRows) {
        return NextResponse.json({ error: "Sample rows are required" }, { status: 400 })
      }

      // Call Mastra service with error handling
      try {
        console.log("Calling Mastra service with:", {
          promptLength: prompt.length,
          schemaKeys: Object.keys(schema),
          sampleRowsCount: sampleRows.length,
        })

        // Get the agent instance
        const agent = getAgent()

        // Generate a response using the agent
        // Wrap this in a try/catch to handle any potential errors
        let result
        try {
          result = await agent.generate({
            input: prompt,
            context: {
              schema,
              sampleRows,
            },
          })
        } catch (agentError) {
          console.error("Error generating response with Mastra agent:", agentError)
          return NextResponse.json(
            { error: agentError instanceof Error ? `Mastra agent error: ${agentError.message}` : "Mastra agent error: Unknown error" },
            { status: 500 },
          )
        }

        console.log("Mastra service response received")

        // Extract the SQL from the response
        const sqlMatch = result.output.match(/```sql\n([\s\S]*?)\n```/)
        const sql = sqlMatch ? sqlMatch[1].trim() : ""

        return NextResponse.json({
          reply: result.output,
          sql: sql,
        })
      } catch (err) {
        console.error("Error calling Mastra service:", err)

        // Provide more detailed error information
        let errorMessage = "Unknown error in Mastra service"

        if (err && typeof err === 'object' && 'response' in err && err.response) {
          const response = (err as any).response;
          errorMessage = `Mastra API error: ${response.status} ${response.statusText}`
          console.error("Response status:", response.status)
          console.error("Response headers:", response.headers)
          console.error("Response data:", response.data)
        } else if (err instanceof Error) {
          errorMessage = err.message
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 })
      }
    } catch (err) {
      // Handle JSON parsing errors
      console.error("Error parsing request:", err)
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid request format" },
        { status: 400 },
      )
    }
  } catch (outerError) {
    // Catch any unexpected errors
    console.error("Unexpected error in API route:", outerError)
    return NextResponse.json(
      { error: outerError instanceof Error ? outerError.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
