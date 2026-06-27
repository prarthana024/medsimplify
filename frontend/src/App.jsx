import { useState, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, setDoc, getDoc
} from "firebase/firestore";

// ── Constants ────────────────────────────────────────────────
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

// ── Splash Screen ────────────────────────────────────────────
function SplashScreen() {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "linear-gradient(135deg, #0a2342 0%, #028090 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      zIndex: 9999,
    }}>
      <div style={{ fontSize: 72, marginBottom: 16, animation: "pulse 1.5s ease-in-out infinite" }}>🏥</div>
      <div style={{ fontSize: 42, fontWeight: 800, color: "#fff", letterSpacing: -1, fontFamily: "Georgia, serif" }}>
        MedSimplify
      </div>
      <div style={{ fontSize: 16, color: "#02C39A", marginTop: 8, fontStyle: "italic" }}>
        Understanding your health, in your language
      </div>
      <div style={{ marginTop: 40, display: "flex", gap: 8 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: "50%", background: "#02C39A",
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
      `}</style>
    </div>
  );
}

// ── Auth Screen ──────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await setDoc(doc(db, "users", cred.user.uid), { name, email, createdAt: serverTimestamp() });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      setError(e.message.replace("Firebase: ", "").replace(/\(auth.*\)/, ""));
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a2342 0%, #028090 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: "100%", maxWidth: 400,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏥</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0a2342" }}>MedSimplify</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            {mode === "login" ? "Welcome back!" : "Create your account"}
          </div>
        </div>

        {mode === "signup" && (
          <input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
            style={inputStyle} />
        )}
        <input placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
          type="email" style={inputStyle} />
        <input placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          type="password" style={inputStyle} onKeyDown={e => e.key === "Enter" && handle()} />

        {error && <div style={{ background: "#fff1f2", border: "1px solid #fca5a5", borderRadius: 8,
                                padding: "10px 12px", fontSize: 13, color: "#b91c1c", marginBottom: 12 }}>
          {error}
        </div>}

        <button onClick={handle} disabled={loading}
          style={{ width: "100%", padding: 13, background: loading ? "#93c5fd" : "#0a2342",
                   color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
                   cursor: loading ? "default" : "pointer", marginBottom: 16 }}>
          {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>

        <div style={{ textAlign: "center", fontSize: 13, color: "#6b7280" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            style={{ color: "#028090", cursor: "pointer", fontWeight: 600 }}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </span>
        </div>
      </div>
    </div>
  );
}
const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #d1d5db",
  fontSize: 14, marginBottom: 12, boxSizing: "border-box",
};

// ── Status Badge ─────────────────────────────────────────────
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

// ── Finding Card ─────────────────────────────────────────────
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

// ── Star Rating ──────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1,2,3,4,5].map(star => (
        <span key={star} onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
          style={{ fontSize: 28, cursor: "pointer", color: star <= (hover || value) ? "#f59e0b" : "#d1d5db" }}>
          ★
        </span>
      ))}
    </div>
  );
}

// ── Feedback Tab ─────────────────────────────────────────────
function FeedbackTab({ user }) {
  const [accuracy, setAccuracy]   = useState(0);
  const [clarity, setClarity]     = useState(0);
  const [language, setLanguage]   = useState(0);
  const [overall, setOverall]     = useState(0);
  const [comment, setComment]     = useState("");
  const [reportType, setReportType] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [allFeedback, setAllFeedback] = useState([]);
  const [viewMode, setViewMode] = useState("submit");

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setAllFeedback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    if (viewMode === "view") load();
  }, [viewMode]);

  const handleSubmit = async () => {
    if (overall === 0) return;
    setSubmitting(true);
    await addDoc(collection(db, "feedback"), {
      userId: user.uid, userName: user.displayName || user.email,
      accuracy, clarity, language, overall, comment, reportType,
      createdAt: serverTimestamp(),
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>🙏</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 8 }}>Thank you!</div>
      <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>Your feedback helps improve MedSimplify.</div>
      <button onClick={() => { setSubmitted(false); setAccuracy(0); setClarity(0); setLanguage(0); setOverall(0); setComment(""); setReportType(""); }}
        style={{ padding: "9px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
        Submit another
      </button>
    </div>
  );

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["submit", "view"].map(m => (
          <button key={m} onClick={() => setViewMode(m)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                     background: viewMode === m ? "#0a2342" : "#e5e7eb", color: viewMode === m ? "#fff" : "#374151" }}>
            {m === "submit" ? "✍️ Leave Feedback" : "📊 View All Feedback"}
          </button>
        ))}
      </div>

      {viewMode === "submit" && (
        <>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#111", marginBottom: 4 }}>Share Your Experience</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Help us improve MedSimplify for patients across India.</div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Report type analyzed</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Blood Test", "Ultrasound", "Discharge Summary", "Prescription", "Other"].map(t => (
                <button key={t} onClick={() => setReportType(t)}
                  style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                           border: reportType === t ? "2px solid #028090" : "1px solid #d1d5db",
                           background: reportType === t ? "#e8f7f9" : "#fff",
                           color: reportType === t ? "#028090" : "#374151", fontWeight: reportType === t ? 600 : 400 }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "0 16px", marginBottom: 20 }}>
            {[
              { label: "Accuracy", desc: "Were the explanations medically correct?", val: accuracy, set: setAccuracy },
              { label: "Clarity",  desc: "Were the explanations easy to understand?", val: clarity,  set: setClarity  },
              { label: "Language", desc: "Was the translation/language natural?",      val: language, set: setLanguage },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{r.desc}</div>
                </div>
                <StarRating value={r.val} onChange={r.set} />
              </div>
            ))}
            <div style={{ padding: "14px 0" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 8 }}>
                Overall Rating <span style={{ color: "#dc2626" }}>*</span>
              </div>
              <StarRating value={overall} onChange={setOverall} />
            </div>
          </div>

          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Any additional comments..."
            style={{ width: "100%", minHeight: 90, padding: 12, borderRadius: 10,
                     border: "1px solid #d1d5db", fontSize: 13, resize: "vertical", lineHeight: 1.6,
                     boxSizing: "border-box", marginBottom: 12 }} />

          <button onClick={handleSubmit} disabled={overall === 0 || submitting}
            style={{ width: "100%", padding: 14,
                     background: overall === 0 ? "#e5e7eb" : submitting ? "#93c5fd" : "#028090",
                     color: overall === 0 ? "#9ca3af" : "#fff",
                     border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
                     cursor: overall === 0 ? "default" : "pointer" }}>
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </>
      )}

      {viewMode === "view" && (
        <div>
          {allFeedback.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>No feedback yet.</div>
          ) : allFeedback.map(f => (
            <div key={f.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
                                     padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>{f.userName}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {f.createdAt?.toDate?.()?.toLocaleDateString?.() || ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                {[["Overall", f.overall], ["Accuracy", f.accuracy], ["Clarity", f.clarity], ["Language", f.language]].map(([k,v]) => (
                  <div key={k} style={{ fontSize: 12 }}>
                    <span style={{ color: "#6b7280" }}>{k}: </span>
                    <span style={{ color: "#f59e0b" }}>{"★".repeat(v || 0)}</span>
                    <span style={{ color: "#d1d5db" }}>{"★".repeat(5 - (v || 0))}</span>
                  </div>
                ))}
              </div>
              {f.reportType && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Report: {f.reportType}</div>}
              {f.comment && <div style={{ fontSize: 13, color: "#374151", fontStyle: "italic" }}>"{f.comment}"</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── History Tab ──────────────────────────────────────────────
function HistoryTab({ user, onRestore }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, "users", user.uid, "analyses"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    load();
  }, [user.uid]);

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>Loading history...</div>;
  if (history.length === 0) return (
    <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
      No analyses yet. Analyze your first report!
    </div>
  );

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 16, color: "#111", marginBottom: 16 }}>Your Analysis History</div>
      {history.map(h => (
        <div key={h.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
                                  padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>
                {h.result?.reportType || "Medical Report"}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                {h.createdAt?.toDate?.()?.toLocaleString?.() || ""}
                {h.language && ` · ${h.language}`} {h.mode && `· ${h.mode}`}
              </div>
              <div style={{ fontSize: 13, color: "#555", marginTop: 6, lineHeight: 1.5 }}>
                {h.result?.summary?.slice(0, 120)}...
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 12,
                background: h.result?.overallStatus === "urgent" ? "#fee2e2" : h.result?.overallStatus === "attention" ? "#fef9c3" : "#dcfce7",
                color: h.result?.overallStatus === "urgent" ? "#991b1b" : h.result?.overallStatus === "attention" ? "#854d0e" : "#166534",
              }}>
                {h.result?.overallStatus || "normal"}
              </span>
              <button onClick={() => onRestore(h)}
                style={{ fontSize: 12, color: "#028090", background: "#e8f7f9", border: "none",
                         borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>
                View →
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────
export default function App() {
  const [splash, setSplash]       = useState(true);
  const [user, setUser]           = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [reportText, setReportText] = useState("");
  const [language,   setLanguage]   = useState("english");
  const [mode,       setMode]       = useState("normal");
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState("");
  const [tab,        setTab]        = useState("upload");
  const fileRef = useRef();

  // Splash for 2.5 seconds
  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 2500);
    return () => clearTimeout(t);
  }, []);

  // Auth state
  useEffect(() => {
    return onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.type === "application/pdf") {
      setLoading(true);
      setError("");
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("https://medsimplify-backend.onrender.com/extract-pdf", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("PDF extraction failed");
        const data = await res.json();
        setReportText(data.text);
        setTab("analyze");
      } catch (e) {
        setError("Could not extract PDF: " + e.message);
      } finally {
        setLoading(false);
      }
    } else if (file.type === "text/plain") {
      const t = await file.text();
      setReportText(t);
      setTab("analyze");
    } else {
      setError("Please upload a PDF or TXT file. For images, paste the text manually.");
    }
  };

  const analyze = async () => {
    if (!reportText.trim()) { setError("Please paste or upload your medical report first."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("https://medsimplify-backend.onrender.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_text: reportText, language, mode, timestamp: Date.now() }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Error ${res.status}`); }
      const data = await res.json();
      const parsed = JSON.parse(data.result);
      setResult(parsed);
      setTab("result");
      // Save to Firestore
      if (user) {
        await addDoc(collection(db, "users", user.uid, "analyses"), {
          reportText, result: parsed, language, mode, createdAt: serverTimestamp(),
        });
      }
    } catch (e) { setError("Error: " + e.message); }
    finally { setLoading(false); }
  };

  const restoreHistory = (h) => {
    setReportText(h.reportText || "");
    setResult(h.result);
    setLanguage(h.language || "english");
    setMode(h.mode || "normal");
    setTab("result");
  };

  const overallColor = { normal: "#16a34a", attention: "#ca8a04", urgent: "#dc2626" };
  const overallBg    = { normal: "#f0fdf4", attention: "#fefce8", urgent: "#fff1f2" };

  const tabs = [
    { id: "upload",   label: "📁 Upload" },
    { id: "analyze",  label: "⚙️ Settings" },
    { id: "result",   label: "📊 Results",  disabled: !result },
    { id: "history",  label: "🕒 History" },
    { id: "feedback", label: "💬 Feedback" },
  ];
  const tabStyle = (id, disabled) => ({
    padding: "10px 12px", border: "none", background: "none",
    borderBottom: tab === id ? "2px solid #028090" : "2px solid transparent",
    color: tab === id ? "#028090" : disabled ? "#d1d5db" : "#6b7280",
    fontWeight: tab === id ? 600 : 400, fontSize: 12, cursor: disabled ? "default" : "pointer",
  });

  if (splash) return <SplashScreen />;
  if (authLoading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>;
  if (!user) return <AuthScreen />;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 680 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#e8f7f9",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏥</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0a2342", letterSpacing: -0.5 }}>MedSimplify</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Hi {user.displayName || user.email} 👋</div>
            </div>
          </div>
          <button onClick={() => signOut(auth)}
            style={{ padding: "7px 14px", background: "#fff", border: "1px solid #e5e7eb",
                     borderRadius: 8, fontSize: 13, color: "#374151", cursor: "pointer" }}>
            Sign out
          </button>
        </div>

        <div style={{ borderBottom: "1px solid #e5e7eb", marginBottom: 20 }} />

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: 24, overflowX: "auto" }}>
          {tabs.map(t => (
            <button key={t.id} style={tabStyle(t.id, t.disabled)}
              disabled={t.disabled} onClick={() => !t.disabled && setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Upload Tab */}
        {tab === "upload" && (
          <div>
            <div onClick={() => fileRef.current.click()} onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              style={{ border: "2px dashed #cbd5e1", borderRadius: 12, padding: "32px 20px",
                       textAlign: "center", cursor: "pointer", marginBottom: 16, background: "#fff" }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>📂</div>
              <div style={{ fontWeight: 600, color: "#374151", fontSize: 14 }}>Drop your report or click to browse</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>PDF, JPG, PNG, TXT</div>
              <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.txt"
                style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8, fontWeight: 500 }}>Or paste report text</div>
            <textarea value={reportText} onChange={e => setReportText(e.target.value)}
              placeholder="Paste blood test results, ultrasound findings, discharge summary…"
              style={{ width: "100%", minHeight: 160, padding: 12, borderRadius: 10,
                       border: "1px solid #d1d5db", fontSize: 13, resize: "vertical", lineHeight: 1.65 }} />
            <button onClick={() => reportText.trim() && setTab("analyze")} disabled={!reportText.trim()}
              style={{ marginTop: 12, padding: "10px 24px",
                       background: reportText.trim() ? "#028090" : "#e5e7eb",
                       color: reportText.trim() ? "#fff" : "#9ca3af",
                       border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
                       cursor: reportText.trim() ? "pointer" : "default" }}>
              Continue →
            </button>
          </div>
        )}

        {/* Settings Tab */}
        {tab === "analyze" && (
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#111", marginBottom: 12 }}>Explanation Mode</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              {MODES.map(m => (
                <div key={m.id} onClick={() => setMode(m.id)}
                  style={{ flex: "1 1 160px", border: mode === m.id ? "2px solid #028090" : "1px solid #e5e7eb",
                           borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                           background: mode === m.id ? "#e8f7f9" : "#fff" }}>
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
                           border: language === l.code ? "2px solid #028090" : "1px solid #d1d5db",
                           background: language === l.code ? "#e8f7f9" : "#fff",
                           color: language === l.code ? "#028090" : "#374151",
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
                       background: loading ? "#93c5fd" : !reportText.trim() ? "#e5e7eb" : "#028090",
                       color: !reportText.trim() ? "#9ca3af" : "#fff",
                       border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
                       cursor: loading || !reportText.trim() ? "default" : "pointer" }}>
              {loading ? "🔍 Analyzing your report…" : "✨ Simplify My Report"}
            </button>
          </div>
        )}

        {/* Results Tab */}
        {tab === "result" && result && (
          <div>
            <div style={{ background: overallBg[result.overallStatus] || "#f0fdf4",
                          border: `1px solid ${overallColor[result.overallStatus] || "#16a34a"}30`,
                          borderRadius: 12, padding: "16px 18px", marginBottom: 20,
                          display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ fontSize: 30 }}>
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
              {[{ s: "normal", label: "Normal" }, { s: "attention", label: "Monitor" }, { s: "urgent", label: "See Doctor" }].map(l => (
                <div key={l.s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" }}>
                  <StatusBadge status={l.s} /> {l.label}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, background: "#fffbeb", border: "1px solid #fde68a",
                          borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "#92400e", lineHeight: 1.65 }}>
              ⚠️ <strong>Important:</strong> {result.disclaimer || "This tool does not diagnose diseases or replace professional medical advice. Always consult a qualified doctor."}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => { setResult(null); setReportText(""); setTab("upload"); }}
                style={{ padding: "9px 18px", background: "#fff", border: "1px solid #d1d5db",
                         borderRadius: 8, fontSize: 13, color: "#374151", cursor: "pointer" }}>
                ← New report
              </button>
              <button onClick={() => setTab("feedback")}
                style={{ padding: "9px 18px", background: "#e8f7f9", border: "1px solid #a5d8e0",
                         borderRadius: 8, fontSize: 13, color: "#028090", cursor: "pointer", fontWeight: 600 }}>
                💬 Give Feedback
              </button>
            </div>
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && <HistoryTab user={user} onRestore={restoreHistory} />}

        {/* Feedback Tab */}
        {tab === "feedback" && <FeedbackTab user={user} />}

      </div>
    </div>
  );
}
