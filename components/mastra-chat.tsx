"use client"

import { useState } from "react"
import { Send, Play, Loader2, AlertCircle, Info } from "lucide-react"
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
  isGeneralQuestion?: boolean
  analysisResults?: any[] | null
}

// Define a type for SQL query results
type SqlResult = Record<string, unknown>[]

export function MastraChat() {
  const { toast } = useToast()
  const { csvFile, csvData } = useCsvStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sqlResult, setSqlResult] = useState<SqlResult | null>(null)
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
          fileId: csvFile.id || csvFile.name, // Send the file ID or name as fallback
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

      // Extract reply, SQL, and whether it's a general question
      const { reply, sql, isGeneralQuestion } = data

      if (!reply) {
        console.warn("Response missing expected fields:", data)
      }

      let analysisResults = null

      // If this is a general question, automatically execute the SQL query to get data
      if (isGeneralQuestion && sql) {
        try {
          // For general questions, we might have multiple SQL queries separated by semicolons
          const queries = sql.split(';').filter((q: string) => q.trim().length > 0)
          
          analysisResults = []
          for (const query of queries) {
            const queryResult = await executeSqlQuery(query.trim())
            analysisResults.push({
              query: query.trim(),
              data: queryResult
            })
          }
          
          toast({
            title: "Data analysis completed",
            description: `Executed ${queries.length} queries to analyze your data`,
          })
        } catch (sqlError) {
          console.error("Error executing analysis SQL:", sqlError)
          toast({
            variant: "destructive",
            title: "Analysis query execution had errors",
            description: sqlError instanceof Error ? sqlError.message : "Unknown error occurred",
          })
        }
      }

      // Add message to chat history
      setMessages((prev) => [
        ...prev,
        {
          user: draft,
          bot: reply || "I've generated a SQL query based on your request.",
          sql: sql || "",
          isGeneralQuestion: Boolean(isGeneralQuestion),
          analysisResults: analysisResults
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
      const result = await executeSqlQuery(latestSql)
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
          <CardDescription>Ask questions in plain English to generate SQL or analyze your data</CardDescription>
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
                    
                    {message.sql && (
                      <div className="mt-2 bg-background p-2 rounded border font-mono text-sm overflow-x-auto">
                        <pre>{message.sql}</pre>
                      </div>
                    )}

                    {/* Display analysis results for general questions */}
                    {message.isGeneralQuestion && message.analysisResults && message.analysisResults.length > 0 && (
                      <div className="mt-3 border rounded-md p-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="h-4 w-4 text-primary" />
                          <span className="font-medium">Data Analysis Results</span>
                        </div>
                        <div className="space-y-3">
                          {message.analysisResults.map((result, i) => (
                            <div key={i} className="text-sm">
                              {result.data && result.data.length > 0 ? (
                                <div>
                                  <div className="font-medium text-muted-foreground mb-1">
                                    Query {i + 1} Results ({result.data.length} rows):
                                  </div>
                                  <div className="bg-muted p-2 rounded max-h-40 overflow-y-auto">
                                    <pre className="text-xs">{JSON.stringify(result.data, null, 2)}</pre>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-muted-foreground">No data returned for query {i + 1}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {!message.isGeneralQuestion && index === messages.length - 1 && (
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

          {sqlResult && sqlResult.length > 0 && !isExecuting && (
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
