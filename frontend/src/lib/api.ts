import type {
  AnalysisErrorDetails,
  AnalysisResult,
  BackendAnalyzeResponse,
  ErrorType,
  InspectedPage,
  VideoEvidenceData,
  VideoRecommendation
} from '@/types/analysis'

export const API_BASE_URL: string =
  (import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:8000'

export interface BackendHealthResponse {
  status: string
  service: string
}

export async function checkBackendHealth(): Promise<BackendHealthResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 4000)

  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error(`Health check failed with HTTP ${response.status}`)
    }

    return await response.json()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Backend unreachable'
    throw new Error(`Cannot connect to FastAPI backend at ${API_BASE_URL} (${msg})`)
  } finally {
    clearTimeout(timeoutId)
  }
}

export function adaptBackendResponse(data: BackendAnalyzeResponse): AnalysisResult {
  const insp = data.inspection
  const targetUrl = data.final_url || data.requested_url || (insp ? insp.final_url || insp.requested_url : '')

  const inspectedPages: InspectedPage[] = (insp?.pages_inspected || []).map((p) => {
    let statusMapped: InspectedPage['status'] = 'crawled'
    if (p.status === 'failed') statusMapped = 'failed'
    else if (p.status === 'partial') statusMapped = 'partial'
    else if (p.status === 'inaccessible') statusMapped = 'inaccessible'
    return {
      url: p.url,
      title: p.title,
      status: statusMapped,
      statusCode: p.status_code,
      errorMessage: p.error_message
    }
  })

  const videoEvidence: VideoEvidenceData[] = (insp?.video_evidence || []).map((v) => ({
    detectionType: v.detection_type,
    sourcePageUrl: v.source_page_url,
    videoUrl: v.video_url,
    titleOrContext: v.title_or_context,
    confidence: v.confidence
  }))

  const crawledCount = inspectedPages.filter((p) => p.status === 'crawled').length
  const confirmedVideosCount = videoEvidence.filter((v) => v.confidence === 'high' || v.confidence === 'medium').length

  const observedFacts: string[] = []
  if (insp?.title) {
    observedFacts.push(`Website Title verified: "${insp.title}".`)
  }
  if (insp?.headings?.h1?.length) {
    observedFacts.push(`Primary H1 Heading: "${insp.headings.h1[0]}".`)
  }
  if (insp?.headings?.h2?.length) {
    observedFacts.push(`Key Sections identified: ${insp.headings.h2.slice(0, 3).join(', ')}.`)
  }
  if (insp?.video_detection === 'video_detected') {
    observedFacts.push(`Detected ${confirmedVideosCount} existing video asset(s) or embed(s) on crawled pages.`)
  } else if (insp?.video_detection === 'possible_video_detected') {
    observedFacts.push('Identified potential video references or video platform links.')
  } else {
    observedFacts.push('No video tags, embeds, or video metadata detected across inspected pages.')
  }

  const inferences: string[] = []
  if (insp?.video_detection === 'no_video_detected') {
    inferences.push('Landing pages rely on text copy and static imagery without video walkthroughs.')
    inferences.push('First-time visitors may experience higher cognitive load before grasping core workflow value.')
  } else {
    inferences.push('Existing video presence can be enhanced with targeted bottom-of-funnel customer proof and onboarding guides.')
  }
  if (insp?.discovered_relevant_pages?.length) {
    inferences.push(`Discovered ${insp.discovered_relevant_pages.length} high-intent pages suitable for focused video placements.`)
  }

  const unknowns: string[] = [
    'Private onboarding or customer dashboard videos behind authentication.',
    'Social and paid video ad campaigns hosted on external networks (YouTube, LinkedIn).',
    'Videos loaded exclusively through dynamic client-side JavaScript hydration.'
  ]

  const recommendations: VideoRecommendation[] = data.recommendations.map((rec, idx) => ({
    recommendationNumber: idx + 1,
    title: rec.title,
    videoType: rec.video_type,
    suggestedPlacement: rec.suggested_placement,
    reason: rec.rationale,
    supportingEvidence: rec.evidence,
    targetAudience: rec.target_audience,
    suggestedOutline: rec.suggested_outline,
    sourcePageUrl: rec.source_page_url,
    evidenceLimitations: rec.evidence_limitations
  }))

  const outreachBody = data.outreach_email?.body || ''
  const outreachSubject = data.outreach_email?.subject || 'Video strategy opportunity'
  const calculatedWordCount = data.outreach_email?.word_count || outreachBody.trim().split(/\s+/).filter(Boolean).length

  let hostname = 'company'
  try {
    hostname = new URL(targetUrl).hostname.replace(/^www\./, '')
  } catch {
    hostname = targetUrl
  }

  const isPartial = data.status === 'partial_success' || (insp?.status === 'partial_success')
  const isInconclusiveVideo = insp?.video_detection === 'possible_video_detected'

  return {
    targetUrl,
    finalUrl: data.final_url,
    analyzedAt: new Date().toISOString(),
    summary: {
      pagesAnalyzed: crawledCount || 1,
      videosDetected: isInconclusiveVideo ? 'Inconclusive' : confirmedVideosCount,
      opportunitiesIdentified: recommendations.length,
      analysisStatus: isPartial ? 'Partial' : 'Complete'
    },
    evidence: {
      targetUrl,
      finalUrl: data.final_url,
      websiteTitle: insp?.title,
      metaDescription: insp?.meta_description,
      factualSummary: insp?.factual_summary,
      headings: insp?.headings,
      inspectedPages,
      discoveredPages: insp?.discovered_relevant_pages || [],
      videoDetectionStatus: insp?.video_detection || 'no_video_detected',
      videoEvidence,
      observedFacts,
      inferences,
      unknowns,
      warnings: data.warnings_and_limitations || insp?.warnings_and_limitations || [],
      isIncompleteAnalysis: isPartial,
      isInconclusiveVideoDetection: isInconclusiveVideo
    },
    recommendations,
    outreachEmail: {
      subject: outreachSubject,
      body: outreachBody,
      wordCount: calculatedWordCount,
      recipientDomain: hostname
    },
    isPreviewDemo: false,
    warnings: data.warnings_and_limitations || []
  }
}

