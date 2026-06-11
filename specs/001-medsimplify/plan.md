# Plan: MedSimplify

## Tech Stack
- **Frontend**: React + Vite
- **Backend**: Python FastAPI
- **AI**: Groq API (Llama 3.3 70B)
- **Deployment**: Vercel (frontend) + Render (backend)
- **Version Control**: GitHub + GitLab (Swecha)

## Architecture

```
User Browser
    │
    ▼
Vercel (React + Vite)
    │  POST /analyze
    ▼
Render (FastAPI Backend)
    │  POST to Groq API
    ▼
Groq (Llama 3.3 70B)
    │  JSON response
    ▼
Rendered Results in Browser
```

## API Design

### POST /analyze
**Request:**
```json
{
  "report_text": "string",
  "language": "english | hindi | marathi | tamil | telugu | kannada",
  "mode": "normal | eli5 | doctor"
}
```

**Response:**
```json
{
  "result": "{...JSON string with findings...}"
}
```

### GET /health
Returns `{"status": "ok"}`

## Data Model

### Finding
```json
{
  "name": "string",
  "value": "string | null",
  "status": "normal | attention | urgent",
  "simple": "string",
  "causes": "string | null",
  "questions": "string | null",
  "lifestyle": "string | null"
}
```

### AnalysisResult
```json
{
  "summary": "string",
  "reportType": "string",
  "findings": "[Finding]",
  "doctorSummary": "string | null",
  "overallStatus": "normal | attention | urgent",
  "disclaimer": "string"
}
```

## Security
- Groq API key stored as environment variable on Render
- CORS enabled for frontend domain only in production
- No user data stored or logged
