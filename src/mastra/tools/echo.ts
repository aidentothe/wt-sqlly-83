import { Tool } from "@mastra/core/tool";

export const echoTool = new Tool({
  name: "echo",
  description: "Echoes back the input string.",
  parameters: {
    type: "object",
    properties: {
      message: { type: "string", description: "Message to echo" },
    },
    required: ["message"],
  },
  func: async ({ message }) => {
    return [`Echo: ${message}`];
  },
}); 