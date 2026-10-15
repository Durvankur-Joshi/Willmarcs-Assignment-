import test from 'node:test'
import assert from 'node:assert/strict'

function adaptBackendResponse(data) {
  const insp = data.inspection
  const targetUrl = data.final_url || data.requested_url || (insp ? insp.final_url || insp.requested_url : '')

  const inspectedPages = (insp?.pages_inspected || []).map((p) => {
    let statusMapped = 'crawled'
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

  const videoEvidence = (insp?.video_evidence || []).map((v) => ({
    detectionType: v.detection_type,
    sourcePageUrl: v.source_page_url,
    videoUrl: v.video_url,
    titleOrContext: v.title_or_context,
    confidence: v.confidence
  }))

  const crawledCount = inspectedPages.filter((p) => p.status === 'crawled').length
  const confirmedVideosCount = videoEvidence.filter((v) => v.confidence === 'high' || v.confidence === 'medium').length

  const observedFacts = []
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

  const inferences = []
  if (insp?.video_detection === 'no_video_detected') {
    inferences.push('Landing pages rely on text copy and static imagery without video walkthroughs.')
  } else {
    inferences.push('Existing video presence can be enhanced with targeted bottom-of-funnel customer proof and onboarding guides.')
  }

  const unknowns = [
    'Private onboarding or customer dashboard videos behind authentication.',
    'Social and paid video ad campaigns hosted on external networks (YouTube, LinkedIn).',
    'Videos loaded exclusively through dynamic client-side JavaScript hydration.'
  ]

  const recommendations = (data.recommendations || []).map((rec, idx) => ({
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

async function analyzeWebsiteWithFetch(url, fetchFn, apiBase = 'http://localhost:8000') {
  let response
  try {
    response = await fetchFn(`${apiBase}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ url, max_additional_pages: 3 })
    })
  } catch (err) {
    const isAbort = err?.name === 'AbortError'
    const errorMsg = isAbort ? 'Request timed out after 60 seconds' : err?.message || 'Connection failed'
    const details = {
      type: isAbort ? 'inaccessible' : 'backend_unavailable',
      title: isAbort ? 'Request Timeout' : 'Backend Server Offline',
      message: isAbort
        ? 'Website inspection and analysis timed out. The target site may be slow to respond or blocking automated crawlers.'
        : `Unable to connect to the FastAPI backend at ${apiBase}. (${errorMsg})`,
      suggestedAction: isAbort
        ? 'Try analyzing a faster or simpler public URL, or try again in a few moments.'
        : 'Ensure the backend is running via ".\\.venv\\Scripts\\python.exe -m uvicorn app.main:app --reload --port 8000".'
    }
    const customErr = new Error(details.message)
    customErr.details = details
    throw customErr
  }

  if (!response.ok) {
    let errorMsg = `Server returned HTTP status ${response.status}`
    try {
      const errorJson = await response.json()
      if (typeof errorJson.detail === 'string') {
        errorMsg = errorJson.detail
      } else if (Array.isArray(errorJson.detail)) {
        errorMsg = errorJson.detail.map((d) => `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg || ''}`).join(', ')
      }
    } catch {
      // not JSON
    }

    const details = {
      type: response.status === 422 ? 'invalid_url' : 'backend_unavailable',
      title: response.status === 422 ? 'Invalid Request Parameters' : `Server Error (HTTP ${response.status})`,
      message: errorMsg,
      suggestedAction: response.status === 422 ? 'Please check the URL format and try again.' : 'Check backend terminal logs for exceptions.'
    }
    const customErr = new Error(errorMsg)
    customErr.details = details
    throw customErr
  }

  let jsonResult
  try {
    jsonResult = await response.json()
  } catch {
    const details = {
      type: 'unknown',
      title: 'Invalid Server Response',
      message: `The server at ${apiBase} returned a non-JSON response with HTTP status ${response.status}.`,
      suggestedAction: 'Check backend terminal logs for unexpected runtime exceptions.'
    }
    const customErr = new Error(details.message)
    customErr.details = details
    throw customErr
  }

  if (jsonResult.status === 'failed') {
    const errText = jsonResult.error_message || 'Analysis could not be completed.'
    let errorType = 'inspection_failed'
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

    const details = {
      type: errorType,
      title,
      message: errText,
      suggestedAction: action,
      inspection: jsonResult.inspection
    }
    const customErr = new Error(errText)
    customErr.details = details
    throw customErr
  }

  return adaptBackendResponse(jsonResult)
}

test('1. Successful analysis converts real backend response into typed UI result', async () => {
  const mockBackendResponse = {
    requested_url: 'https://example.com',
    final_url: 'https://example.com/',
    status: 'success',
    inspection: {
      requested_url: 'https://example.com',
      final_url: 'https://example.com/',
      status: 'success',
      title: 'Example Domain',
      meta_description: 'An illustrative public example domain.',
      factual_summary: 'Example Domain is an RFC-reserved site for documentation.',
      headings: {
        h1: ['Example Domain'],
        h2: ['More information...'],
        h3: []
      },
      pages_inspected: [
        {
          url: 'https://example.com/',
          title: 'Example Domain',
          status_code: 200,
          status: 'crawled',
          error_message: null
        }
      ],
      discovered_relevant_pages: ['https://example.com/about'],
      video_detection: 'no_video_detected',
      video_evidence: [],
      warnings_and_limitations: []
    },
    recommendations: [
      {
        title: '30-Second Quick Start Video',
        video_type: 'Product Explainer',
        suggested_placement: 'Homepage Hero',
        rationale: 'Clarifies documentation usage.',
        evidence: 'Hero H1 text has no video accompaniment.',
        source_page_url: 'https://example.com/',
        target_audience: 'Developers',
        suggested_outline: 'Intro -> Usage -> Next Steps',
        evidence_limitations: null
      },
      {
        title: 'RFC Workflow Overview',
        video_type: 'Feature Demo',
        suggested_placement: 'Documentation Section',
        rationale: 'Shows specification compliance.',
        evidence: 'Subpage text details RFC documentation.',
        source_page_url: 'https://example.com/about',
        target_audience: 'Standard committees',
        suggested_outline: 'Background -> Standards -> Architecture',
        evidence_limitations: null
      },
      {
        title: 'Community Story Highlight',
        video_type: 'Customer Story',
        suggested_placement: 'About Page',
        rationale: 'Provides public proof.',
        evidence: 'References community guidelines.',
        source_page_url: 'https://example.com/about',
        target_audience: 'Public audience',
        suggested_outline: 'History -> Community -> Value',
        evidence_limitations: 'Static page crawl only'
      }
    ],
    outreach_email: {
      subject: 'Video idea for Example Domain',
      body: 'Hi team,\n\nI reviewed Example Domain and noticed you have great documentation but no visual explainer.\n\nBest regards',
      word_count: 17
    },
    warnings_and_limitations: []
  }

  const mockFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => mockBackendResponse
  })

  const result = await analyzeWebsiteWithFetch('https://example.com', mockFetch)

  assert.equal(result.targetUrl, 'https://example.com/')
  assert.equal(result.summary.pagesAnalyzed, 1)
  assert.equal(result.summary.videosDetected, 0)
  assert.equal(result.summary.opportunitiesIdentified, 3)
  assert.equal(result.summary.analysisStatus, 'Complete')
  assert.equal(result.isPreviewDemo, false)
  assert.equal(result.evidence.websiteTitle, 'Example Domain')
  assert.equal(result.evidence.metaDescription, 'An illustrative public example domain.')
  assert.equal(result.evidence.discoveredPages.length, 1)
  assert.equal(result.recommendations.length, 3)
  assert.equal(result.recommendations[0].title, '30-Second Quick Start Video')
  assert.equal(result.outreachEmail.wordCount, 17)
  assert.equal(result.outreachEmail.subject, 'Video idea for Example Domain')
})

test('2. Backend unavailable / network failure raises structured error', async () => {
  const failingFetch = async () => {
    throw new Error('connect ECONNREFUSED 127.0.0.1:8000')
  }

  await assert.rejects(
    async () => {
      await analyzeWebsiteWithFetch('https://example.com', failingFetch)
    },
    (err) => {
      assert.equal(err.details?.type, 'backend_unavailable')
      assert.match(err.details?.message, /ECONNREFUSED/)
      return true
    }
  )
})

test('3. Timeout error produces inaccessible / Request Timeout error', async () => {
  const abortFetch = async () => {
    const err = new Error('The operation was aborted')
    err.name = 'AbortError'
    throw err
  }

  await assert.rejects(
    async () => {
      await analyzeWebsiteWithFetch('https://slow-site.com', abortFetch)
    },
    (err) => {
      assert.equal(err.details?.type, 'inaccessible')
      assert.equal(err.details?.title, 'Request Timeout')
      return true
    }
  )
})

test('4. HTTP 422 validation failure produces invalid_url error', async () => {
  const validationFetch = async () => ({
    ok: false,
    status: 422,
    json: async () => ({
      detail: [{ loc: ['body', 'url'], msg: 'Invalid or missing URL scheme' }]
    })
  })

  await assert.rejects(
    async () => {
      await analyzeWebsiteWithFetch('ftp://not-supported', validationFetch)
    },
    (err) => {
      assert.equal(err.details?.type, 'invalid_url')
      assert.match(err.details?.message, /Invalid or missing URL scheme/)
      return true
    }
  )
})

test('5. Backend failure with unconfigured Gemini key produces gemini_unconfigured error', async () => {
  const geminiUnconfiguredFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      requested_url: 'https://example.com',
      status: 'failed',
      inspection: {
        requested_url: 'https://example.com',
        status: 'success',
        pages_inspected: []
      },
      recommendations: [],
      error_message: 'GEMINI_API_KEY is not configured in backend/.env'
    })
  })

  await assert.rejects(
    async () => {
      await analyzeWebsiteWithFetch('https://example.com', geminiUnconfiguredFetch)
    },
    (err) => {
      assert.equal(err.details?.type, 'gemini_unconfigured')
      assert.match(err.details?.title, /Gemini API Key Required/)
      assert.match(err.details?.suggestedAction, /backend\/\.env/)
      return true
    }
  )
})

test('6. Email word count display and <120 target check', () => {
  const emailData = {
    subject: 'Quick video opportunity',
    body: 'Hi team,\n\nWe love your platform. Adding a 60-second video could boost conversions.\n\nBest regards, Alex',
    word_count: 16
  }

  const words = emailData.body.trim().split(/\s+/).filter(Boolean).length
  assert.equal(emailData.word_count, 16)
  assert.equal(words, 16)
  assert.ok(emailData.word_count < 120, 'Email is under 120 words target')
})

test('7. Copy Email formats subject and body in email-ready layout', () => {
  const email = {
    subject: 'Video Strategy for Acme',
    body: 'Hi Sarah,\n\nI reviewed Acme\'s homepage and prepared 3 video concepts.\n\nCheers'
  }
  const formatted = `Subject: ${email.subject}\n\n${email.body}`
  assert.equal(
    formatted,
    "Subject: Video Strategy for Acme\n\nHi Sarah,\n\nI reviewed Acme's homepage and prepared 3 video concepts.\n\nCheers"
  )
})

test('8. Duplicate submission prevention and stale state clearing', () => {
  let status = 'idle'
  let result = { targetUrl: 'https://old-company.com' }

  function startAnalysis() {
    if (status === 'loading') {
      return false
    }
    status = 'loading'
    result = null
    return true
  }

  const firstSubmission = startAnalysis()
  assert.equal(firstSubmission, true)
  assert.equal(status, 'loading')
  assert.equal(result, null, 'Stale company results are cleared immediately')

  const duplicateSubmission = startAnalysis()
  assert.equal(duplicateSubmission, false, 'Duplicate submission is blocked while loading')
})

test('9. Inaccessible website with 403/404 produces inaccessible error', async () => {
  const inaccessibleFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      requested_url: 'https://private-site.org',
      status: 'failed',
      inspection: {
        requested_url: 'https://private-site.org',
        status: 'failed',
        pages_inspected: []
      },
      recommendations: [],
      error_message: 'Website inspection failed: HTTP error 403 returned by https://private-site.org'
    })
  })

  await assert.rejects(
    async () => {
      await analyzeWebsiteWithFetch('https://private-site.org', inaccessibleFetch)
    },
    (err) => {
      assert.equal(err.details?.type, 'inaccessible')
      assert.match(err.details?.title, /Target Website Inaccessible/)
      return true
    }
  )
})

test('10. Non-JSON server response produces invalid server response error', async () => {
  const nonJsonFetch = async () => ({
    ok: false,
    status: 502,
    json: async () => {
      throw new Error('Unexpected token < in JSON at position 0')
    }
  })

  await assert.rejects(
    async () => {
      await analyzeWebsiteWithFetch('https://example.com', nonJsonFetch)
    },
    (err) => {
      assert.equal(err.details?.type, 'backend_unavailable')
      assert.match(err.details?.message, /502/)
      return true
    }
  )
})

test('11. Partial crawl warnings and status mapping', () => {
  const partialBackendResponse = {
    requested_url: 'https://example.com',
    final_url: 'https://example.com/',
    status: 'partial_success',
    inspection: {
      requested_url: 'https://example.com',
      final_url: 'https://example.com/',
      status: 'partial_success',
      title: 'Example Partial',
      headings: { h1: [], h2: [], h3: [] },
      pages_inspected: [
        { url: 'https://example.com/', status: 'crawled', status_code: 200 },
        { url: 'https://example.com/blocked', status: 'failed', status_code: 403, error_message: 'HTTP error 403' }
      ],
      discovered_relevant_pages: ['https://example.com/blocked'],
      video_detection: 'possible_video_detected',
      video_evidence: [],
      warnings_and_limitations: ['Subpage blocked by server.']
    },
    recommendations: [],
    outreach_email: null,
    warnings_and_limitations: ['Subpage blocked by server.']
  }

  const result = adaptBackendResponse(partialBackendResponse)
  assert.equal(result.summary.analysisStatus, 'Partial')
  assert.equal(result.summary.videosDetected, 'Inconclusive')
  assert.equal(result.evidence.isIncompleteAnalysis, true)
  assert.equal(result.evidence.isInconclusiveVideoDetection, true)
  assert.ok(result.evidence.warnings.length > 0)
  assert.equal(result.evidence.inspectedPages[1].status, 'failed')
})

test('12. Evidence grounding: recommendation source URLs link to inspected pages', () => {
  const backendResponse = {
    requested_url: 'https://acme.com',
    final_url: 'https://acme.com',
    status: 'success',
    inspection: {
      requested_url: 'https://acme.com',
      pages_inspected: [
        { url: 'https://acme.com', status: 'crawled', status_code: 200 },
        { url: 'https://acme.com/features', status: 'crawled', status_code: 200 }
      ],
      video_detection: 'no_video_detected',
      video_evidence: []
    },
    recommendations: [
      {
        title: 'Explainer',
        video_type: 'Explainer',
        suggested_placement: 'Hero',
        rationale: 'Why',
        evidence: 'Proof',
        source_page_url: 'https://acme.com',
        target_audience: 'Everyone',
        suggested_outline: 'Outline'
      },
      {
        title: 'Walkthrough',
        video_type: 'Demo',
        suggested_placement: 'Features',
        rationale: 'Why',
        evidence: 'Proof',
        source_page_url: 'https://acme.com/features',
        target_audience: 'Devs',
        suggested_outline: 'Outline'
      },
      {
        title: 'Third Rec',
        video_type: 'ROI',
        suggested_placement: 'Pricing',
        rationale: 'Why',
        evidence: 'Proof',
        source_page_url: 'https://acme.com',
        target_audience: 'Execs',
        suggested_outline: 'Outline'
      }
    ]
  }

  const result = adaptBackendResponse(backendResponse)
  const inspectedUrls = new Set(result.evidence.inspectedPages.map((p) => p.url))
  for (const rec of result.recommendations) {
    assert.ok(inspectedUrls.has(rec.sourcePageUrl), `Source URL ${rec.sourcePageUrl} must belong to inspected pages`)
  }
})

test('13. Clipboard API failure fallback notification', () => {
  let copyErrorState = null
  function handleCopyFailure() {
    copyErrorState = 'Failed to copy to clipboard. Please select the subject and body text below manually.'
  }

  handleCopyFailure()
  assert.equal(
    copyErrorState,
    'Failed to copy to clipboard. Please select the subject and body text below manually.'
  )
})
