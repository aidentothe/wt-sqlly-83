// This file is intentionally left empty.
//
// The previous implementation attempted to use VercelDeployer with Mastra, but VercelDeployer is not compatible with the MastraDeployer type required by the Mastra constructor.
//
// If you need to automate deployment with Mastra in the future, ensure you use a deployer that extends MastraDeployer from '@mastra/core'.
// For now, deployment should be handled via the Vercel CLI, API, or a compatible Mastra deployer if one becomes available.

import { Mastra, Agent } from '@mastra/core';
import { createOpenAI } from '@ai-sdk/openai';

// Create the OpenAI provider with your API key
const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Example tool: Echo tool
const echoTool = {
  id: 'echo',
  description: 'Echoes back the input',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string', description: 'The input to echo' }
    },
    required: ['input']
  },
  async run({ input }: { input: string }) {
    return input;
  },
};

// Define your agent
const myAgent = new Agent({
  name: 'assistant',
  instructions: 'You are an assistant that can echo input using the echo tool.',
  model: openaiProvider('gpt-4o'),
  tools: {
    echo: echoTool,
  },
});

// Export the mastra instance
export const mastra = new Mastra({
  agents: {
    assistant: myAgent,
  },
});

