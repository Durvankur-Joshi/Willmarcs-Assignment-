import { AlertCircle, AlertTriangle, RefreshCw, ServerCrash, Sparkles, WifiOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { AnalysisErrorDetails } from '@/types/analysis'

interface AnalysisErrorProps {
  error: AnalysisErrorDetails
  onRetry?: () => void
  onRunDemo?: () => void
}

export function AnalysisError({ error, onRetry, onRunDemo }: AnalysisErrorProps) {
  function getIcon() {
    switch (error.type) {
      case 'invalid_url':
        return <AlertCircle className="h-6 w-6 text-rose-600" />
      case 'inaccessible':
        return <WifiOff className="h-6 w-6 text-rose-600" />
      case 'backend_unavailable':
        return <ServerCrash className="h-6 w-6 text-amber-600" />
      default:
        return <AlertTriangle className="h-6 w-6 text-rose-600" />
    }
  }

  return (
    <Card className="border-rose-200 bg-white shadow-xs max-w-xl mx-auto my-6">
      <CardContent className="p-6 space-y-4 text-center">
        <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
          {getIcon()}
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900">{error.title}</h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
            {error.message}
          </p>
        </div>

        {error.suggestedAction && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 text-left max-w-md mx-auto">
            <span className="font-semibold text-slate-700 block mb-0.5">Recommended Next Step:</span>
            {error.suggestedAction}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
          {onRetry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="text-xs border-slate-200 hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Try Again
            </Button>
          )}

          {onRunDemo && (
            <Button
              type="button"
              size="sm"
              onClick={onRunDemo}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              View Demo Sample Instead
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
