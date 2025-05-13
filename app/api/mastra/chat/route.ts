import { type NextRequest, NextResponse } from "next/server"
import { chatWithMastra } from "@/lib/mastra"

// Configure larger payload size limit
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

      const result = await chatWithMastra(prompt, schema, sampleRows)

      console.log("Mastra service response received")

      // Validate the response structure
      if (!result || typeof result !== "object") {
        console.error("Invalid response from Mastra service:", result)
        return NextResponse.json({ error: "Received invalid response from Mastra service" }, { status: 500 })
      }

      return NextResponse.json(result)
    } catch (err) {
      console.error("Error calling Mastra service:", err)

      // Provide more detailed error information
      let errorMessage = "Unknown error in Mastra service"

      if (err.response) {
        errorMessage = `Mastra API error: ${err.response.status} ${err.response.statusText}`
        console.error("Response status:", err.response.status)
        console.error("Response headers:", err.response.headers)
        console.error("Response data:", err.response.data)
      } else if (err instanceof Error) {
        errorMessage = err.message
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
  } catch (err) {
    // Handle JSON parsing errors
    console.error("Error parsing request:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid request format" }, { status: 400 })
  }
}
