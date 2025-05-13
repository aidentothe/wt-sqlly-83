import { Header } from "@/components/header"
import { MainLayout } from "@/components/main-layout"
import { CsvUploader } from "@/components/csv-uploader"
import { CsvViewer } from "@/components/csv-viewer"
import { SqlPromptBuilder } from "@/components/sql-prompt-builder"
import { MastraChat } from "@/components/mastra-chat"
import { MastraDocs } from "@/components/mastra-docs"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MainLayout>
        <div className="container mx-auto p-6 space-y-8">
          <CsvUploader />
          <MastraDocs />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CsvViewer />
            </div>
            <div className="lg:col-span-1 space-y-6">
              <SqlPromptBuilder />
              <MastraChat />
            </div>
          </div>
        </div>
      </MainLayout>
      <Toaster />
    </div>
  )
}
