import { Memory } from "@mastra/core/memory";
import { VercelBlobStore } from "@mastra/core/memory/vercel-blob";

const blobStore = new VercelBlobStore({
  token: process.env.BLOB_READ_WRITE_TOKEN!,
  baseUrl: "https://wt-sqlly-sql-converter.memory",
});

export const memory = new Memory({
  storage: {
    ...blobStore,
    // Patch to ensure returned value is always iterable
    async loadMemory(userId: string) {
      const result = await blobStore.loadMemory(userId);
      return Array.isArray(result) ? result : [];
    },
  },
  options: {
    lastMessages: 10,
    semanticRecall: {
      topK: 3,
      messageRange: 2,
    },
  },
});
