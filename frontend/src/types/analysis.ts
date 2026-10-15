export type PageCrawlStatus = 'crawled' | 'partial' | 'inconclusive' | 'inaccessible' | 'failed'

export interface InspectedPage {
  url: string
  title?: string | null
  status: PageCrawlStatus
  statusCode?: number | null
  errorMessage?: string | null
}

export interface VideoEvidenceData {
  detectionType: string
  sourcePageUrl: string
  videoUrl?: string | null
  titleOrContext?: string | null
  confidence: string
}

export interface WebsiteEvidence {
  targetUrl: string
  finalUrl?: string | null
  websiteTitle?: string | null
  metaDescription?: string | null
  factualSummary?: string | null
  headings?: {
    h1: string[]
    h2: string[]
    h3: string[]
  }
  inspectedPages: InspectedPage[]
  discoveredPages: string[]
  videoDetectionStatus: string
  videoEvidence: VideoEvidenceData[]
  observedFacts: string[]
  inferences: string[]
  unknowns: string[]
  warnings: string[]
  isIncompleteAnalysis: boolean
  isInconclusiveVideoDetection: boolean
}

export interface SummaryMetrics {
  pagesAnalyzed: number
  videosDetected: number | 'Inconclusive'
  opportunitiesIdentified: number
  analysisStatus: 'Complete' | 'Partial' | 'Inconclusive' | 'Demo Preview' | 'Pending' | 'Failed'
}

export interface VideoRecommendation {
  recommendationNumber: number
  title: string
  videoType: string
  suggestedPlacement: string
  reason: string
  supportingEvidence: string
  targetAudience: string
  suggestedOutline: string
  sourcePageUrl: string
  evidenceLimitations?: string | null
}

export interface OutreachEmailData {
  subject: string
  body: string
  wordCount: number
  recipientDomain?: string
}

export interface AnalysisResult {
  targetUrl: string
  finalUrl?: string | null
  analyzedAt: string
  summary: SummaryMetrics
  evidence: WebsiteEvidence
  recommendations: VideoRecommendation[]
  outreachEmail: OutreachEmailData
  isPreviewDemo: boolean
  warnings: string[]
}

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'partial' | 'error'

export type ErrorType =
  | 'invalid_url'
  | 'inaccessible'
  | 'backend_unavailable'
  | 'gemini_unconfigured'
  | 'inspection_failed'
  | 'unknown'

export interface AnalysisErrorDetails {
  type: ErrorType
  title: string
  message: string
  suggestedAction?: string
  inspection?: BackendWebsiteInspectResponse | null
}

export interface BackendVideoEvidenceItem {
  detection_type: string
  source_page_url: string
  video_url?: string | null
  title_or_context?: string | null
  confidence: string
}

export interface BackendPageInspectionResult {
  url: string
  title?: string | null
  status_code?: number | null
  status: string
  error_message?: string | null
}

export interface BackendExtractedHeadings {
  h1: string[]
  h2: string[]
  h3: string[]
}

export interface BackendWebsiteInspectResponse {
  requested_url: string
  final_url?: string | null
  status: string
  title?: string | null
  meta_description?: string | null
  factual_summary?: string | null
  headings: BackendExtractedHeadings
  pages_inspected: BackendPageInspectionResult[]
  discovered_relevant_pages: string[]
  video_detection: string
  video_evidence: BackendVideoEvidenceItem[]
  warnings_and_limitations: string[]
  error_message?: string | null
}

export interface BackendVideoRecommendationItem {
  title: string
  video_type: string
  suggested_placement: string
  rationale: string
  evidence: string
  source_page_url: string
  target_audience: string
  suggested_outline: string
  evidence_limitations?: string | null
}

export interface BackendOutreachEmailItem {
  subject: string
  body: string
  word_count: number
}

export interface BackendAnalyzeResponse {
  requested_url: string
  final_url?: string | null
  status: string
  inspection?: BackendWebsiteInspectResponse | null
  recommendations: BackendVideoRecommendationItem[]
  outreach_email?: BackendOutreachEmailItem | null
  warnings_and_limitations: string[]
  error_message?: string | null
}
