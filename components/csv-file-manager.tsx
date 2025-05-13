"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getCsvFilesList } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Uploaded CSV Files</CardTitle>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="text-muted-foreground">No files uploaded yet.</div>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <li key={file.id} className="flex items-center justify-between border-b pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                  <span className="truncate font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{(file.size / 1024 / 1024) >= 1 ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : `${(file.size / 1024).toFixed(0)} KB`}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(file.createdAt).toLocaleString()}</span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={loading}
                  onClick={() => handleDelete(file.id)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
} 