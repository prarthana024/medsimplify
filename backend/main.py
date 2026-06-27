import re
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import pdfplumber
import io
from fastapi import File, UploadFile


GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

app = FastAPI(title="MedSimplify API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    report_text: str
    language: str = "english"
    mode: str = "normal"


def build_prompt(report_text: str, language: str, mode: str) -> str:
    lang_note = (
        f"Respond entirely in {language}. All explanations, labels, and text must be in {language}."
        if language != "english"
        else ""
    )
    mode_note = {
        "eli5": "Use extremely simple language a 10-year-old would understand. No medical jargon at all.",
        "doctor": "Focus on generating a doctor visit summary with key questions the patient should ask their doctor.",
        "normal": "Use clear, friendly language for a patient with no medical background.",
    }.get(mode, "")

    doctor_field = (
        '"List of key questions and points for the doctor visit"'
        if mode == "doctor"
        else '"null"'
    )

    return f"""You are MedSimplify, a medical report explainer. {mode_note} {lang_note}

Analyze this medical report and respond ONLY with a valid JSON object (no markdown, no extra text):

{{
  "summary": "2-3 sentence friendly overview of the report",
  "reportType": "e.g. Blood Test, Ultrasound, Discharge Summary",
  "findings": [
    {{
      "name": "Finding or test name",
      "value": "Value with units if applicable, or null",
      "status": "normal|attention|urgent",
      "simple": "Plain language explanation",
      "causes": "Common causes if abnormal, or null",
      "questions": "Question to ask the doctor, or null",
      "lifestyle": "Lifestyle tip if relevant, or null"
    }}
  ],
  "doctorSummary": {doctor_field},
  "overallStatus": "normal|attention|urgent",
  "disclaimer": "Short reminder that this is not a diagnosis"
}}

Medical Report:
{report_text}"""


from fastapi.responses import JSONResponse

@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    if not req.report_text.strip():
        raise HTTPException(status_code=400, detail="Report text is empty")

    prompt = build_prompt(req.report_text, req.language, req.mode)

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            res = await client.post(
                GROQ_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 2000,
                },
            )
            if res.status_code != 200:
                detail = res.json().get("error", {}).get("message", "Groq API error")
                raise HTTPException(status_code=res.status_code, detail=detail)

            data = res.json()
            raw = data["choices"][0]["message"]["content"].strip()
            clean = raw.replace("```json", "").replace("```", "").strip()
            return JSONResponse(
            content={"result": clean},
            headers={
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Pragma": "no-cache",
        }
)

        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Request timed out. Try again.")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        text = ""
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r' {2,}', ' ', text)
        text = text.strip()[:6000]
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
