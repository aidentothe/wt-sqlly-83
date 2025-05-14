import { Header } from "@/components/header"
import { MainLayout } from "@/components/main-layout"
import { CsvUploader } from "@/components/csv-uploader"
import { CsvViewer } from "@/components/csv-viewer"
import { SqlPromptBuilder } from "@/components/sql-prompt-builder"
import { MastraChat } from "@/components/mastra-chat"
import { MastraDocs } from "@/components/mastra-docs"
import { Toaster } from "@/components/ui/toaster"
import { CsvFileManager } from "@/components/csv-file-manager"
import SplashText from "@/components/SplashText"
import GridBackground from "@/components/GridBackground"

export default function Home() {
  // Check if the required environment variables are available
  const isMastraConfigured = process.env.NEXT_PUBLIC_MASTRA_AGENT_URL ? true : false

  return (
    <div className="min-h-screen bg-background">
      <GridBackground />
      <SplashText />
      <Header />
      <MainLayout>
        <div className="container mx-auto p-6 space-y-8">
          <CsvUploader />
          <MastraDocs />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <CsvViewer />
              <div className="mt-6">
                <h2 className="text-xl font-bold mb-2">Manage Uploaded CSV Files</h2>
                <p className="mb-4 text-muted-foreground">View and delete your uploaded CSV files below.</p>
                <CsvFileManager />
              </div>
            </div>
            <div className="lg:col-span-1 space-y-6">
              <SqlPromptBuilder />
              <MastraChat />
            </div>
          </div>
        </div>
      </MainLayout>
      <Toaster />
      <footer className="border-t p-4 text-center text-sm text-muted-foreground">
        Made with love powered by Mastra.ai
      </footer>
    </div>
  )
}
