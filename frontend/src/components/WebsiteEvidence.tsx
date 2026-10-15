import { AlertTriangle, CheckCircle2, ExternalLink, HelpCircle, Lightbulb, Search, Video } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { WebsiteEvidence as WebsiteEvidenceType } from '@/types/analysis'

interface WebsiteEvidenceProps {
  evidence: WebsiteEvidenceType
}

export function WebsiteEvidence({ evidence }: WebsiteEvidenceProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-600" />
              Website Evidence & Audit
            </CardTitle>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
              <span>Target:</span>
              <a
                href={evidence.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                {evidence.targetUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
              {evidence.websiteTitle && (
                <span className="text-slate-700 font-medium truncate max-w-sm">
                  • {evidence.websiteTitle}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {evidence.videoDetectionStatus && (
              <Badge
                variant="outline"
                className={
                  evidence.videoDetectionStatus === 'video_detected'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 text-xs'
                    : evidence.videoDetectionStatus === 'possible_video_detected'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 text-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 text-xs'
                }
              >
                {evidence.videoDetectionStatus === 'video_detected'
                  ? 'Video Detected'
                  : evidence.videoDetectionStatus === 'possible_video_detected'
                  ? 'Possible Video Detected'
                  : 'No Video Detected'}
              </Badge>
            )}
            {evidence.isIncompleteAnalysis && (
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-xs">
                Incomplete Crawl
              </Badge>
            )}
            {evidence.isInconclusiveVideoDetection && (
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-xs">
                Inconclusive Video Detection
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-6">
        {evidence.factualSummary && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
            <span className="font-semibold text-slate-900 block mb-0.5">Website Factual Summary:</span>
            {evidence.factualSummary}
          </div>
        )}

        {evidence.metaDescription && (
          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
            <span className="font-semibold text-slate-900 block mb-0.5">Meta Description:</span>
            {evidence.metaDescription}
          </div>
        )}

        {(evidence.isIncompleteAnalysis || evidence.isInconclusiveVideoDetection) && (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">Partial Crawl or Inconclusive Video Detection</p>
              <p className="text-amber-800">
                Some pages could not be fully evaluated due to client-side rendering or access limitations. Video detection may not reflect videos loaded via dynamic JavaScript wrappers or behind authentication.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Inspected Pages ({evidence.inspectedPages.length})
          </h3>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden">
            {evidence.inspectedPages.map((page, idx) => (
              <div key={idx} className="p-3 bg-slate-50/40 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-slate-900 truncate">
                      {page.title || 'Page'}
                    </span>
                    {page.statusCode && (
                      <span className="px-1.5 py-0.2 bg-slate-200/80 text-slate-700 rounded text-[10px] font-mono">
                        HTTP {page.statusCode}
                      </span>
                    )}
                  </div>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate block text-[11px]"
                  >
                    {page.url}
                  </a>
                  {page.errorMessage && (
                    <p className="text-[11px] text-rose-600">{page.errorMessage}</p>
                  )}
                </div>
                <div className="shrink-0">
                  <Badge
                    variant="outline"
                    className={
                      page.status === 'crawled'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]'
                        : page.status === 'partial'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 text-[11px]'
                        : page.status === 'failed' || page.status === 'inaccessible'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 text-[11px]'
                        : 'bg-slate-100 text-slate-700 border-slate-200 text-[11px]'
                    }
                  >
                    {page.status === 'crawled' ? 'Crawled' : page.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {evidence.discoveredPages && evidence.discoveredPages.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Discovered Subpages ({evidence.discoveredPages.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {evidence.discoveredPages.map((pageUrl, idx) => (
                <a
                  key={idx}
                  href={pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-2.5 py-1 rounded-md border border-slate-200 inline-flex items-center gap-1 transition-colors"
                >
                  <span className="truncate max-w-xs">{pageUrl}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                </a>
              ))}
            </div>
          </div>
        )}

        {evidence.warnings && evidence.warnings.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              Inspection Warnings & Limitations ({evidence.warnings.length})
            </h3>
            <ul className="space-y-1.5 text-xs text-amber-900 bg-amber-50/70 border border-amber-200 rounded-lg p-3">
              {evidence.warnings.map((warning, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {evidence.videoEvidence && evidence.videoEvidence.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5 text-blue-600" />
              Detected Video Assets ({evidence.videoEvidence.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {evidence.videoEvidence.map((v, i) => (
                <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-slate-800 capitalize">
                      {v.detectionType.replace(/_/g, ' ')}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {v.confidence} confidence
                    </Badge>
                  </div>
                  {v.titleOrContext && (
                    <p className="text-slate-600 truncate text-[11px]">{v.titleOrContext}</p>
                  )}
                  {v.videoUrl && (
                    <a
                      href={v.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate block text-[11px]"
                    >
                      {v.videoUrl}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 p-3.5 bg-slate-50/60 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Observed Facts
            </div>
            <p className="text-[11px] text-slate-500">Directly detected from parsed HTML and assets</p>
            <ul className="space-y-2 text-xs text-slate-700 pt-1">
              {evidence.observedFacts.map((fact, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 p-3.5 bg-blue-50/40 border border-blue-100 rounded-lg">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              Inferences
            </div>
            <p className="text-[11px] text-blue-600/80">Reasoned conclusions about marketing opportunities</p>
            <ul className="space-y-2 text-xs text-slate-700 pt-1">
              {evidence.inferences.map((inf, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>{inf}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 p-3.5 bg-slate-50/60 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
              <HelpCircle className="h-4 w-4 text-slate-500" />
              Unknowns
            </div>
            <p className="text-[11px] text-slate-500">Elements beyond public crawl boundary</p>
            <ul className="space-y-2 text-xs text-slate-600 pt-1">
              {evidence.unknowns.map((unk, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span>{unk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
