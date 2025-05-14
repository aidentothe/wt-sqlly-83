import { createClient } from "@supabase/supabase-js";
// uuidv4 is not used in this file, removing the unused import
// import { v4 as uuidv4 } from "uuid";

// Create a single supabase client for server-side actions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Ensure this instance is for server-side operations.
// For row-level security, you might use the service_role key on the server
// or a user-specific session if applicable to the action.
// For this refactor, we'll keep the anon key as per the original setup.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Rename CSV file's original_filename
export async function renameCsvFile(fileId: string, newOriginalFilename: string) {
  try {
    // Check if the new filename already exists for a DIFFERENT file
    const existingFileWithNewName = await supabase
      .from("csv_files")
      .select("id")
      .eq("original_filename", newOriginalFilename)
      .single();

    if (existingFileWithNewName.data && existingFileWithNewName.data.id !== fileId) {
      throw new Error(`File with name \"${newOriginalFilename}\" already exists.`);
    }

    // Proceed with the update
    const { data, error } = await supabase
      .from("csv_files")
      .update({ original_filename: newOriginalFilename })
      .eq("id", fileId)
      .select("id, original_filename") // Select the updated record to confirm
      .single();

    if (error) {
      console.error("Error updating filename in Supabase (server-side):", error);
      throw new Error(error.message || "Failed to update filename in Supabase.");
    }

    if (!data) {
      throw new Error("Failed to update filename, no record returned after update.");
    }

    return { success: true, updatedFile: data };
  } catch (error) {
    console.error("Error renaming CSV file (server-side):", error);
    // Ensure the error is re-thrown to be handled by the caller
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred while renaming the file.");
  }
} 