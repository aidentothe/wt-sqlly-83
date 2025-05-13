import { openai } from "@ai-sdk/openai"
import { Agent } from "@mastra/core/agent"

// Create a singleton instance of the Mastra Agent
let agentInstance: any = null

/**
 * Gets or creates a Mastra Agent instance.
 * This function should only be called on the server side.
 */
export function getMastraAgent() {
  // For server-side only
  if (typeof window === "undefined") {
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
        `,
        model: openai("gpt-4o", {
          apiKey: process.env.OPENAI_API_KEY,
        }),
        mastra: {
          apiUrl: process.env.NEXT_PUBLIC_MASTRA_AGENT_URL,
          defaultMethod: "POST", // Explicitly set POST to avoid 405 errors
        },
      })
    }
    return agentInstance
  }

  // This should never be called on the client side
  throw new Error("getMastraAgent should only be called on the server side")
}

/**
 * Sends a user's natural-language prompt plus schema & sampleRows
 * to the Mastra SQL-converter agent and returns the agent's response.
 * This function should only be called on the server side.
 */
export async function chatWithMastra(prompt: string, schema: Record<string, string>, sampleRows: any[]) {
  if (!prompt || !schema || !sampleRows) {
    throw new Error("Missing required parameters for Mastra chat")
  }

  try {
    const agent = getMastraAgent()

    // Generate a response using the agent
    const result = await agent.generate({
      input: prompt,
      context: {
        schema,
        sampleRows,
      },
    })

    // Extract the SQL from the response
    const sqlMatch = result.output.match(/```sql\n([\s\S]*?)\n```/)
    const sql = sqlMatch ? sqlMatch[1].trim() : ""

    return {
      reply: result.output,
      sql: sql,
    }
  } catch (error) {
    console.error("Error in chatWithMastra:", error)

    // Provide more detailed error information
    if (error.response) {
      console.error("Response status:", error.response.status)
      console.error("Response headers:", error.response.headers)
      console.error("Response data:", error.response.data)
    }

    throw error
  }
}

// Helper function to extract schema from CSV file
// This can be used on both client and server
export function extractSchemaFromCsv(columns: string[], sampleRows: any[]) {
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
