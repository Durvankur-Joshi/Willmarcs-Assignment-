import { Button } from "@/components/ui/button"
import { CheckCircle2, Video } from "lucide-react"

export default function App() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground">
      <div className="max-w-md w-full border border-border rounded-xl p-8 shadow-sm flex flex-col items-center text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Video className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Video Opportunity Analyzer
        </h1>
        <p className="text-sm text-muted-foreground">
          Phase 1 setup complete. Frontend and backend scaffolding are ready for implementation.
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>Vite + React + Tailwind CSS + shadcn/ui + Lucide</span>
        </div>
        <Button variant="outline" size="sm">
          Phase 1 Ready
        </Button>
      </div>
    </div>
  )
}
