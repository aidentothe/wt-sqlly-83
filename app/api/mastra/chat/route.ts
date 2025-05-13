import { type NextRequest, NextResponse } from "next/server"
import { chatWithMastra } from "@/lib/mastra"

// Configure larger payload size limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
}

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json()
    const { prompt, schema, sampleRows } = body

    // Validate input
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt: must be a non-empty string" }, { status: 400 })
    }

    if (!schema || typeof schema !== "object") {
      return NextResponse.json({ error: "Invalid schema: must be an object" }, { status: 400 })
    }

    if (!Array.isArray(sampleRows)) {
      return NextResponse.json({ error: "Invalid sampleRows: must be an array" }, { status: 400 })
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables." },
        { status: 500 },
      )
    }

    // Forward the prompt and context to Mastra and return its reply
    try {
      const result = await chatWithMastra(prompt, schema, sampleRows)
      return NextResponse.json(result)
    } catch (err) {
      console.error("Error in chatWithMastra:", err)
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Unknown error in Mastra service" },
        { status: 500 },
      )
    }
  } catch (err) {
    // Handle JSON parsing errors or other unexpected errors
    console.error("Unexpected error in Mastra chat API:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process request" },
      { status: 500 },
    )
  }
}
