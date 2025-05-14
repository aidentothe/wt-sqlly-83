import { type NextRequest, NextResponse } from "next/server"

/**
 * GET handler for /api/mastra/test
 * Tests if the Mastra API environment variables are configured correctly
 */
export async function GET(_req: NextRequest) {
  const config = {
    openaiApiKey: process.env.OPENAI_API_KEY ? "✅ Configured" : "❌ Missing",
    mastraAgentUrl: process.env.NEXT_PUBLIC_MASTRA_AGENT_URL ? "✅ Configured" : "❌ Missing",
  }

  return NextResponse.json({
    status: "ok",
    message: "Mastra API test endpoint",
    config,
  })
}
