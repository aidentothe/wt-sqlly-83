import { echoTool } from "./echo";
import { runSQLTool } from "./sqlRunner";

export const tools = {
  echo: echoTool,
  "run-sql": runSQLTool,
}; 