import { AlertCircle, CheckCircle2, ExternalLink, MapPin, Video } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { VideoRecommendation } from '@/types/analysis'

interface VideoIdeaCardProps {
  recommendation: VideoRecommendation
}

export function VideoIdeaCard({ recommendation }: VideoIdeaCardProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between">
      <CardHeader className="pb-3 space-y-2 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold px-2 py-0.5"
          >
            Recommendation #{recommendation.recommendationNumber}
          </Badge>
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <Video className="h-3.5 w-3.5 text-blue-600" />
            <span className="font-medium text-slate-700">{recommendation.videoType}</span>
          </div>
        </div>

        <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium text-slate-700">Placement: </span>
            <span>{recommendation.suggestedPlacement}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-3.5 space-y-3.5 text-xs flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wide">
              Strategic Rationale
            </h4>
            <p className="text-slate-600 leading-relaxed">
              {recommendation.reason}
            </p>
          </div>

          <div className="space-y-1 bg-blue-50/30 p-2.5 rounded-lg border border-blue-100/70">
            <div className="flex items-center gap-1.5 font-semibold text-blue-950 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
              Supporting Evidence
            </div>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              {recommendation.supportingEvidence}
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Source Page:</span>
            <a
              href={recommendation.sourcePageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium truncate max-w-[200px]"
            >
              <span className="truncate">{recommendation.sourcePageUrl}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>

          {recommendation.evidenceLimitations && (
            <div className="flex items-start gap-1 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
              <AlertCircle className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
              <span>Limitation: {recommendation.evidenceLimitations}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
