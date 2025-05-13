"use client"

import Papa from "papaparse"

interface ParsedCsv {
  columns: string[]
  rows: Record<string, any>[]
}

// Parse CSV file
export async function parseCsv(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`))
          return
        }

        // Extract column names from the first row
        const columns = results.meta.fields || []

        // Convert data to array of objects
        const rows = results.data as Record<string, any>[]

        resolve({ columns, rows })
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`))
      },
    })
  })
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
