"use client"

import { useState } from "react"
import { Send, Play, Loader2, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useCsvStore } from "@/hooks/use-csv-store"
import { extractSchemaFromCsv } from "@/lib/csv-utils"
import { executeSqlQuery } from "@/lib/supabase"

interface Message {
  user: string
  bot: string
  sql: string
}

export function MastraChat() {
  const { toast } = useToast()
  const { csvFile, csvData } = useCsvStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sqlResult, setSqlResult] = useState<any[] | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = async () => {
    if (!draft.trim() || !csvFile || !csvData.length) {
      toast({
        variant: "destructive",
        title: "Cannot send message",
        description: "Please enter a message and upload a CSV file first.",
      })
      return
    }

    setIsLoading(true)
    setSqlResult(null)
    setError(null)

    try {
      // Extract schema from CSV data
      const schema = extractSchemaFromCsv(csvFile.columns, csvData)
      const sampleRows = csvData.slice(0, 50) // Send up to 50 sample rows for context

      console.log("Sending request to /api/mastra/chat with method POST")

      // Make API request to our route handler - EXPLICITLY using POST method
      const res = await fetch("/api/mastra/chat", {
        method: "POST", // Ensure method is POST
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: draft,
          schema,
          sampleRows,
        }),
      })

      console.log("Response status:", res.status)

      // Handle specific HTTP status codes
      if (res.status === 405) {
        throw new Error("Method Not Allowed: The server only accepts POST requests to this endpoint.")
      }

      // Parse the response JSON (in try/catch to handle parse errors)
      let data
      try {
        data = await res.json()
      } catch (err) {
        console.error("Failed to parse response:", err)
        throw new Error("Failed to parse server response. Check server logs for details.")
      }

      // Check if response is not OK
      if (!res.ok) {
        const errorMessage = data?.error || `Server error: ${res.status}`
        console.error("Server returned error:", errorMessage)
        throw new Error(errorMessage)
      }

      console.log("Response data received:", data)

      // Extract reply and SQL from response
      const { reply, sql } = data

      if (!reply || !sql) {
        console.warn("Response missing expected fields:", data)
      }

      // Add message to chat history
      setMessages((prev) => [
        ...prev,
        {
          user: draft,
          bot: reply || "I've generated a SQL query based on your request.",
          sql: sql || "",
        },
      ])

      // Clear draft
      setDraft("")
    } catch (error) {
      console.error("Error sending message:", error)

      // Set error state for UI display
      setError(error instanceof Error ? error.message : "Unknown error occurred")

      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const executeLatestSql = async () => {
    if (!messages.length || !csvFile) return

    const latestSql = messages[messages.length - 1].sql

    if (!latestSql.trim()) {
      toast({
        variant: "destructive",
        title: "No SQL to execute",
        description: "The latest message doesn't contain any SQL query.",
      })
      return
    }

    setIsExecuting(true)
    setSqlResult(null)
    setError(null)

    try {
      const result = await executeSqlQuery(latestSql, csvFile.id)
      setSqlResult(result)

      toast({
        title: "Query executed successfully",
        description: `Returned ${result.length} rows`,
      })
    } catch (error) {
      console.error("Error executing SQL:", error)

      // Set error state for UI display
      setError(error instanceof Error ? error.message : "Unknown error occurred")

      toast({
        variant: "destructive",
        title: "Failed to execute SQL",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground p-1 rounded text-xs">AI</span>
            Mastra.ai SQL Assistant
          </CardTitle>
          <CardDescription>Ask questions in plain English to generate SQL queries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Clear Chat and Delete All Chats Buttons */}
          <div className="flex justify-end mb-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMessages([]);
                setSqlResult(null);
                setError(null);
              }}
              disabled={messages.length === 0}
            >
              Clear Chat
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (window.confirm("Are you sure you want to delete all chats?")) {
                  setMessages([]);
                  setSqlResult(null);
                  setError(null);
                }
              }}
              disabled={messages.length === 0}
            >
              Delete All Chats
            </Button>
          </div>

          <div className="border rounded-md p-4 h-[300px] overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No messages yet. Start by asking a question about your data.
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className="space-y-2">
                  <div className="bg-muted p-3 rounded-md">
                    <p className="font-medium">You:</p>
                    <p>{message.user}</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-md">
                    <p className="font-medium">Mastra.ai:</p>
                    <p>{message.bot}</p>
                    <div className="mt-2 bg-background p-2 rounded border font-mono text-sm overflow-x-auto">
                      <pre>{message.sql}</pre>
                    </div>
                    {index === messages.length - 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={executeLatestSql}
                        disabled={isExecuting}
                      >
                        {isExecuting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Run SQL
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {sqlResult && sqlResult.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <div className="bg-muted p-2 font-medium">Query Result</div>
              <div className="p-2 max-h-[200px] overflow-auto">
                <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(sqlResult, null, 2)}</pre>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask a question about your data..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              disabled={isLoading || !csvFile}
            />
            <Button onClick={sendMessage} disabled={!draft.trim() || isLoading || !csvFile}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          {csvFile ? `Using file: ${csvFile.name}` : "Upload a CSV file to get started"}
        </CardFooter>
      </Card>
    </motion.div>
  )
}
