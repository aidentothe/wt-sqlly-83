"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CsvFile {
  id: string
  name: string
  size: number
  columns: string[]
  rowCount: number
}

interface CsvStore {
  csvFile: CsvFile | null
  csvData: Record<string, any>[]
  setCsvFile: (file: CsvFile | null) => void
  setCsvData: (data: Record<string, any>[]) => void
  clearCsvData: () => void
}

export const useCsvStore = create<CsvStore>()(
  persist(
    (set) => ({
      csvFile: null,
      csvData: [],
      setCsvFile: (file) => set({ csvFile: file }),
      setCsvData: (data) => set({ csvData: data }),
      clearCsvData: () => set({ csvFile: null, csvData: [] }),
    }),
    {
      name: "csv-store",
    },
  ),
)
