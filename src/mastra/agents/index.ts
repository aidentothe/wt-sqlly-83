import { Agent } from "@mastra/core/agent";
import { createOpenAI } from "@ai-sdk/openai";
import { memory } from "../memory";
import { tools } from "../tools";

const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const agentInstance = new Agent({
  name: "wt-sqlly-sql-converter",
  instructions: `
    You are an SQL assistant that helps users convert natural language queries into SQL.
    When given a database schema and sample data, generate appropriate SQL queries.
    Always return valid SQL that can be executed against the provided schema.
    Format your response with the SQL query inside a code block like this:
    \`\`\`sql
    SELECT * FROM table;
    \`\`\`
    Do not execute queries yourself. The user may edit and run the final SQL using the 'run-sql' tool.
  `,
  model: openaiProvider("gpt-4o"),
  memory,
  tools,
});
