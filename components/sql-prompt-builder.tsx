"use client"

import { CardFooter } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Play, Save, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { useCsvStore } from "@/hooks/use-csv-store"
import { getSqlTemplates, executeSqlQuery, saveSqlQuery } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface SqlTemplate {
  id: string
  query_text: string
  is_template: boolean
}

// Define a type for SQL query results
type SqlResultRow = Record<string, string | number | boolean | null>

interface QueryResult {
  data: SqlResultRow[] | null
  error: string | null
}

export function SqlPromptBuilder() {
  const { toast } = useToast()
  const { csvFile } = useCsvStore()
  const [sqlTemplates, setSqlTemplates] = useState<SqlTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [sqlQuery, setSqlQuery] = useState<string>("")
  const [queryHistory, setQueryHistory] = useState<string[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [queryResult, setQueryResult] = useState<QueryResult>({
    data: null,
    error: null,
  })
  const [activeTab, setActiveTab] = useState<string>("editor")

  // Load SQL templates
  useEffect(() => {
    async function loadTemplates() {
      try {
        const templates = await getSqlTemplates()
        setSqlTemplates(templates)
      } catch (error) {
        console.error("Failed to load SQL templates:", error)
      }
    }

    loadTemplates()
  }, [])

  // Update SQL query when template is selected
  useEffect(() => {
    if (selectedTemplate && csvFile) {
      const template = sqlTemplates.find((t) => t.id === selectedTemplate)
      if (template) {
        let query = template.query_text

        // Replace placeholders with actual values
        query = query.replace(/{{fileId}}/g, csvFile.id)
        query = query.replace(/{{columns}}/g, csvFile.columns.join(", "))
        query = query.replace(/{{groupColumns}}/g, csvFile.columns[0])
        query = query.replace(/{{orderColumn}}/g, csvFile.columns[0])
        query = query.replace(/{{orderDirection}}/g, "ASC")
        query = query.replace(/{{whereCondition}}/g, `${csvFile.columns[0]} IS NOT NULL`)

        setSqlQuery(query)
      }
    }
  }, [selectedTemplate, csvFile, sqlTemplates])

  // Execute SQL query
  const handleExecuteQuery = async () => {
    if (!sqlQuery.trim() || !csvFile) {
      toast({
        variant: "destructive",
        title: "Cannot execute query",
        description: "Please enter a SQL query and upload a CSV file first.",
      })
      return
    }

    setIsExecuting(true)
    setQueryResult({ data: null, error: null })

    try {
      const result = await executeSqlQuery(sqlQuery)
      setQueryResult({ data: result, error: null })

      // Add to history if not already present
      if (!queryHistory.includes(sqlQuery)) {
        setQueryHistory((prev) => [sqlQuery, ...prev].slice(0, 10))
      }

      toast({
        title: "Query executed successfully",
        description: `Returned ${result.length} rows`,
      })
    } catch (error) {
      console.error("Query execution error:", error)
      setQueryResult({
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      })

      toast({
        variant: "destructive",
        title: "Query execution failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  // Save SQL query
  const handleSaveQuery = async () => {
    if (!sqlQuery.trim() || !csvFile) {
      toast({
        variant: "destructive",
        title: "Cannot save query",
        description: "Please enter a SQL query and upload a CSV file first.",
      })
      return
    }

    try {
      await saveSqlQuery(sqlQuery, csvFile.id)
      toast({
        title: "Query saved successfully",
        description: "Your SQL query has been saved.",
      })
    } catch (error) {
      console.error("Failed to save query:", error)
      toast({
        variant: "destructive",
        title: "Failed to save query",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>SQL Prompt Builder</CardTitle>
          <CardDescription>Build and execute SQL queries against your CSV data</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Template</label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate} disabled={!csvFile}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {sqlTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.query_text.split(" ").slice(0, 3).join(" ")}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">SQL Query</label>
                <Textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="Enter your SQL query here..."
                  className="font-mono h-32"
                  disabled={!csvFile}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button onClick={handleExecuteQuery} disabled={!csvFile || isExecuting} className="flex-1">
                  <Play className="mr-2 h-4 w-4" />
                  {isExecuting ? "Executing..." : "Run Query"}
                </Button>
                <Button variant="outline" onClick={handleSaveQuery} disabled={!csvFile}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="history">
              <ScrollArea className="h-64">
                {queryHistory.length > 0 ? (
                  <div className="space-y-2">
                    {queryHistory.map((query, index) => (
                      <div
                        key={index}
                        className="p-2 border rounded-md text-sm cursor-pointer hover:bg-accent"
                        onClick={() => {
                          setSqlQuery(query)
                          setActiveTab("editor")
                        }}
                      >
                        <div className="font-mono truncate">{query}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No query history yet
                  </div>
                )}
              </ScrollArea>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setQueryHistory([])}
                disabled={queryHistory.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear History
              </Button>
            </TabsContent>
          </Tabs>

          {queryResult.data && queryResult.data.length > 0 && (
            <div className="mt-4 border rounded-md">
              <h3 className="text-sm font-medium p-2 border-b">Query Result</h3>
              <div className="max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(queryResult.data[0]).map((column) => (
                        <TableHead key={column} className="text-center">
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queryResult.data.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {Object.values(row).map((value, colIndex) => (
                          <TableCell key={`${rowIndex}-${colIndex}`} className="text-center">
                            {value !== undefined && value !== null ? String(value) : ""}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {queryResult.error && (
            <div className="mt-4 border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2">Query Error</h3>
              <div className="text-destructive text-sm">{queryResult.error}</div>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          {csvFile ? `Using file: ${csvFile.name}` : "Upload a CSV file to get started"}
        </CardFooter>
      </Card>
    </motion.div>
  )
}
