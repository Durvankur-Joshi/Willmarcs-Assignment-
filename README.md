# Video Opportunity Analyzer

An AI-powered web application that analyzes a company's website URL, detects existing video assets, recommends exactly three evidence-based video opportunities, and crafts a concise, personalized outreach email (< 120 words).

> **Current Status**: Phase 1 — Project Setup & Environment Scaffolding.

---

## Prerequisites

- **Node.js**: v18+ (tested on Node.js v24.15.0 with npm 11.12.1)
- **Python**: 3.11 (tested on Python 3.11.0)
- **Git**
- **Windows PowerShell** (or compatible shell)

---

## Project Structure

```text
video-opportunity-analyzer/
  frontend/
    src/
      components/
        ui/
          button.tsx
      lib/
        utils.ts
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
      routes/
        __init__.py
      services/
        __init__.py
      __init__.py
      main.py
    tests/
      __init__.py
      test_health.py
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

From the `video-opportunity-analyzer/backend` directory:

1. Create a Python 3.11 virtual environment:
   ```powershell
   py -3.11 -m venv .venv
   ```

2. Activate the virtual environment or run directly via the `.venv` executable:
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```

3. Install required dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```powershell
   Copy-Item .env.example .env
   ```
   Edit `.env` to configure your settings (such as `FRONTEND_ORIGIN` and placeholder for `GEMINI_API_KEY`).

### 2. Frontend Setup

From the `video-opportunity-analyzer/frontend` directory:

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
.\.venv\Scripts\uvicorn.exe app.main:app --reload --host 127.0.0.1 --port 8000
```
- **Health Check Endpoint**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- **Interactive API Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Terminal 2: Frontend Service (Vite + React)

```powershell
cd frontend
npm run dev
```
- **Frontend URL**: [http://localhost:5173/](http://localhost:5173/)

---

## Running Tests & Quality Checks

### Backend Health Test

```powershell
cd backend
.\.venv\Scripts\pytest.exe
```

### Frontend Build & Typecheck

```powershell
cd frontend
npm run build
```
