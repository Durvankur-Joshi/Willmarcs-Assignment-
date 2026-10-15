# Video Opportunity Analyzer

An AI-powered web application that analyzes a company's website URL, detects existing video assets, recommends exactly three evidence-based video opportunities, and crafts a concise, personalized outreach email (< 120 words).

> **Current Status**: Phase 3 Complete — Website Reader & Existing Video Detection.

---

## Prerequisites

- **Node.js**: v18+ (tested on Node.js v24.15.0 with npm 11.12.1)
- **Python**: 3.11 (tested on Python 3.11.0)
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
        inspect.py
      routes/
        __init__.py
        inspect.py
      services/
        __init__.py
        content_extractor.py
        http_client.py
        url_validator.py
        video_detector.py
        website_reader.py
      __init__.py
      main.py
    tests/
      __init__.py
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

1. Create a Python 3.11 virtual environment:
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
   Edit `.env` to configure your settings (such as `FRONTEND_ORIGIN`).

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
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

*Note: If port 8000 is occupied, run with `--port 8001`.*

### Terminal 2: Frontend Service (Vite + React)

```powershell
cd frontend
npm run dev
```
- **Frontend URL**: [http://localhost:5173/](http://localhost:5173/)

---

## Phase 3: Website Inspection & Video Detection API

### Endpoint: `POST /api/website/inspect`

Inspects a company's public website, extracts structured page content, identifies relevant About/Product/Features pages, and scans for video elements and embeds.

#### Example Request
```json
{
  "url": "https://example.com",
  "max_additional_pages": 3
}
```

#### Example Response
```json
{
  "requested_url": "https://example.com",
  "final_url": "https://example.com",
  "status": "success",
  "title": "Example Domain",
  "meta_description": null,
  "factual_summary": "Website Title: Example Domain. This domain is for use in documentation examples without needing permission.",
  "headings": {
    "h1": ["Example Domain"],
    "h2": [],
    "h3": []
  },
  "pages_inspected": [
    {
      "url": "https://example.com",
      "title": "Example Domain",
      "status_code": 200,
      "status": "crawled",
      "error_message": null
    }
  ],
  "discovered_relevant_pages": [],
  "video_detection": "no_video_detected",
  "video_evidence": [],
  "warnings_and_limitations": [
    "Inspection completed across 1 page(s) on target domain.",
    "Video detection is limited to static HTML5 tags, embedded iframes (YouTube, Vimeo, Wistia, etc.), video links, and metadata.",
    "Videos rendered dynamically via client-side JavaScript or behind login authentication were not evaluated."
  ],
  "error_message": null
}
```

### Key Capabilities

1. **URL Validation & SSRF Prevention**:
   - Rejects non-HTTP/HTTPS protocols (ftp, file, javascript, data).
   - Rejects loopback addresses (`127.0.0.0/8`, `::1`), private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local (`169.254.0.0/16`), and blocked hostnames (`localhost`, `*.internal`, etc.).
   - Validates every redirect target against SSRF boundaries and prevents redirect loops.
   - Enforces a 2MB maximum response size and 8-second timeout.

2. **Content Extraction**:
   - Extracts page titles, meta descriptions, and semantic headings (`H1`, `H2`, `H3`).
   - Filters out boilerplate elements (`nav`, `footer`, scripts, styles, cookie/privacy modals).
   - Generates a concise, strictly factual summary without using any external LLMs.
   - Discovers relevant same-domain subpages based on keywords (`about`, `product`, `features`, `pricing`, etc.).

3. **Existing Video Detection**:
   - Detects `<video>` tags and `<source>` media files.
   - Identifies YouTube, Vimeo, Wistia, Loom, and Vidyard iframe players.
   - Detects direct video links (`.mp4`, `.webm`) and public video platform links.
   - Extracts structured metadata (`og:video`, `twitter:player`, Schema.org `VideoObject`).
   - Categorizes detection confidence into `video_detected`, `possible_video_detected`, and `no_video_detected`.

---

## Running Tests

Run the full pytest suite from the `backend` directory:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
```

---

## Known Scope & Limitations

- **JavaScript Single Page Applications**: Video detection relies on server-rendered static HTML responses. Videos loaded asynchronously via client-side JavaScript execution or custom Web Components are marked as inconclusive or uninspected.
- **Authentication & Paywalls**: Crawling is limited strictly to publicly reachable pages. Login-protected areas or pages behind bot challenges (Cloudflare, CAPTCHA) return a structured failure.
- **Crawl Boundary**: Crawling is capped at a configurable small depth (`max_additional_pages=3`) to respect target server bandwidth and prevent denial of service.
