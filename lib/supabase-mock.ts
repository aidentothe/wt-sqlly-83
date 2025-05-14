// This is a mock version of the Supabase client for build time
import { createClient } from "@supabase/supabase-js";

// Create a mock client with dummy values for build-time only
export const supabase = createClient(
  "https://mock-project-url.supabase.co",
  "mock-anon-key"
);

// Mock functions that would be called during build
export async function renameCsvFile(fileId: string, newOriginalFilename: string) {
  return { success: true, updatedFile: { id: fileId, original_filename: newOriginalFilename } };
} 