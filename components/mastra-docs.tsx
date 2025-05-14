"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function MastraDocs() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <CardTitle className="flex items-center justify-between">
          <span>How Mastra.ai Integration Works</span>
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </CardTitle>
        <CardDescription>Learn how the natural language to SQL conversion works</CardDescription>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="overview">
              <AccordionTrigger>Overview</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Mastra.ai provides a chat-driven SQL assistant that converts plain-English prompts into valid,
                  parameterized SQL queries against your Supabase database. The integration supplies your table schema
                  and sample data to the agent, ensuring accurate query generation.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="openai">
              <AccordionTrigger>OpenAI Integration</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Mastra.ai leverages OpenAI's powerful language models to understand natural language queries and
                  convert them to SQL. Your OpenAI API key is used to access these models, enabling the AI to:
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Understand the intent behind your questions</li>
                  <li>Analyze your database schema</li>
                  <li>Generate syntactically correct SQL</li>
                  <li>Provide explanations of the generated queries</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="context">
              <AccordionTrigger>Context Delivery</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">For each query, the integration automatically:</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Extracts your table schema (column names and data types)</li>
                  <li>Provides up to 50 sample rows from your data</li>
                  <li>Sends this context with each prompt to the Mastra agent</li>
                  <li>Ensures the agent understands your specific data structure</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="implementation">
              <AccordionTrigger>Implementation Details</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">The integration consists of:</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2 space-y-1">
                  <li>
                    <code>MastraClient</code>: Handles communication with the Mastra API, including retries and backoff
                  </li>
                  <li>API Route: Processes requests and forwards them to the Mastra service</li>
                  <li>UI Component: Provides a chat interface for interacting with the agent</li>
                  <li>Schema Extraction: Automatically determines column types from your data</li>
                  <li>OpenAI Authentication: Securely passes your API key to the Mastra service</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="database">
              <AccordionTrigger>Database Structure</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">Important details about the database structure:</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2 space-y-1">
                  <li>CSV data is stored in a table named <code>csv_data</code></li>
                  <li>Each record has a <code>file_id</code> (UUID) identifying the uploaded file</li>
                  <li>The actual data is stored in a JSONB column called <code>row_data</code></li>
                  <li>
                    <span className="font-medium">IMPORTANT:</span> When querying full rows, you must cast <code>row_data</code> to JSON:
                    <pre className="bg-muted p-2 rounded text-xs mt-1 overflow-x-auto">
                      SELECT row_data::json FROM csv_data WHERE file_id = &#39;[UUID]&#39;
                    </pre>
                  </li>
                  <li>
                    To access fields in the JSON data, use the <code>{'->'}</code> and <code>{'->>'}</code> operators:
                    <pre className="bg-muted p-2 rounded text-xs mt-1 overflow-x-auto">
                      SELECT row_data{'->>'}&#39;Name&#39; as name FROM csv_data WHERE file_id = &#39;[UUID]&#39; AND row_data{'->>'}&#39;Name&#39; = &#39;John&#39;
                    </pre>
                  </li>
                  <li>
                    For numeric comparisons, cast the text values:
                    <pre className="bg-muted p-2 rounded text-xs mt-1 overflow-x-auto">
                      SELECT row_data::json FROM csv_data WHERE (row_data{'->>'}&#39;Age&#39;)::numeric {'>'} 30
                    </pre>
                  </li>
                  <li>
                    For IP address comparisons, use the inet type:
                    <pre className="bg-muted p-2 rounded text-xs mt-1 overflow-x-auto">
                      SELECT row_data::json FROM csv_data WHERE (row_data{'->>'}&#39;IP&#39;)::inet {'>'} &#39;10.0.0.1&#39;::inet
                    </pre>
                  </li>
                  <li>
                    <span className="font-medium">Type Handling:</span> The database uses JSONB internally, but the Supabase RPC function
                    expects JSON results. The SQL Prompt Builder will automatically add the <code>::json</code> cast when needed.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="usage">
              <AccordionTrigger>Usage Examples</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">You can ask questions like:</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2 space-y-1">
                  <li>"Show me all records where the age is greater than 30"</li>
                  <li>"Count how many people are from each country"</li>
                  <li>"Find the average salary grouped by department"</li>
                  <li>"List the top 5 customers by total purchases"</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  The agent will convert these natural language queries into proper SQL that you can execute directly.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      )}
    </Card>
  )
}