export async function analyzeWebsiteReal(
  url: string,
  maxAdditionalPages = 3
): Promise<AnalysisResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        url,
        max_additional_pages: maxAdditionalPages
      }),
      signal: controller.signal
    })
  } catch (err: unknown) {
    clearTimeout(timeoutId)
    const isAbort = (err as { name?: string })?.name === 'AbortError'
    const errorMsg = isAbort ? 'Request timed out after 60 seconds' : err instanceof Error ? err.message : 'Connection failed'
    const details: AnalysisErrorDetails = {
      type: isAbort ? 'inaccessible' : 'backend_unavailable',
      title: isAbort ? 'Request Timeout' : 'Backend Server Offline',
      message: isAbort
        ? `Website inspection and analysis timed out. The target site may be slow to respond or blocking automated crawlers.`
        : `Unable to connect to the FastAPI backend at ${API_BASE_URL}. (${errorMsg})`,
      suggestedAction: isAbort
        ? 'Try analyzing a faster or simpler public URL, or try again in a few moments.'
        : 'Ensure the backend is running via ".\\.venv\\Scripts\\python.exe -m uvicorn app.main:app --reload --port 8000".'
    }
    const customErr = new Error(details.message) as Error & { details: AnalysisErrorDetails }
    customErr.details = details
    throw customErr
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    let errorMsg = `Server returned HTTP status ${response.status}`
    try {
      const errorJson = await response.json()
      if (typeof errorJson.detail === 'string') {
        errorMsg = errorJson.detail
      } else if (Array.isArray(errorJson.detail)) {
        errorMsg = errorJson.detail.map((d: { loc?: string[]; msg?: string }) => `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg || ''}`).join(', ')
      } else if (errorJson.message) {
        errorMsg = errorJson.message
      }
    } catch {
      // Body not JSON
    }

    const details: AnalysisErrorDetails = {
      type: response.status === 422 ? 'invalid_url' : 'backend_unavailable',
      title: response.status === 422 ? 'Invalid Request Parameters' : `Server Error (HTTP ${response.status})`,
      message: errorMsg,
      suggestedAction: response.status === 422 ? 'Please check the URL format and try again.' : 'Check backend terminal logs for exceptions.'
    }
    const customErr = new Error(errorMsg) as Error & { details: AnalysisErrorDetails }
    customErr.details = details
    throw customErr
  }

  let jsonResult: BackendAnalyzeResponse
  try {
    jsonResult = await response.json()
  } catch {
    const details: AnalysisErrorDetails = {
      type: 'unknown',
      title: 'Invalid Server Response',
      message: `The server at ${API_BASE_URL} returned a non-JSON response with HTTP status ${response.status}.`,
      suggestedAction: 'Check backend terminal logs for unexpected runtime exceptions.'
    }
    const customErr = new Error(details.message) as Error & { details: AnalysisErrorDetails }
    customErr.details = details
    throw customErr
  }

  if (jsonResult.status === 'failed') {
    const errText = jsonResult.error_message || 'Analysis could not be completed.'
    let errorType: ErrorType = 'inspection_failed'
    let title = 'Website Analysis Failed'
    let action = 'Check the target URL spelling and accessibility.'

    if (errText.includes('GEMINI_API_KEY')) {
      errorType = 'gemini_unconfigured'
      title = 'Gemini API Key Required'
      action = 'Configure a valid GEMINI_API_KEY in backend/.env to generate AI video recommendations.'
    } else if (errText.includes('internal or restricted') || errText.includes('hostname') || errText.includes('URL')) {
      errorType = 'invalid_url'
      title = 'Invalid or Restricted URL'
      action = 'Enter a publicly accessible website address (e.g. https://example.com).'
    } else if (errText.includes('403') || errText.includes('404') || errText.includes('timed out') || errText.includes('Connection error')) {
      errorType = 'inaccessible'
      title = 'Target Website Inaccessible'
      action = 'Ensure the target website is online and allows public web requests.'
    }

    const details: AnalysisErrorDetails = {
      type: errorType,
      title,
      message: errText,
      suggestedAction: action,
      inspection: jsonResult.inspection
    }
    const customErr = new Error(errText) as Error & { details: AnalysisErrorDetails }
    customErr.details = details
    throw customErr
  }

  return adaptBackendResponse(jsonResult)
}

