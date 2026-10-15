export type PageCrawlStatus = 'crawled' | 'partial' | 'inconclusive' | 'inaccessible'

export interface InspectedPage {
  url: string
  title?: string
  status: PageCrawlStatus
  statusCode?: number
}

export interface WebsiteEvidence {
  targetUrl: string
  inspectedPages: InspectedPage[]
  observedFacts: string[]
  inferences: string[]
  unknowns: string[]
  isIncompleteAnalysis: boolean
  isInconclusiveVideoDetection: boolean
}

export interface SummaryMetrics {
  pagesAnalyzed: number
  videosDetected: number | 'Inconclusive'
  opportunitiesIdentified: number
  analysisStatus: 'Complete' | 'Partial' | 'Inconclusive' | 'Demo Preview' | 'Pending'
}

export interface VideoRecommendation {
  recommendationNumber: number
  videoType: string
  suggestedPlacement: string
  reason: string
  supportingEvidence: string
  sourcePageUrl: string
  evidenceLimitations?: string
}

export interface OutreachEmailData {
  subject: string
  body: string
  recipientDomain?: string
}

export interface AnalysisResult {
  targetUrl: string
  analyzedAt: string
  summary: SummaryMetrics
  evidence: WebsiteEvidence
  recommendations: VideoRecommendation[]
  outreachEmail: OutreachEmailData
  isPreviewDemo: boolean
}

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'partial' | 'error'

export type ErrorType = 'invalid_url' | 'inaccessible' | 'backend_unavailable' | 'unknown'

export interface AnalysisErrorDetails {
  type: ErrorType
  title: string
  message: string
  suggestedAction?: string
}
