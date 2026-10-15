# Video Opportunity Analyzer

An AI-powered web application that analyzes a company's website URL, detects existing video assets, recommends exactly three evidence-based video opportunities, and crafts a concise, personalized outreach email (< 120 words).

> **Current Status**: Phase 4 Complete — AI Analysis Engine.

---

## Prerequisites

- **Node.js**: v18+ (tested on Node.js v24.15.0 with npm 11.12.1)
- **Python**: 3.11 (tested on Python 3.11.0)
- **Google Gemini API Key**: Optional for testing (mocked in automated tests), required for live AI analysis.
- **Git**
- **Windows PowerShell** (or compatible shell)

---

## Project Structure

```text
Willmarcs-Assignment/
  frontend/
    src/
      components/
        ui/
          alert.tsx
          badge.tsx
          button.tsx
          card.tsx
          input.tsx
        AnalysisError.tsx
        AnalysisLoading.tsx
        AnalysisSummary.tsx
        OutreachEmail.tsx
        VideoIdeaCard.tsx
        WebsiteEvidence.tsx
        WebsiteForm.tsx
      lib/
        api.ts
        utils.ts
      types/
        analysis.ts
      App.tsx
      main.tsx
      index.css
    components.json
    package.json
    tsconfig.json
    tsconfig.app.json
    vite.config.ts
  backend/
    app/
      models/
        __init__.py
        analysis.py
        inspect.py
      routes/
        __init__.py
        analysis.py
        inspect.py
      services/
        __init__.py
        ai_analyzer.py
        content_extractor.py
        http_client.py
        url_validator.py
        video_detector.py
        website_reader.py
      __init__.py
      main.py
    tests/
      __init__.py
      test_analysis.py
      test_health.py
      test_inspect.py
    .env.example
    requirements.txt
  results/
    .gitkeep
  .gitignore
  README.md
```

---

## Setup Instructions

### 1. Backend Setup

From the `backend` directory:

1. Create a Python 3.11 virtual environment (if not already created):
   ```powershell
   py -3.11 -m venv .venv
   ```

2. Activate the virtual environment or run directly via `.venv` interpreter:
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```

3. Install required dependencies:
   ```powershell
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```powershell
   Copy-Item .env.example .env
   ```
   Edit `backend/.env` to configure your settings:
   - `GEMINI_API_KEY`: Obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
   - `GEMINI_MODEL`: Default is `gemini-1.5-flash` (or configure e.g. `gemini-2.5-flash` / `gemini-1.5-pro`).
   - `FRONTEND_ORIGIN`: Default is `http://localhost:5173`.

### 2. Frontend Setup

From the `frontend` directory:

1. Install dependencies:
   ```powershell
   npm install
   ```

---

## Running the Application

Run frontend and backend services in separate terminal windows:

### Terminal 1: Backend Service (FastAPI + Uvicorn)

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```
- **Health Check Endpoint**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- **Website Inspect Endpoint**: `POST http://127.0.0.1:8000/api/website/inspect`
- **AI Analysis Endpoint**: `POST http://127.0.0.1:8000/api/analyze`
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

*Note: If port 8000 is occupied, run with `--port 8001`.*

### Terminal 2: Frontend Service (Vite + React)

