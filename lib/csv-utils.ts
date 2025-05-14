// Define a type for CSV row data
type CsvRowData = Record<string, string | number | boolean | null>

export async function parseCsv(file: File): Promise<{ columns: string[]; rows: CsvRowData[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const csvText = event.target?.result as string
      if (!csvText) {
        reject(new Error("Failed to read CSV file"))
        return
      }

      const lines = csvText.split("\n")
      if (lines.length === 0) {
        reject(new Error("CSV file is empty"))
        return
      }

      const columns = lines[0].split(",").map((column) => column.trim())
      const rows: CsvRowData[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((value) => value.trim())
        if (values.length !== columns.length) continue // Skip rows with incorrect number of columns

        const row: Record<string, string> = {}
        for (let j = 0; j < columns.length; j++) {
          row[columns[j]] = values[j]
        }
        rows.push(row)
      }

      resolve({ columns, rows })
    }

    reader.onerror = () => {
      reject(new Error("Failed to read CSV file"))
    }

    reader.readAsText(file)
  })
}

/**
 * Extract schema information from CSV columns and sample rows
 * This is a client-safe version that doesn't depend on Node.js modules
 */
export function extractSchemaFromCsv(columns: string[], sampleRows: CsvRowData[]) {
  if (!columns || !columns.length || !sampleRows) {
    console.warn("Invalid input to extractSchemaFromCsv")
    return {}
  }

  const schema: Record<string, string> = {}

  columns.forEach((column) => {
    // Determine column type based on sample data
    let type = "text"

    // Check first non-null value to determine type
    for (const row of sampleRows) {
      if (!row) continue

      const value = row[column]
      if (value !== null && value !== undefined) {
        if (typeof value === "number") {
          // Check if it's an integer or float
          type = Number.isInteger(value) ? "integer" : "numeric"
        } else if (typeof value === "boolean") {
          type = "boolean"
        } else if (typeof value === "string") {
          // Check if it's a date
          const datePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/
          if (datePattern.test(value)) {
            type = "timestamp"
          }
        }
        break
      }
    }

    schema[column] = type
  })

  return schema
}

// Get CSV from blob cache
export function getCsvFromCache(fileName: string): string | null {
  return localStorage.getItem(`csv-cache-${fileName}`)
}

// Store CSV in blob cache
export function storeCsvInCache(fileName: string, data: string): void {
  localStorage.setItem(`csv-cache-${fileName}`, data)
}

// Clear CSV from blob cache
export function clearCsvCache(fileName: string): void {
  localStorage.removeItem(`csv-cache-${fileName}`)
}

// Check if CSV exists in cache
export function isCsvInCache(fileName: string): boolean {
  return !!localStorage.getItem(`csv-cache-${fileName}`)
}
