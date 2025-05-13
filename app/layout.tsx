import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Background3DWrapper from "@/components/Background3DWrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "wt-sqlly - CSV to SQL Query Builder",
  description: "Upload CSVs and build SQL queries with ease",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gradient-to-b from-blue-200 to-white min-h-screen relative`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Background3DWrapper />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
