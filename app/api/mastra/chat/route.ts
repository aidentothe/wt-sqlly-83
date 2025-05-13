// POST /api/mastra/chat
import { type NextRequest, NextResponse } from "next/server"
import { chatWithMastra } from "@/lib/mastra"

export async function POST(req: NextRequest) {
  try {
    const { prompt, schema, sampleRows } = await req.json()

    // Validate input
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 })
    }

    if (!schema || typeof schema !== "object") {
      return NextResponse.json({ error: "Invalid schema" }, { status: 400 })
    }

    if (!Array.isArray(sampleRows)) {
      return NextResponse.json({ error: "Invalid sample rows" }, { status: 400 })
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables." },
        { status: 500 },
      )
    }

    // Forward the prompt and context to Mastra and return its reply
    const result = await chatWithMastra(prompt, schema, sampleRows)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in Mastra chat API:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
