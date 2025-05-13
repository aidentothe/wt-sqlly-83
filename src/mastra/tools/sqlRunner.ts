import { Tool } from "@mastra/core/tool";
import { Client } from "pg";

export const runSQLTool = new Tool({
  name: "run-sql",
  description: "Executes a raw SQL query against the Supabase database.",
  parameters: {
    type: "object",
    properties: {
      sql: {
        type: "string",
        description: "The SQL query to execute",
      },
    },
    required: ["sql"],
  },
  func: async ({ sql }: { sql: string }) => {
    const client = new Client({
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DATABASE,
      user: "postgres",
      password: process.env.SUPABASE_SERVICE_ROLE_KEY,
      port: 5432,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      const result = await client.query(sql);
      await client.end();
      return [JSON.stringify(result.rows, null, 2)];
    } catch (err: any) {
      return [`SQL execution error: ${err.message}`];
    }
  },
}); 