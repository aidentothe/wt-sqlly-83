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
    let attempt = 0
    let backoff = this.backoffMs

    while (attempt < this.retries) {
      try {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(params),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return {
          reply: data.reply || "I've generated a SQL query based on your request.",
          sql: data.sql || "",
        }
      } catch (error) {
        attempt++
        if (attempt >= this.retries) {
          throw error
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, backoff))
        backoff = Math.min(backoff * 2, this.maxBackoffMs)
      }
    }

    throw new Error("Maximum retries exceeded")
  }
}

// Initialize the Mastra client with retry/backoff settings and API key
const baseUrl = process.env.NEXT_PUBLIC_MASTRA_AGENT_URL || "http://localhost:4111"
const apiKey = process.env.OPENAI_API_KEY || ""

export const mastraClient = new MastraClient({
  baseUrl,
  apiKey,
  retries: 3, // retry up to 3 times on failure
  backoffMs: 300, // initial backoff delay
  maxBackoffMs: 5000, // maximum backoff delay
})

/**
 * Sends a user's natural-language prompt plus schema & sampleRows
 * to the Mastra SQL-converter agent and returns the agent's response.
 */
export async function chatWithMastra(prompt: string, schema: Record<string, string>, sampleRows: any[]) {
  const response = await mastraClient.chat({
    agent: "wt-sqlly-sql-converter",
    input: prompt,
    context: { schema, sampleRows },
  })
  return response
}

// Helper function to extract schema from CSV file
export function extractSchemaFromCsv(columns: string[], sampleRows: any[]) {
  const schema: Record<string, string> = {}

  columns.forEach((column) => {
    // Determine column type based on sample data
    let type = "text"

    // Check first non-null value to determine type
    for (const row of sampleRows) {
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
