import { CheckCircle2, Globe, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface AnalysisLoadingProps {
  targetUrl: string
}

export function AnalysisLoading({ targetUrl }: AnalysisLoadingProps) {
  const steps = [
    { label: 'Connecting to target website', done: true },
    { label: 'Inspecting HTML structure & copy', done: true },
    { label: 'Scanning for video embeds & multimedia tags', active: true },
    { label: 'Formulating evidence-based recommendations', pending: true }
  ]

  return (
    <Card className="border-slate-200 bg-white shadow-xs max-w-xl mx-auto my-6">
      <CardContent className="p-6 space-y-6 text-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center animate-pulse">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900">
              Analyzing Website Structure
            </h3>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              Target: <span className="font-medium text-slate-700">{targetUrl}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2.5 text-left max-w-sm mx-auto bg-slate-50/80 p-3.5 rounded-lg border border-slate-200">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs">
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : step.active ? (
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
              ) : (
                <span className="h-4 w-4 rounded-full border border-slate-300 shrink-0 inline-block" />
              )}
              <span
                className={
                  step.done
                    ? 'text-slate-800 font-medium'
                    : step.active
                    ? 'text-blue-700 font-medium'
                    : 'text-slate-400'
                }
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-400">
          This usually takes a few seconds while publicly accessible pages are parsed.
        </p>
      </CardContent>
    </Card>
  )
}
