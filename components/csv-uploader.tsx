"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileUp, AlertCircle, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useCsvStore } from "@/hooks/use-csv-store"
import { uploadCsv } from "@/lib/supabase"
import { parseCsv } from "@/lib/csv-utils"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function CsvUploader() {
  const { toast } = useToast()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const { setCsvData, setCsvFile } = useCsvStore()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setUploadStatus("error")
        setErrorMessage(`File size exceeds the 5MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
        toast({
          variant: "destructive",
          title: "File too large",
          description: `Maximum file size is 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
        })
        return
      }

      try {
        setUploadStatus("uploading")
        setUploadProgress(10)

        // Parse CSV
        const parsedData = await parseCsv(file)
        setUploadProgress(50)

        // Store in blob cache
        const fileUrl = URL.createObjectURL(file)
        localStorage.setItem(`csv-cache-${file.name}`, fileUrl)
        setUploadProgress(70)

        // Upload to Supabase
        const result = await uploadCsv(file, parsedData)
        setUploadProgress(100)

        // Update store
        setCsvFile({
          id: result.id,
          name: file.name,
          size: file.size,
          columns: parsedData.columns,
          rowCount: parsedData.rows.length,
        })
        setCsvData(parsedData.rows.slice(0, 100))

        setUploadStatus("success")
        toast({
          title: "CSV uploaded successfully",
          description: `${file.name} has been uploaded and parsed.`,
        })
      } catch (error) {
        console.error("Upload error:", error)
        setUploadStatus("error")
        setErrorMessage(error instanceof Error ? error.message : "Unknown error")
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Unknown error occurred",
        })
      }
    },
    [setCsvData, setCsvFile, toast],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    maxFiles: 1,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          CSV Uploader
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/20 hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-2">
            <FileUp className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              {isDragActive ? "Drop the CSV file here" : "Drag & drop a CSV file here, or click to select"}
            </p>
            <p className="text-xs text-muted-foreground">Maximum file size: 5MB</p>
          </div>
        </div>

        {uploadStatus !== "idle" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4">
            {uploadStatus === "uploading" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uploading...</span>
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {uploadStatus === "success" && (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="h-5 w-5" />
                <span>Success! CSV uploaded and parsed.</span>
              </div>
            )}

            {uploadStatus === "error" && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>{errorMessage || "An error occurred during upload."}</span>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setUploadStatus("idle")
                setUploadProgress(0)
                setErrorMessage("")
              }}
            >
              Reset
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
