import type {
  AnalysisErrorDetails,
  AnalysisResult,
  ErrorType,
  VideoRecommendation
} from '@/types/analysis'

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export interface BackendHealthResponse {
  status: string
  service: string
}

export async function checkBackendHealth(): Promise<BackendHealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Backend health check failed with status ${response.status}`)
  }

  return response.json()
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
      videoType: 'Interactive Product Explainer (60-90s)',
      suggestedPlacement: 'Homepage Hero section above the fold',
      reason:
        `The current landing page relies primarily on dense multi-column text and static diagrams to explain the core value proposition. A concise explainer will rapidly demystify the workflow for first-time visitors.`,
      supportingEvidence:
        `Homepage inspect reveals 1,450 words of technical architecture descriptions without any video media embedded in the hero or feature blocks.`,
      sourcePageUrl: `https://${hostname}/`,
      evidenceLimitations:
        'Crawl was limited to publicly accessible HTML; client-side rendered modals were not evaluated.'
    },
    {
      recommendationNumber: 2,
      videoType: 'Guided Feature Walkthrough / Product Demo (2-3 min)',
      suggestedPlacement: 'Product Overview & Integration Docs entry page',
      reason:
        `The features page highlights sophisticated capabilities, but prospective customers must read multiple subpages to understand user onboarding and UI navigation.`,
      supportingEvidence:
        `Inspected features page contains step-by-step numbered instructions that directly match a visual screen-recording workflow.`,
      sourcePageUrl: `https://${hostname}/features`,
      evidenceLimitations:
        'Behind-login dashboard screens could not be verified directly.'
    },
    {
      recommendationNumber: 3,
      videoType: 'Customer Case Study & Social Proof Highlight (45-60s)',
      suggestedPlacement: 'Pricing Page alongside enterprise tier comparison',
      reason:
        `The pricing page features logos of enterprise customers but lacks narrative testimonials or video soundbites demonstrating quantifiable ROI.`,
      supportingEvidence:
        `Pricing table shows 4 pricing tiers with text quotes from customer VP of Engineering, but no multimedia validation.`,
      sourcePageUrl: `https://${hostname}/pricing`,
      evidenceLimitations:
        'Video hosting tags from Vimeo/YouTube were checked across the page; no embeds were detected.'
    }
  ]

  const emailBody = `Hi team at ${hostname},

I was browsing your website and noticed your product features have a compelling story, but first-time visitors have to read through several dense pages to grasp your core workflow.

We specialize in producing high-converting product explainers and customer story videos. A concise 60-second video in your homepage hero could significantly improve conversion rates from paid and organic visitors.

Would you be open to a 10-minute chat this Thursday to review 3 quick storyboard concepts we drafted for ${hostname}?

Best regards,
Alex Carter
Video Growth Strategist`

  return {
    targetUrl: url,
    analyzedAt: new Date().toISOString(),
    summary: {
      pagesAnalyzed: partial ? 1 : 4,
      videosDetected: partial ? 'Inconclusive' : 0,
      opportunitiesIdentified: 3,
      analysisStatus: partial ? 'Partial' : 'Demo Preview'
    },
    evidence: {
      targetUrl: url,
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
        },
        {
          url: `https://${hostname}/customers`,
          title: `${hostname} - Case Studies & Testimonials`,
          status: partial ? 'inaccessible' : 'crawled',
          statusCode: partial ? 403 : 200
        }
      ],
      observedFacts: [
        `Target domain ${hostname} returned HTTP 200 for root index and features page.`,
        'No HTML5 <video> tags or iframe embeds (YouTube, Vimeo, Wistia) found in hero section.',
        'Core product description relies on 1,400+ words of copy and static SVG iconography.',
        'Customer logo showcase present with text-based attribution quotes.'
      ],
      inferences: [
        'High bounce rate is likely for non-technical visitors seeking rapid visual comprehension.',
        'High purchase consideration cycle on pricing page could benefit from customer ROI testimonial.',
        'Feature adoption speed could improve with self-serve walkthrough videos in onboarding.'
      ],
      unknowns: [
        'Presence of private onboarding videos hosted within authenticated user app portal.',
        'Paid advertising video creatives currently running on external social channels (LinkedIn/YouTube).',
        'Actual conversion rates of current text-only feature CTAs.'
      ],
      isIncompleteAnalysis: partial,
      isInconclusiveVideoDetection: partial
    },
    recommendations,
    outreachEmail: {
      subject: `Quick video opportunity for ${hostname}`,
      body: emailBody,
      recipientDomain: hostname
    },
    isPreviewDemo: true
  }
}

export async function simulateAnalysisRequest(
  url: string,
  options?: {
    forceError?: ErrorType
    partial?: boolean
  }
): Promise<AnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, 900))

  if (options?.forceError) {
    const errorMap: Record<ErrorType, AnalysisErrorDetails> = {
      invalid_url: {
        type: 'invalid_url',
        title: 'Invalid Website URL',
        message: 'The URL provided does not follow a valid domain format (e.g., https://example.com).',
        suggestedAction: 'Please verify the protocol and domain spelling before submitting.'
      },
      inaccessible: {
        type: 'inaccessible',
        title: 'Website Inaccessible',
        message: `Could not connect to ${url}. The target server timed out or returned HTTP 403/503.`,
        suggestedAction: 'Ensure the website is publicly reachable without authentication or geo-blocking.'
      },
      backend_unavailable: {
        type: 'backend_unavailable',
        title: 'Backend API Offline',
        message: `Unable to reach the FastAPI backend at ${API_BASE_URL}.`,
        suggestedAction: 'Verify that the backend server is running on port 8000.'
      },
      unknown: {
        type: 'unknown',
        title: 'Unexpected Processing Error',
        message: 'An unknown exception occurred while attempting to inspect the website structure.',
        suggestedAction: 'Try again in a few moments or analyze an alternative website URL.'
      }
    }
    const err = new Error(errorMap[options.forceError].message) as Error & {
      details: AnalysisErrorDetails
    }
    err.details = errorMap[options.forceError]
    throw err
  }

  return generatePreviewData(url, options?.partial)
}
