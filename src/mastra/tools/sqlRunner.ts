import { Tool } from "@mastra/core";
import { Client } from "pg";

export const runSQLTool = new Tool({
  id: "run-sql",
  description: "Executes a raw SQL query against the Supabase database.",
  inputSchema: {
    type: "object",
    properties: {
      sql: {
        type: "string",
        description: "The SQL query to execute",
      },
    },
    required: ["sql"],
  },
  execute: async ({ context }) => {
    const sql = context.sql;
    const client = new Client({
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DATABASE,
      user: "postgres",
      password: process.env.SUPABASE_SERVICE_ROLE_KEY,
      port: 5432,
      ssl: { rejectUnauthorized: false },
    });

    try {
      // Basic validation - ensure it's a SELECT statement for security
      if (!sql.trim().toUpperCase().startsWith("SELECT")) {
        return `Error: Only SELECT queries are allowed for security reasons.`;
      }
      
      // Process the query to handle JSONB->JSON casting
      let processedQuery = sql;
      
      // Handle "SELECT *" queries - convert to row_data::json
      if (processedQuery.toUpperCase().trim().startsWith("SELECT *")) {
        processedQuery = processedQuery.replace(/SELECT\s+\*/i, "SELECT row_data::json");
      }
      // Handle "SELECT row_data" without a cast - add ::json cast
      else if (processedQuery.toUpperCase().includes("SELECT ROW_DATA") && 
               !processedQuery.toUpperCase().includes("ROW_DATA::JSON") &&
               !processedQuery.match(/ROW_DATA->>'\w+'/)) {
        processedQuery = processedQuery.replace(/row_data(?!\s*::)/gi, "row_data::json");
      }
      
      // Check for IP comparisons without inet casting
      if (processedQuery.includes("row_data->>'IP'") && 
          (processedQuery.includes(" > '") || processedQuery.includes(" < '") || 
           processedQuery.includes(" >= '") || processedQuery.includes(" <= '"))) {
        
        if (!processedQuery.includes("::inet")) {
          processedQuery = processedQuery.replace(
            /(row_data->>'IP')\s*([><]=?)\s*'([^']+)'/g, 
            "$1::inet $2 '$3'::inet"
          );
        }
      }
      
      await client.connect();
      console.log("Executing SQL query:", processedQuery);
      const result = await client.query(processedQuery);
      await client.end();
      
      return JSON.stringify(result.rows, null, 2);
    } catch (err: any) {
      // If there's a type error with JSONB vs JSON, try to fix it automatically
      if (err.message && (
          err.message.includes("type jsonb does not match expected type json") || 
          err.message.includes("structure of query does not match function result type"))) {
        
        try {
          // Modify the query to add ::json cast
          let fixedQuery = sql;
          if (fixedQuery.match(/SELECT\s+row_data\b/i) && !fixedQuery.match(/row_data::json/i)) {
            fixedQuery = fixedQuery.replace(/row_data\b(?!\s*::json)/i, "row_data::json");
            
            // Try with the fixed query
            await client.connect();
            console.log("Retrying with fixed query:", fixedQuery);
            const result = await client.query(fixedQuery);
            await client.end();
            
            return `Note: Automatically fixed JSON type casting in query.\n${JSON.stringify(result.rows, null, 2)}`;
          }
        } catch (secondErr: any) {
          return `SQL execution error: ${err.message}. Tried to fix but failed with: ${secondErr.message}`;
        }
      }
      
      // Return the original error if no fix was attempted or if it's not a JSON type error
      return `SQL execution error: ${err.message}`;
    } finally {
      // Ensure client is closed if it's still connected
      try {
        const clientState = client as any;
        if (clientState && clientState._connected) {
          await client.end();
        }
      } catch (closeErr) {
        console.error("Error closing database connection:", closeErr);
      }
    }
  },
}); 