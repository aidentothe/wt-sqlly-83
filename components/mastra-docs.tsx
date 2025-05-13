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
