"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getCsvFilesList, getFileIdByOriginalFilename } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { FilePenLine } from 'lucide-react';

export function CsvFileManager() {
  const [files, setFiles] = useState<{ id: string; name: string; size: number; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const list = await getCsvFilesList();
      setFiles(list);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load files",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = async (fileId: string) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/mastra/delete-csv-file", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete file");
      }
      toast({ title: "File deleted" });
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete file",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (fileId: string, currentName: string) => {
    const newName = window.prompt("Enter new filename:", currentName);

    if (!newName || newName.trim() === "") {
      toast({ title: "Rename cancelled", description: "No new name provided." });
      return;
    }

    const trimmedNewName = newName.trim();

    if (trimmedNewName === currentName) {
      toast({ title: "No change", description: "The new name is the same as the current name." });
      return;
    }

    // Client-side check for existing name (optional, but good for UX)
    const existingFile = files.find(f => f.name === trimmedNewName && f.id !== fileId);
    if (existingFile) {
      toast({
        variant: "destructive",
        title: "Filename already exists",
        description: `A file named "${trimmedNewName}" already exists. Please choose a different name.`,
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/mastra/rename-csv-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, newOriginalFilename: trimmedNewName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to rename file");
      }

      toast({ title: "File renamed", description: `"${currentName}" was renamed to "${trimmedNewName}".` });
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === fileId ? { ...f, name: data.updatedFile.original_filename } : f // Use name from API response
        )
      );
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Rename failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Uploaded CSV Files</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Delete All Files Button */}
        <div className="mb-4">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            disabled={files.length === 0 || loading}
            onClick={async () => {
              if (!window.confirm("Are you sure you want to delete ALL files? This cannot be undone.")) return;
              setLoading(true);
              try {
                const res = await fetch("/api/mastra/delete-csv-file", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ deleteAll: true }),
                });
                if (!res.ok) {
                  const data = await res.json();
                  throw new Error(data.error || "Failed to delete all files");
                }
                toast({ title: "All files deleted" });
                setFiles([]);
              } catch (error) {
                toast({
                  variant: "destructive",
                  title: "Failed to delete all files",
                  description: error instanceof Error ? error.message : "Unknown error",
                });
              } finally {
                setLoading(false);
              }
            }}
          >
            Delete All Files
          </Button>
        </div>
        {files.length === 0 ? (
          <div className="text-muted-foreground">No files uploaded yet.</div>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <li key={file.id} className="flex items-center justify-between border-b pb-2 gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                  <span className="truncate font-medium" title={file.name}>{file.name}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{(file.size / 1024 / 1024) >= 1 ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : `${(file.size / 1024).toFixed(0)} KB`}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(file.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={() => handleRename(file.id, file.name)}
                    title="Rename file"
                  >
                    <FilePenLine className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={loading}
                    onClick={() => handleDelete(file.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
} 