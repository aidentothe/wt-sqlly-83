import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import dynamic from 'next/dynamic'

// Dynamically import Background3D with ssr: false
const Background3D = dynamic(() => import('@/components/Background3D'), { 
  ssr: false,
  // Optional: add a loading component if needed while Background3D loads
  // loading: () => <p>Loading 3D background...</p> 
})

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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Background3D />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