```powershell
cd frontend
npm run dev
```
- **Frontend URL**: [http://localhost:5173/](http://localhost:5173/)

---

## Phase 4: AI Analysis Engine API

### Endpoint: `POST /api/analyze`

Executes the Phase 3 website crawl and video detection, then invokes Google Gemini to generate exactly 3 evidence-based video recommendations and a personalized outreach email under 120 words.

#### Example Request
```json
{
  "url": "https://stripe.com",
  "max_additional_pages": 3
}
```

#### Example Response (Success)
```json
{
  "requested_url": "https://stripe.com",
  "final_url": "https://stripe.com",
  "status": "success",
  "inspection": {
    "requested_url": "https://stripe.com",
    "final_url": "https://stripe.com",
    "status": "success",
    "title": "Stripe | Financial Infrastructure for the Internet",
    "meta_description": "Stripe powers online and in-person payments and financial infrastructure.",
    "factual_summary": "Website Title: Stripe | Financial Infrastructure for the Internet...",
    "headings": {
      "h1": ["Financial Infrastructure for the Internet"],
      "h2": ["A complete payments platform", "Engineered for scale"],
      "h3": []
    },
    "pages_inspected": [
      {
        "url": "https://stripe.com",
        "title": "Stripe | Financial Infrastructure for the Internet",
        "status_code": 200,
        "status": "crawled",
        "error_message": null
      }
    ],
    "discovered_relevant_pages": ["https://stripe.com/pricing", "https://stripe.com/features"],
    "video_detection": "no_video_detected",
    "video_evidence": [],
    "warnings_and_limitations": [
      "Inspection completed across 1 page(s) on target domain.",
      "Video detection is limited to static HTML5 tags, embedded iframes, video links, and metadata."
    ],
    "error_message": null
  },
  "recommendations": [
    {
      "title": "Global Payouts & Multi-Currency Flow Explainer",
      "video_type": "Product Explainer",
      "suggested_placement": "Homepage Hero above the fold",
      "rationale": "Clarifies cross-border clearing for fast-growing global startups.",
      "evidence": "Homepage H2 'A complete payments platform' relies on text descriptions with no video media.",
      "source_page_url": "https://stripe.com",
      "target_audience": "Fintech CTOs and VP Payments",
      "suggested_outline": "Animates currency conversion steps and unified dashboard reporting.",
      "evidence_limitations": "Evaluated static landing page copy only."
    },
    {
      "title": "Payment Element SDK Quickstart",
      "video_type": "Product Demo",
      "suggested_placement": "Developers Documentation entry page",
      "rationale": "Software engineers evaluate SDK integration friction.",
      "evidence": "Inspected copy emphasizes developer-first APIs.",
      "source_page_url": "https://stripe.com",
      "target_audience": "Full-stack and backend engineers",
      "suggested_outline": "Shows 5-line React code snippet embedding checkout elements.",
      "evidence_limitations": null
    },
    {
      "title": "Billing Migration ROI Case Study",
      "video_type": "Customer Proof Highlight",
      "suggested_placement": "Pricing Page enterprise comparison",
      "rationale": "Enterprise finance leads need evidence of churn reduction.",
      "evidence": "Pricing table lists enterprise volume discounts without multimedia proof.",
      "source_page_url": "https://stripe.com",
      "target_audience": "Enterprise Finance and Procurement directors",
      "suggested_outline": "Highlights migration timeline and time saved per invoice.",
      "evidence_limitations": null
    }
  ],
  "outreach_email": {
    "subject": "Video opportunity for Stripe",
    "body": "Hi team at Stripe,\n\nI was looking through your payments platform pages and noticed how compelling your infrastructure story is, but prospective leads must read through dense documentation to understand the unified workflow.\n\nWe specialize in producing high-converting 60-second product explainers. Placing an interactive explainer in your hero section could significantly clarify your multi-currency routing for first-time visitors.\n\nWould you be open to a 10-minute chat this Thursday to review 3 quick video concepts we drafted for Stripe?\n\nBest regards",
    "word_count": 82
  },
  "warnings_and_limitations": [
    "Inspection completed across 1 page(s) on target domain."
  ],
  "error_message": null
}
```

#### Error Behavior (When GEMINI_API_KEY is not configured)
If `GEMINI_API_KEY` is not set or set to the placeholder:
```json
{
  "requested_url": "https://example.com",
  "final_url": "https://example.com",
  "status": "failed",
  "inspection": { ... },
  "recommendations": [],
  "outreach_email": null,
  "warnings_and_limitations": [ ... ],
  "error_message": "GEMINI_API_KEY is not configured. Please set a valid Gemini API key in backend/.env."
}
```

---

## Phase 4 Core Features

1. **Evidence Grounding**:
   - Recommendations reference only URLs from `pages_inspected`.
   - Evidence quotes and headings are derived from actual crawled content.
   - Distinct video types prevent repetitive concept proposals.
2. **Strict Email Word Limit**:
   - Python-level word counting enforces strictly `< 120 words`.
   - Trims safely at sentence boundaries if the model exceeds the limit.
   - Neutral sign-offs without fabricated sender details or false claims.
3. **Safety & Prompt Injection Defense**:
   - Scraped website content is labeled as untrusted data.
   - System prompts instruct the model to ignore embedded commands or prompt override attempts.
4. **Resilient Error Handling**:
   - Missing API key returns safe configuration instructions without crashing.
   - Inspection failure halts execution immediately before invoking Gemini.
   - API rate limits, timeouts, and auth errors return user-friendly error messages without leaking secrets.

---

## Running Tests

Run the full pytest suite from the `backend` directory (all AI calls and HTTP requests are mocked):

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
```

---

## Manual AI Testing with a Real Gemini Key

To run a live test with your own Gemini API key:
1. Open `backend/.env`.
2. Set `GEMINI_API_KEY=AIzaSy...` (your actual key).
3. In PowerShell, send a POST request:
   ```powershell
   $body = @{ url = 'https://example.com' } | ConvertTo-Json
   Invoke-RestMethod -Uri http://127.0.0.1:8000/api/analyze -Method Post -ContentType 'application/json' -Body $body
   ```
4. Verify the 3 generated recommendations and verified email word count.
