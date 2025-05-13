"use client"

import { AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function MastraFallback() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground p-1 rounded text-xs">AI</span>
          Mastra.ai SQL Assistant
        </CardTitle>
        <CardDescription>Ask questions in plain English to generate SQL queries</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Service Unavailable</AlertTitle>
          <AlertDescription>
            The Mastra.ai SQL Assistant is currently unavailable. Please check your environment variables and try again
            later.
          </AlertDescription>
        </Alert>

        <div className="border rounded-md p-4 h-[300px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>Unable to connect to Mastra.ai service.</p>
            <p className="text-sm mt-2">
              Please ensure that OPENAI_API_KEY and NEXT_PUBLIC_MASTRA_AGENT_URL are properly configured.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
