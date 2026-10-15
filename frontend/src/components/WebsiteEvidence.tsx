import { AlertTriangle, CheckCircle2, ExternalLink, HelpCircle, Lightbulb, Search } from 'lucide-react'
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
            <p className="text-xs text-slate-500">
              Target URL:{' '}
              <a
                href={evidence.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                {evidence.targetUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
          <div className="flex items-center gap-2">
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
        {(evidence.isIncompleteAnalysis || evidence.isInconclusiveVideoDetection) && (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">Partial Crawl or Detection Inconclusive</p>
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
                </div>
                <div className="shrink-0">
                  <Badge
                    variant="outline"
                    className={
                      page.status === 'crawled'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]'
                        : page.status === 'partial'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 text-[11px]'
                        : page.status === 'inaccessible'
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
