import { Activity, FileText, Lightbulb, Video } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SummaryMetrics } from '@/types/analysis'

interface AnalysisSummaryProps {
  summary: SummaryMetrics
  isPreviewDemo?: boolean
}

export function AnalysisSummary({ summary, isPreviewDemo }: AnalysisSummaryProps) {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 tracking-tight">
          Analysis Summary
        </h2>
        {isPreviewDemo && (
          <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            Simulated Preview Data
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">Pages Analyzed</p>
              <p className="text-2xl font-bold text-slate-900">{summary.pagesAnalyzed}</p>
              <p className="text-[11px] text-slate-400">Public HTML pages</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">Videos Detected</p>
              <p className="text-2xl font-bold text-slate-900">
                {typeof summary.videosDetected === 'number'
                  ? summary.videosDetected
                  : summary.videosDetected}
              </p>
              <p className="text-[11px] text-slate-400">
                {summary.videosDetected === 'Inconclusive'
                  ? 'Verification partial'
                  : 'Embedded video tags'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Video className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">Video Opportunities</p>
              <p className="text-2xl font-bold text-blue-600">{summary.opportunitiesIdentified}</p>
              <p className="text-[11px] text-slate-400">High-leverage slots</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Lightbulb className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">Analysis Status</p>
              <div className="pt-1">
                <Badge
                  variant="outline"
                  className={
                    summary.analysisStatus === 'Complete'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium'
                      : summary.analysisStatus === 'Partial'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 font-medium'
                      : 'bg-blue-50 text-blue-700 border-blue-200 font-medium'
                  }
                >
                  {summary.analysisStatus}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400">
                {isPreviewDemo ? 'Simulated preview' : 'Crawl verified'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
