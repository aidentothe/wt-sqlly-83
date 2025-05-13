import { Memory } from "@mastra/core/memory";
import { VercelBlobStore } from "@mastra/core/memory/vercel-blob";

export const memory = new Memory({
  storage: new VercelBlobStore({
    token: process.env.BLOB_READ_WRITE_TOKEN!,
    baseUrl: "https://wt-sqlly-sql-converter.memory",
  }),
  options: {
    lastMessages: 10,
    semanticRecall: {
      topK: 3,
      messageRange: 2,
    },
  },
}); 