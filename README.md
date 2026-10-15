# Video Opportunity Analyzer

An AI-powered full-stack web application that inspects a company's public website URL, detects existing video assets, recommends exactly three evidence-based video placement opportunities, and drafts a personalized cold outreach email (< 120 words).

> **Current Status**: Production Ready — Cleaned user interface, polished typography, full-stack live analysis workflow verified on target websites, comprehensive test suite, and submission-ready documentation.

---

## Architecture & Technology Stack

- **Backend**: Python 3.11, FastAPI, Pydantic v2, BeautifulSoup4, Requests, Google GenAI SDK (`google-genai` / `gemini-2.5-flash`), Pytest.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui primitives, Lucide React icons.
- **API Communication**: REST JSON over HTTP with configurable base URL (`VITE_API_BASE_URL`), AbortController timeout protection, and granular HTTP/JSON error decoding.

---

## Prerequisites

- **Node.js**: v18+ (tested on Node.js v24.15.0 with npm 11.12.1)
- **Python**: 3.11 (tested on Python 3.11.0)
- **Google Gemini API Key**: Free API key from [Google AI Studio](https://aistudio.google.com/app/apikey) (required for live AI recommendation generation; not required for unit testing or UI preview).
- **Windows PowerShell** (or compatible terminal)

---

## Project Structure

```text
Willmarcs-Assignment/
  frontend/
    .env.example
    .env
    src/
      components/
        ui/
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
    tests/
      api_and_flow.test.mjs
    package.json
    tsconfig.json
    vite.config.ts
  backend/
    .env.example
    .env
    app/
      models/
        analysis.py
        inspect.py
      routes/
        analysis.py
        inspect.py
      services/
        ai_analyzer.py
        content_extractor.py
        http_client.py
        url_validator.py
        video_detector.py
        website_reader.py
      main.py
    tests/
      test_analysis.py
      test_health.py
      test_inspect.py
    requirements.txt
  results/
    notion.json
    razorpay.json
    zoho-crm.json
    test-report.md
  README.md
```

---

## Environment Configuration

### 1. Frontend Environment (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:
```powershell
Copy-Item frontend\.env.example frontend\.env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL of the FastAPI backend. Change to `http://localhost:8001` if port 8000 is occupied. |

> **Note**: Never expose `GEMINI_API_KEY` or any backend secret in frontend `.env` files. Frontend only communicates with the backend API.

### 2. Backend Environment (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:
```powershell
Copy-Item backend\.env.example backend\.env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | `your_gemini_api_key_here` | Your Google Gemini API key from Google AI Studio. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model name (default: `gemini-2.5-flash`). |
| `FRONTEND_ORIGIN` | `http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173` | Allowed CORS origins for the frontend application. |
| `PORT` | `8000` | Backend server port (change to `8001` if port 8000 is unavailable). |
| `HOST` | `127.0.0.1` | Backend bind host. |

---

## Running the Application Locally

Run both applications concurrently in separate Windows PowerShell windows:

### Terminal 1: Backend Service (FastAPI)

```powershell
cd "e:\Willmarcs Assignment\backend"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

- **Health Check Endpoint**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- **AI Analysis Endpoint**: `POST http://127.0.0.1:8000/api/analyze`
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

*Note for Windows Users*: If port 8000 produces `WinError 10013` (access forbidden / port reserved by Windows Hyper-V/NAT), start on port 8001:
```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001
```
And set `VITE_API_BASE_URL=http://localhost:8001` in `frontend/.env`.

### Terminal 2: Frontend Service (Vite + React)

```powershell
cd "e:\Willmarcs Assignment\frontend"
npm run dev
```

- **Frontend Application URL**: [http://localhost:5173/](http://localhost:5173/)

---

## How to Perform an Analysis

1. Open [http://localhost:5173/](http://localhost:5173/) in your web browser.
2. Verify the header indicator displays **FastAPI Online** (green).
3. Enter any publicly accessible company website URL (e.g. `https://stripe.com`, `https://linear.app`, or `https://example.com`) in the input bar.
4. Click **Analyze Website**.
5. The button transitions to **Analyzing...** with a spinner and disables duplicate submissions while the backend inspects the website DOM, checks for video assets, and generates recommendations.
6. Upon completion, the 4-part dashboard renders:
   - **Analysis Summary**: Verified counts of crawled pages, detected video assets, opportunities identified, and crawl status.
   - **Website Evidence & Audit**: Company title, meta description, factual summary, inspected subpages with HTTP response codes, discovered pages, video detection badges, and crawl boundary limitations.
   - **Exactly 3 Video Recommendations**: Title, video format, suggested page placement, strategic rationale, target audience, suggested outline, supporting evidence, and clickable source page link.
   - **Personalized Outreach Email**: Tailored email copy, subject line, backend-verified word count badge (<120 words), and a 1-click **Copy Email** action.
7. Click **Copy Email** to copy the formatted draft (`Subject: ...\n\n...`) to your clipboard.

---

## UI States and Error Handling

| Scenario / State | Visual Presentation | Suggested Action |
| :--- | :--- | :--- |
| **Initial Empty State** | Dashed card with overview features and quick test links. | Enter URL or click quick test button. |
| **Loading State** | Progress spinner, step-by-step indicator, disabled input and submit button to prevent duplicate submissions. | Automatic transition upon response. |
| **Invalid URL** | Immediate inline validation error below input (`URL must start with http:// or https://`). | Correct the URL syntax. |
| **Target Website Inaccessible** | Red alert card indicating target site returned 403/404 or connection timed out. | Check domain availability or enter another URL. |
| **Backend Server Offline** | Amber alert card stating FastAPI backend at `VITE_API_BASE_URL` cannot be reached. | Start backend via `uvicorn app.main:app --reload --port 8000`. |
| **Gemini API Key Required** | Clear configuration card explaining step-by-step how to add `GEMINI_API_KEY` to `backend/.env`. | Set key in `backend/.env`; optional "Preview Sample Layout" button provided. |
| **Partial Crawl / Inconclusive Video** | Amber notice badge highlighting that subpages were blocked or video detection is inconclusive due to client-side JS rendering. | AI recommendations adapt to available evidence. |

---

## Assignment Deliverables & Test Results

The application was formally evaluated across the three required production websites. Full JSON outputs and an analytical report are preserved in the `results/` directory:

| Target Website | Target URL | Inspected Pages | Video Detected | Recommendations | Outreach Email | Result File |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Notion** | `https://www.notion.com` | 4 pages | Yes | 3 | 88 words (<120) | [`results/notion.json`](results/notion.json) |
| **Razorpay** | `https://razorpay.com` | 4 pages | Yes | 3 | 99 words (<120) | [`results/razorpay.json`](results/razorpay.json) |
| **Zoho CRM** | `https://www.zoho.com/crm` | 4 pages | Yes (7 assets) | 3 | 96 words (<120) | [`results/zoho-crm.json`](results/zoho-crm.json) |

Comprehensive test results, comparative metrics, and evaluation notes are documented in [`results/test-report.md`](results/test-report.md).

---

## Automated Testing

### Backend Unit & Regression Tests (pytest)

Runs 45 automated tests covering health checks, website crawling, SSRF protection, video detection, Gemini 2.5 prompt generation, retry/recovery logic, and word count enforcement (all HTTP and AI calls mocked):

```powershell
cd "e:\Willmarcs Assignment\backend"
.\.venv\Scripts\python.exe -m pytest -v
```

### Frontend Unit & Flow Tests (Node.js test runner)

Runs 13 automated tests covering response adaptation, network failure handling, timeout handling, HTTP 422 errors, Gemini unconfigured error handling, email word count auditing, clipboard formatting, duplicate submission prevention, and error states:

```powershell
cd "e:\Willmarcs Assignment\frontend"
npm test
```

### Frontend Production Build & Typecheck

```powershell
cd "e:\Willmarcs Assignment\frontend"
npm run build
```

### Frontend Linter

```powershell
cd "e:\Willmarcs Assignment\frontend"
npm run lint
```

---

## Known Limitations

1. **Client-Side Hydration (SPA)**: The website reader uses Python `requests` and `BeautifulSoup4` for static HTML extraction. Sites that load content exclusively through client-side JavaScript execution (e.g., dynamic Single Page Apps with no SSR) may yield partial text or inconclusive video detection.
2. **Authenticated Pages**: Videos or pages hosted behind login walls or CAPTCHA barriers cannot be inspected.
3. **External Social Media**: Video detection is confined to the target domain and embedded iframes (YouTube, Vimeo, Wistia). External social media channels (e.g. company YouTube channels or LinkedIn feeds) are noted as crawl boundaries under "Unknowns".
4. **Gemini Free-Tier Rate Limits**: The Google Gemini free API tier imposes a rate limit of 15 requests per minute (RPM). If rate-limited, wait 60 seconds before submitting a new analysis.
