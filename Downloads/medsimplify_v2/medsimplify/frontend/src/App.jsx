import { useState, useRef } from "react";

const LANGUAGES = [
  { code: "english", label: "English" },
  { code: "hindi", label: "हिंदी (Hindi)" },
  { code: "marathi", label: "मराठी (Marathi)" },
  { code: "tamil", label: "தமிழ் (Tamil)" },
  { code: "telugu", label: "తెలుగు (Telugu)" },
  { code: "kannada", label: "ಕನ್ನಡ (Kannada)" },
];

const MODES = [
  { id: "normal",  label: "Standard",           icon: "📋", desc: "Clear medical explanation" },
  { id: "eli5",   label: "Explain like I'm 10", icon: "🧒", desc: "Super simple language" },
  { id: "doctor", label: "Doctor Visit Summary", icon: "🩺", desc: "Questions to ask your doctor" },
];

function StatusBadge({ status }) {
  const map = {
    normal:    { bg: "#dcfce7", color: "#166534", dot: "#16a34a", label: "Normal" },
    attention: { bg: "#fef9c3", color: "#854d0e", dot: "#ca8a04", label: "Monitor" },
    urgent:    { bg: "#fee2e2", color: "#991b1b", dot: "#dc2626", label: "See Doctor" },
  };
  const s = map[status] || map.normal;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "2px 10px",
                   fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

function FindingCard({ finding }) {
  const [open, setOpen] = useState(false);
  const borderColor = { normal: "#16a34a", attention: "#ca8a04", urgent: "#dc2626" }[finding.status] || "#16a34a";
  return (
    <div style={{ border: `1px solid ${borderColor}28`, borderLeft: `3px solid ${borderColor}`,
                  borderRadius: 10, padding: "12px 14px", background: "#fff", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>{finding.name}</div>
          {finding.value && finding.value !== "null" &&
            <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>{finding.value}</div>}
        </div>
        <StatusBadge status={finding.status} />
      </div>
      <div style={{ fontSize: 13, color: "#444", marginTop: 8, lineHeight: 1.65 }}>{finding.simple}</div>
      {finding.causes && finding.causes !== "null" && (
        <button onClick={() => setOpen(!open)}
          style={{ marginTop: 8, fontSize: 12, color: "#2563eb", background: "none", border: "none",
                   cursor: "pointer", padding: 0, fontWeight: 500 }}>
          {open ? "▲ Less detail" : "▼ What does this mean?"}
        </button>
      )}
      {open && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
          {finding.causes    && finding.causes    !== "null" && <Row label="Common causes"   val={finding.causes} />}
          {finding.questions && finding.questions !== "null" && <Row label="Ask your doctor" val={finding.questions} />}
          {finding.lifestyle && finding.lifestyle !== "null" && <Row label="Lifestyle tip"   val={finding.lifestyle} />}
        </div>
      )}
    </div>
  );
}

function Row({ label, val }) {
  return (
    <div style={{ fontSize: 12, color: "#555" }}>
      <span style={{ fontWeight: 600, color: "#333" }}>{label}: </span>{val}
    </div>
  );
}

export default function App() {
  const [reportText, setReportText] = useState("");
  const [language,   setLanguage]   = useState("english");
  const [mode,       setMode]       = useState("normal");
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState("");
  const [tab,        setTab]        = useState("upload");
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    if (file.type === "text/plain") {
      const text = await file.text();
      setReportText(text);
    } else {
      setReportText(`[File: ${file.name}]\n\nPlease also paste the text content of this file below for analysis.`);
    }
    setTab("analyze");
  };

  const analyze = async () => {
    if (!reportText.trim()) { setError("Please paste or upload your medical report first."); return; }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_text: reportText, language, mode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }
      const data = await res.json();
      const parsed = JSON.parse(data.result);
      setResult(parsed);
      setTab("result");
    } catch (e) {
      setError("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const overallColor = { normal: "#16a34a", attention: "#ca8a04", urgent: "#dc2626" };
  const overallBg    = { normal: "#f0fdf4", attention: "#fefce8", urgent: "#fff1f2" };
  const tabStyle = (id, disabled) => ({
    padding: "10px 18px", border: "none", background: "none",
    borderBottom: tab === id ? "2px solid #2563eb" : "2px solid transparent",
    color: tab === id ? "#2563eb" : disabled ? "#d1d5db" : "#6b7280",
    fontWeight: tab === id ? 600 : 400,
    fontSize: 13, cursor: disabled ? "default" : "pointer",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", justifyContent: "center", padding: "32px 16px" }}>
      <div style={{ width: "100%", maxWidth: 680 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eff6ff",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🏥</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: -0.5 }}>MedSimplify</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Medical report explainer · Powered by Groq AI</div>
          </div>
        </div>

        <div style={{ borderBottom: "1px solid #e5e7eb", marginBottom: 20 }} />

        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: 24 }}>
          <button style={tabStyle("upload", false)}  onClick={() => setTab("upload")}>📁 Upload / Paste</button>
          <button style={tabStyle("analyze", false)} onClick={() => setTab("analyze")}>⚙️ Settings</button>
          <button style={tabStyle("result", !result)} onClick={() => result && setTab("result")} disabled={!result}>
            📊 Results
          </button>
        </div>

        {tab === "upload" && (
          <div>
            <div
              onClick={() => fileRef.current.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              style={{ border: "2px dashed #cbd5e1", borderRadius: 12, padding: "36px 20px",
                       textAlign: "center", cursor: "pointer", marginBottom: 16, background: "#fff" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
              <div style={{ fontWeight: 600, color: "#374151", fontSize: 14 }}>Drop your report or click to browse</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>PDF, JPG, PNG, TXT</div>
              <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.txt"
                style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8, fontWeight: 500 }}>Or paste report text directly</div>
            <textarea value={reportText} onChange={e => setReportText(e.target.value)}
              placeholder="Paste blood test results, ultrasound findings, discharge summary…"
              style={{ width: "100%", minHeight: 180, padding: 12, borderRadius: 10,
                       border: "1px solid #d1d5db", fontSize: 13, resize: "vertical", lineHeight: 1.65 }} />
            <button onClick={() => reportText.trim() && setTab("analyze")} disabled={!reportText.trim()}
              style={{ marginTop: 12, padding: "10px 24px",
                       background: reportText.trim() ? "#2563eb" : "#e5e7eb",
                       color: reportText.trim() ? "#fff" : "#9ca3af",
                       border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
                       cursor: reportText.trim() ? "pointer" : "default" }}>
              Continue →
            </button>
          </div>
        )}

        {tab === "analyze" && (
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#111", marginBottom: 12 }}>Explanation Mode</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              {MODES.map(m => (
                <div key={m.id} onClick={() => setMode(m.id)}
                  style={{ flex: "1 1 160px", border: mode === m.id ? "2px solid #2563eb" : "1px solid #e5e7eb",
                           borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                           background: mode === m.id ? "#eff6ff" : "#fff" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{m.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#111" }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{m.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ fontWeight: 600, fontSize: 14, color: "#111", marginBottom: 10 }}>Language</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => setLanguage(l.code)}
                  style={{ padding: "7px 14px", borderRadius: 20,
                           border: language === l.code ? "2px solid #2563eb" : "1px solid #d1d5db",
                           background: language === l.code ? "#eff6ff" : "#fff",
                           color: language === l.code ? "#2563eb" : "#374151",
                           fontSize: 13, cursor: "pointer", fontWeight: language === l.code ? 600 : 400 }}>
                  {l.label}
                </button>
              ))}
            </div>

            {reportText && (
              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10,
                            padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#0c4a6e" }}>
                📄 Report loaded · {reportText.length} characters
              </div>
            )}

            {error && (
              <div style={{ background: "#fff1f2", border: "1px solid #fca5a5", borderRadius: 8,
                            padding: "10px 14px", fontSize: 13, color: "#b91c1c", marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button onClick={analyze} disabled={loading || !reportText.trim()}
              style={{ width: "100%", padding: 14,
                       background: loading ? "#93c5fd" : !reportText.trim() ? "#e5e7eb" : "#2563eb",
                       color: !reportText.trim() ? "#9ca3af" : "#fff",
                       border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
                       cursor: loading || !reportText.trim() ? "default" : "pointer" }}>
              {loading ? "🔍 Analyzing your report…" : "✨ Simplify My Report"}
            </button>
          </div>
        )}

        {tab === "result" && result && (
          <div>
            <div style={{ background: overallBg[result.overallStatus] || "#f0fdf4",
                          border: `1px solid ${overallColor[result.overallStatus] || "#16a34a"}30`,
                          borderRadius: 12, padding: "16px 18px", marginBottom: 20,
                          display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ fontSize: 32 }}>
                {result.overallStatus === "urgent" ? "🔴" : result.overallStatus === "attention" ? "🟡" : "🟢"}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: overallColor[result.overallStatus] || "#16a34a", marginBottom: 4 }}>
                  {result.reportType || "Medical Report"}
                </div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.65 }}>{result.summary}</div>
              </div>
            </div>

            <div style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 12 }}>
              Findings ({result.findings?.length || 0})
            </div>
            {result.findings?.map((f, i) => <FindingCard key={i} finding={f} />)}

            {result.doctorSummary && result.doctorSummary !== "null" && (
              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: 16, marginTop: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0c4a6e", marginBottom: 8 }}>🩺 Doctor Visit Summary</div>
                <div style={{ fontSize: 13, color: "#0c4a6e", lineHeight: 1.8, whiteSpace: "pre-line" }}>{result.doctorSummary}</div>
              </div>
            )}

            <div style={{ display: "flex", gap: 16, marginTop: 20, flexWrap: "wrap" }}>
              {[{ s: "normal", label: "Normal range" }, { s: "attention", label: "Slight deviation" }, { s: "urgent", label: "Consult doctor" }].map(l => (
                <div key={l.s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" }}>
                  <StatusBadge status={l.s} /> {l.label}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, background: "#fffbeb", border: "1px solid #fde68a",
                          borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "#92400e", lineHeight: 1.65 }}>
              ⚠️ <strong>Important:</strong> {result.disclaimer || "This tool helps you understand your report but does not diagnose diseases or replace professional medical advice. Always consult a qualified doctor."}
            </div>

            <button onClick={() => { setResult(null); setTab("upload"); setReportText(""); }}
              style={{ marginTop: 16, padding: "9px 20px", background: "#fff", border: "1px solid #d1d5db",
                       borderRadius: 8, fontSize: 13, color: "#374151", cursor: "pointer" }}>
              ← Analyze another report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
