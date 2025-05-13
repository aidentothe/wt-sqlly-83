import { type NextRequest, NextResponse } from "next/server"
import { chatWithMastra } from "@/lib/mastra"

// Configure larger payload size limit for sample data
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb",
    },
  },
}

/**
 * POST handler for /api/mastra/chat
 * Processes natural language queries and returns SQL
 */
export async function POST(req: NextRequest) {
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
      const result = await chatWithMastra(prompt, schema, sampleRows)
      return NextResponse.json(result)
    } catch (err) {
      console.error("Error calling Mastra service:", err)
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Unknown error in Mastra service" },
        { status: 500 },
      )
    }
  } catch (err) {
    // Handle JSON parsing errors
    console.error("Error parsing request:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid request format" }, { status: 400 })
  }
}
