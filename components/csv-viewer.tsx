"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useCsvStore } from "@/hooks/use-csv-store"
import { getCsvFilesList, getCsvDataByFileId, getCsvFileById } from "@/lib/supabase"

const PAGE_SIZE = 20

export function CsvViewer() {
  const { toast } = useToast()
  const { csvFile, csvData, setCsvFile, setCsvData } = useCsvStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filteredData, setFilteredData] = useState(csvData)
  const [totalRows, setTotalRows] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [availableFiles, setAvailableFiles] = useState<Array<{ id: string; name: string }>>([])
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Load available CSV files
  useEffect(() => {
    async function loadCsvFiles() {
      try {
        const files = await getCsvFilesList()
        setAvailableFiles(files)
      } catch (error) {
        console.error("Failed to load CSV files:", error)
        toast({
          variant: "destructive",
          title: "Error loading CSV files",
          description: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    loadCsvFiles()
  }, [toast])

  // Load CSV data when file changes
  useEffect(() => {
    async function loadCsvData() {
      if (!csvFile) return

      setIsLoading(true)
      try {
        // Get total row count from csvFile
        setTotalRows(csvFile.rowCount)

        // Load first page of data
        const data = await getCsvDataByFileId(csvFile.id, PAGE_SIZE, 0)
        setCsvData(data)
        setCurrentPage(1)
      } catch (error) {
        console.error("Failed to load CSV data:", error)
        toast({
          variant: "destructive",
          title: "Error loading CSV data",
          description: error instanceof Error ? error.message : "Unknown error",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadCsvData()
  }, [csvFile, setCsvData, toast])

  // Handle page change
  const handlePageChange = async (page: number) => {
    if (!csvFile || page === currentPage || page < 1 || page > Math.ceil(totalRows / PAGE_SIZE)) return

    setIsLoading(true)
    try {
      const offset = (page - 1) * PAGE_SIZE
      const data = await getCsvDataByFileId(csvFile.id, PAGE_SIZE, offset)
      setCsvData(data)
      setCurrentPage(page)
    } catch (error) {
      console.error("Failed to load page data:", error)
      toast({
        variant: "destructive",
        title: "Error loading page data",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file selection
  const handleFileSelect = async (fileId: string) => {
    if (fileId === csvFile?.id) return

    const selectedFile = availableFiles.find((file) => file.id === fileId)
    if (!selectedFile) return

    setIsLoading(true)
    try {
      // Get file metadata
      const fileMetadata = await getCsvFileById(fileId)
      setCsvFile({
        id: fileId,
        name: selectedFile.name,
        size: fileMetadata.size_bytes,
        columns: fileMetadata.column_names,
        rowCount: fileMetadata.row_count,
      })
    } catch (error) {
      console.error("Failed to select CSV file:", error)
      toast({
        variant: "destructive",
        title: "Error selecting CSV file",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and sort data when csvData, searchTerm, or sort parameters change
  useEffect(() => {
    if (!csvData.length) {
      setFilteredData([])
      return
    }

    let result = [...csvData]

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      result = result.filter((row) =>
        Object.values(row).some((value) => value && value.toString().toLowerCase().includes(lowerSearchTerm)),
      )
    }

    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const aValue = a[sortColumn]
        const bValue = b[sortColumn]

        // Handle numeric values
        if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
          return sortDirection === "asc" ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue)
        }

        // Handle string values
        const aString = String(aValue || "")
        const bString = String(bValue || "")
        return sortDirection === "asc" ? aString.localeCompare(bString) : bString.localeCompare(aString)
      })
    }

    setFilteredData(result)
  }, [csvData, searchTerm, sortColumn, sortDirection])

  // Calculate pagination
  const totalPages = Math.ceil(totalRows / PAGE_SIZE)

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // Generate page options for dropdown
  const pageOptions = Array.from({ length: totalPages }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Page ${i + 1}`,
  }))

  if (!csvFile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CSV Viewer</CardTitle>
          <CardDescription>Upload a CSV file to view its contents</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          No CSV file uploaded yet
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>CSV Viewer</CardTitle>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <CardDescription>
                {csvFile.name} • {totalRows.toLocaleString()} rows • {csvFile.columns.length} columns
              </CardDescription>

              {availableFiles.length > 0 && (
                <Select value={csvFile.id} onValueChange={handleFileSelect}>
                  <SelectTrigger className="w-full sm:w-[220px] mb-4">
                    <SelectValue placeholder="Select CSV file" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFiles.map((file) => (
                      <SelectItem key={file.id} value={file.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="truncate">{file.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="relative mt-2 mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search data..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto h-[400px]" ref={tableContainerRef}>
              <Table>
                <TableHeader>
                  <TableRow className="py-2 px-4">
                    {csvFile.columns.map((column) => (
                      <TableHead key={column} className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 font-medium w-full justify-center"
                          onClick={() => handleSort(column)}
                        >
                          {column}
                          {sortColumn === column && (
                            <ArrowUpDown
                              className={`ml-2 h-4 w-4 ${sortDirection === "asc" ? "rotate-0" : "rotate-180"}`}
                            />
                          )}
                        </Button>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map((row, rowIndex) => (
                      <TableRow key={rowIndex} className="py-2 px-4">
                        {csvFile.columns.map((column, colIndex) => (
                          <TableCell key={`${rowIndex}-${colIndex}`} className="text-center">
                            {row[column] !== undefined && row[column] !== null ? String(row[column]) : ""}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="py-2 px-4">
                      <TableCell colSpan={csvFile.columns.length} className="h-24 text-center">
                        {isLoading ? "Loading data..." : "No results found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground mt-4">
              Showing page {currentPage} of {Math.max(1, totalPages)} ({totalRows.toLocaleString()} total rows)
            </div>
            <div className="flex items-center mt-2 space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Select
                value={currentPage.toString()}
                onValueChange={(value) => handlePageChange(Number.parseInt(value))}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Page..." />
                </SelectTrigger>
                <SelectContent>
                  {pageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </motion.div>
  )
}
