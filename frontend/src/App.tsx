import * as React from 'react'
import {
  CheckCircle2,
  FileSearch,
  Globe,
  Mail,
  RotateCcw,
  Sparkles,
  Video
} from 'lucide-react'
import { WebsiteForm } from '@/components/WebsiteForm'
import { AnalysisSummary } from '@/components/AnalysisSummary'
import { WebsiteEvidence } from '@/components/WebsiteEvidence'
import { VideoIdeaCard } from '@/components/VideoIdeaCard'
import { OutreachEmail } from '@/components/OutreachEmail'
import { AnalysisLoading } from '@/components/AnalysisLoading'
import { AnalysisError } from '@/components/AnalysisError'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  analyzeWebsiteReal,
  checkBackendHealth,
  generatePreviewData
} from '@/lib/api'
import type {
  AnalysisErrorDetails,
  AnalysisResult,
  AnalysisStatus
} from '@/types/analysis'

export default function App() {
  const [url, setUrl] = React.useState('')
  const [status, setStatus] = React.useState<AnalysisStatus>('idle')
  const [result, setResult] = React.useState<AnalysisResult | null>(null)
  const [errorDetails, setErrorDetails] = React.useState<AnalysisErrorDetails | null>(null)
  const [backendOnline, setBackendOnline] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    checkBackendHealth()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false))
  }, [])

  async function handleAnalyze(targetUrl: string) {
    if (status === 'loading') {
      return
    }

    const trimmedUrl = targetUrl.trim()
    if (!trimmedUrl) {
      setErrorDetails({
        type: 'invalid_url',
        title: 'URL Required',
        message: 'Please enter a website URL before analyzing.',
        suggestedAction: 'Enter a full URL starting with http:// or https://'
      })
      setStatus('error')
      return
    }

    setUrl(trimmedUrl)
    setStatus('loading')
    setResult(null)
    setErrorDetails(null)

    try {
      const data = await analyzeWebsiteReal(trimmedUrl)
      setResult(data)
      setStatus(data.evidence.isIncompleteAnalysis ? 'partial' : 'success')
    } catch (err: unknown) {
      setResult(null)
      const customErr = err as { details?: AnalysisErrorDetails; message?: string }
      if (customErr.details) {
        setErrorDetails(customErr.details)
      } else {
        setErrorDetails({
          type: 'unknown',
          title: 'Analysis Error',
          message: customErr.message || 'An unexpected error occurred during website analysis.',
          suggestedAction: 'Please check the URL and try again.'
        })
      }
      setStatus('error')
    }
  }

  function handlePreviewDemo(demoUrl = 'https://stripe.com') {
    setUrl(demoUrl)
    setErrorDetails(null)
    const demoData = generatePreviewData(demoUrl)
    setResult(demoData)
    setStatus('success')
  }

  function handleReset() {
    setUrl('')
    setStatus('idle')
    setResult(null)
    setErrorDetails(null)
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 tracking-tight text-sm sm:text-base">
                  Video Opportunity Analyzer
                </span>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-medium px-2 py-0"
                >
                  AI Opportunity Engine
                </Badge>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                AI-Powered Video Marketing Research & Cold Outreach
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
              <span
                className={`h-2 w-2 rounded-full ${
                  backendOnline === true
                    ? 'bg-emerald-500 ring-2 ring-emerald-200'
                    : backendOnline === false
                    ? 'bg-amber-500 ring-2 ring-amber-200'
                    : 'bg-slate-300'
                }`}
              />
              <span className="text-[11px] font-medium">
                {backendOnline === true
                  ? 'FastAPI Online'
                  : backendOnline === false
                  ? 'FastAPI Offline'
                  : 'Checking API...'}
              </span>
            </div>

            {status !== 'idle' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        <section className="text-center space-y-3 max-w-2xl mx-auto pt-2">
          <Badge
            variant="outline"
            className="bg-slate-100 text-slate-700 border-slate-200 text-xs px-2.5 py-0.5"
          >
            SaaS Video Strategy Engine
          </Badge>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
            Find the Video Opportunities Hiding in Every Website
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Enter a company’s public website URL to detect video coverage gaps, generate 3 evidence-backed placement ideas, and draft a high-converting outreach email under 120 words.
          </p>
        </section>

        <section className="max-w-2xl mx-auto bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <WebsiteForm
            onSubmit={(submittedUrl) => handleAnalyze(submittedUrl)}
            isLoading={status === 'loading'}
            currentUrl={url}
          />
        </section>

        <div className="max-w-2xl mx-auto flex items-center justify-between text-xs text-slate-500 border border-slate-200/80 rounded-lg p-2.5 bg-white/70">
          <span className="font-medium text-slate-700 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            Quick Test URLs:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              disabled={status === 'loading'}
              onClick={() => handleAnalyze('https://example.com')}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-[11px] transition-colors disabled:opacity-50"
            >
              example.com
            </button>
            <button
              type="button"
              disabled={status === 'loading'}
              onClick={() => handleAnalyze('https://news.ycombinator.com')}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-[11px] transition-colors disabled:opacity-50"
            >
              Hacker News
            </button>
            <button
              type="button"
              disabled={status === 'loading'}
              onClick={() => handleAnalyze('https://stripe.com')}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-[11px] transition-colors disabled:opacity-50"
            >
              Stripe
            </button>
          </div>
        </div>

        {status === 'idle' && (
          <section className="space-y-6 pt-4">
            <Card className="border-dashed border-slate-300 bg-white/60 text-center p-8">
              <CardContent className="space-y-4 max-w-md mx-auto p-0">
                <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <Globe className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-800">
                    No Analysis Performed Yet
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Enter any public company website URL above or click a quick test URL to inspect website structure, detect video gaps, and generate 3 tailored concepts.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAnalyze('https://example.com')}
                  className="text-xs border-slate-300 hover:bg-slate-100"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-blue-600" />
                  Analyze example.com
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="h-8 w-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileSearch className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-semibold text-slate-900">1. Evidence-Based Audit</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Separates verified DOM observations from inferences and notes crawl boundaries or inconclusive embed detection.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="h-8 w-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Video className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-semibold text-slate-900">2. Three High-Impact Concepts</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Identifies specific placement opportunities such as hero explainers, product demos, or customer proof highlights.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="h-8 w-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Mail className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-semibold text-slate-900">3. Under 120-Word Outreach</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Generates a concise, personalized cold email with one-click clipboard copying and live word count auditing.
                </p>
              </div>
            </div>
          </section>
        )}

        {status === 'loading' && <AnalysisLoading targetUrl={url} />}

        {status === 'error' && errorDetails && (
          <AnalysisError
            error={errorDetails}
            onRetry={() => handleAnalyze(url)}
            onRunDemo={() => handlePreviewDemo('https://stripe.com')}
          />
        )}

        {(status === 'success' || status === 'partial') && result && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <section>
              <AnalysisSummary
                summary={result.summary}
                isPreviewDemo={result.isPreviewDemo}
              />
            </section>

            <section>
              <WebsiteEvidence evidence={result.evidence} />
            </section>

            <section className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                    Evidence-Based Video Recommendations
                  </h2>
                  <p className="text-xs text-slate-500">
                    Exactly 3 tailored video formats formulated from public website observations.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200 self-start sm:self-auto">
                  3 Opportunities
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.recommendations.map((rec) => (
                  <VideoIdeaCard key={rec.recommendationNumber} recommendation={rec} />
                ))}
              </div>
            </section>

            <section>
              <OutreachEmail email={result.outreachEmail} />
            </section>

            {!result.isPreviewDemo ? (
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Live Analysis Verified:</strong> Analysis generated via backend website inspection and AI video opportunity engine.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-900">
                <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Simulated Preview Sample:</strong> Displaying preview layout. Enter any company URL above to run a live analysis.
                </span>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-slate-600">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <span>Video Opportunity Analyzer</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-normal text-slate-500">AI Video Strategy & Outreach</span>
            </div>
            <p className="text-xs text-slate-500">
              Evidence-based video placement analysis and outreach generation for public websites.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 text-sm text-slate-600">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Stack:</span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-slate-700">
              <span>FastAPI</span>
              <span className="text-slate-300">•</span>
              <span>Python</span>
              <span className="text-slate-300">•</span>
              <span>Google Gemini</span>
              <span className="text-slate-300">•</span>
              <span>React</span>
              <span className="text-slate-300">•</span>
              <span>TypeScript</span>
              <span className="text-slate-300">•</span>
              <span>Tailwind CSS</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
