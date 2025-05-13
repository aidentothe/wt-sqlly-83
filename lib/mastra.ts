// Define the MastraClient class for API communication
export class MastraClient {
  private baseUrl: string
  private retries: number
  private backoffMs: number
  private maxBackoffMs: number
  private apiKey: string

  constructor(config: {
    baseUrl: string
    apiKey: string
    retries?: number
    backoffMs?: number
    maxBackoffMs?: number
  }) {
    // Validate required configuration
    if (!config.baseUrl) {
      throw new Error("MastraClient requires a baseUrl")
    }

    if (!config.apiKey) {
      throw new Error("MastraClient requires an apiKey")
    }

    this.baseUrl = config.baseUrl
    this.apiKey = config.apiKey
    this.retries = config.retries || 3
    this.backoffMs = config.backoffMs || 300
    this.maxBackoffMs = config.maxBackoffMs || 5000
  }

  async chat(params: {
    agent: string
    input: string
    context: {
      schema: Record<string, string>
      sampleRows: any[]
    }
  }) {
    // Validate required parameters
    if (!params.agent) {
      throw new Error("Agent name is required")
    }

    if (!params.input) {
      throw new Error("Input prompt is required")
    }

    if (!params.context || !params.context.schema || !params.context.sampleRows) {
      throw new Error("Context with schema and sampleRows is required")
    }

    let attempt = 0
    let backoff = this.backoffMs

    while (attempt < this.retries) {
      try {
        console.log(`Attempt ${attempt + 1} to call Mastra API at ${this.baseUrl}/api/chat`)

        const response = await fetch(`${this.baseUrl}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(params),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Mastra API error (${response.status}):`, errorText)
          throw new Error(`Mastra API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return {
          reply: data.reply || "I've generated a SQL query based on your request.",
          sql: data.sql || "",
        }
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error)
        attempt++

        if (attempt >= this.retries) {
          throw error
        }

        // Exponential backoff
        console.log(`Retrying in ${backoff}ms...`)
        await new Promise((resolve) => setTimeout(resolve, backoff))
        backoff = Math.min(backoff * 2, this.maxBackoffMs)
      }
    }

    throw new Error("Maximum retries exceeded")
  }
}

// DO NOT create the client at module scope
// Instead, create a function to get the client when needed
let mastraClientInstance: MastraClient | null = null

/**
 * Gets or creates a MastraClient instance.
 * This function should only be called on the server side where OPENAI_API_KEY is available.
 */
export function getMastraClient() {
  // For server-side only
  if (typeof window === "undefined") {
    const baseUrl = process.env.NEXT_PUBLIC_MASTRA_AGENT_URL
    const apiKey = process.env.OPENAI_API_KEY

    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_MASTRA_AGENT_URL is not set")
    }

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set")
    }

    if (!mastraClientInstance) {
      mastraClientInstance = new MastraClient({
        baseUrl,
        apiKey,
        retries: 3,
        backoffMs: 300,
        maxBackoffMs: 5000,
      })
    }

    return mastraClientInstance
  }

  // This should never be called on the client side
  throw new Error("getMastraClient should only be called on the server side")
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
    const client = getMastraClient()
    const response = await client.chat({
      agent: "wt-sqlly-sql-converter",
      input: prompt,
      context: { schema, sampleRows },
    })
    return response
  } catch (error) {
    console.error("Error in chatWithMastra:", error)
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