export function generatePreviewData(url: string, partial = false): AnalysisResult {
  let hostname = 'example.com'
  try {
    const parsed = new URL(url)
    hostname = parsed.hostname.replace(/^www\./, '')
  } catch {
    hostname = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '') || 'example.com'
  }

  const recommendations: VideoRecommendation[] = [
    {
      recommendationNumber: 1,
      title: 'Interactive Product Explainer (60-90s)',
      videoType: 'Product Explainer',
      suggestedPlacement: 'Homepage Hero section above the fold',
      reason:
        'The current landing page relies on dense multi-column text. A concise explainer will rapidly demystify the workflow for first-time visitors.',
      supportingEvidence:
        'Homepage inspect reveals technical architecture descriptions without any video media embedded in the hero or feature blocks.',
      targetAudience: 'Prospective buyers and technical evaluators',
      suggestedOutline: 'Shows current workflow friction, reveals 1-click platform solution, and shows outcome dashboard.',
      sourcePageUrl: `https://${hostname}/`,
      evidenceLimitations:
        'Crawl was limited to publicly accessible HTML; client-side rendered modals were not evaluated.'
    },
    {
      recommendationNumber: 2,
      title: 'Guided Feature Walkthrough / Product Demo (2-3 min)',
      videoType: 'Product Demo',
      suggestedPlacement: 'Product Overview & Integration Docs entry page',
      reason:
        'The features page highlights sophisticated capabilities, but prospective customers must read multiple subpages to understand user onboarding and UI navigation.',
      supportingEvidence:
        'Inspected features page contains step-by-step numbered instructions that directly match a visual screen-recording workflow.',
      targetAudience: 'Software engineers and system administrators',
      suggestedOutline: 'Guides developer through installation, configuration, and first successful event trigger.',
      sourcePageUrl: `https://${hostname}/features`,
      evidenceLimitations:
        'Behind-login dashboard screens could not be verified directly.'
    },
    {
      recommendationNumber: 3,
      title: 'Customer Case Study & Social Proof Highlight (45-60s)',
      videoType: 'Customer Proof Highlight',
      suggestedPlacement: 'Pricing Page alongside enterprise tier comparison',
      reason:
        'The pricing page features logos of enterprise customers but lacks narrative testimonials or video soundbites demonstrating quantifiable ROI.',
      supportingEvidence:
        'Pricing table shows enterprise tiers with text quotes from customer VP of Engineering, but no multimedia validation.',
      targetAudience: 'Enterprise procurement and VP Operations',
      suggestedOutline: 'Outlines business challenge before adoption, implementation speed, and 40% time saved.',
      sourcePageUrl: `https://${hostname}/pricing`,
      evidenceLimitations:
        'Video hosting tags from Vimeo/YouTube were checked across the page; no embeds were detected.'
    }
  ]

  const emailBody = `Hi team at ${hostname},

I was browsing your website and noticed your product features have a compelling story, but first-time visitors have to read through several dense pages to grasp your core workflow.

We specialize in producing high-converting product explainers and customer story videos. A concise 60-second video in your homepage hero could significantly improve conversion rates from paid and organic visitors.

Would you be open to a 10-minute chat this Thursday to review 3 quick storyboard concepts we drafted for ${hostname}?

Best regards`

  return {
    targetUrl: url,
    finalUrl: url,
    analyzedAt: new Date().toISOString(),
    summary: {
      pagesAnalyzed: partial ? 1 : 4,
      videosDetected: partial ? 'Inconclusive' : 0,
      opportunitiesIdentified: 3,
      analysisStatus: partial ? 'Partial' : 'Demo Preview'
    },
    evidence: {
      targetUrl: url,
      finalUrl: url,
      websiteTitle: `${hostname} - Platform`,
      metaDescription: `Discover how ${hostname} accelerates workflows.`,
      factualSummary: `Overview of ${hostname} public website pages.`,
      headings: {
        h1: [`Welcome to ${hostname}`],
        h2: ['Key Capabilities', 'Transparent Pricing'],
        h3: []
      },
      inspectedPages: [
        {
          url: `https://${hostname}/`,
          title: `${hostname} - Home & Value Proposition`,
          status: 'crawled',
          statusCode: 200
        },
        {
          url: `https://${hostname}/features`,
          title: `${hostname} - Capabilities & Architecture`,
          status: 'crawled',
          statusCode: 200
        },
        {
          url: `https://${hostname}/pricing`,
          title: `${hostname} - Plans & Enterprise Comparison`,
          status: partial ? 'partial' : 'crawled',
          statusCode: partial ? 206 : 200
        }
      ],
      discoveredPages: [`https://${hostname}/features`, `https://${hostname}/pricing`],
      videoDetectionStatus: partial ? 'possible_video_detected' : 'no_video_detected',
      videoEvidence: [],
      observedFacts: [
        `Target domain ${hostname} returned HTTP 200 for root index and features page.`,
        'No HTML5 <video> tags or iframe embeds (YouTube, Vimeo, Wistia) found in hero section.',
        'Core product description relies on 1,400+ words of copy and static SVG iconography.'
      ],
      inferences: [
        'High bounce rate is likely for non-technical visitors seeking rapid visual comprehension.',
        'High purchase consideration cycle on pricing page could benefit from customer ROI testimonial.'
      ],
      unknowns: [
        'Presence of private onboarding videos hosted within authenticated user app portal.',
        'Paid advertising video creatives currently running on external social channels.'
      ],
      warnings: ['Local simulated preview sample for layout demonstration only.'],
      isIncompleteAnalysis: partial,
      isInconclusiveVideoDetection: partial
    },
    recommendations,
    outreachEmail: {
      subject: `Quick video opportunity for ${hostname}`,
      body: emailBody,
      wordCount: emailBody.trim().split(/\s+/).filter(Boolean).length,
      recipientDomain: hostname
    },
    isPreviewDemo: true,
    warnings: ['Simulated preview sample dataset.']
  }
}
