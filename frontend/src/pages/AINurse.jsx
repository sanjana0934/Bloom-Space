import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { api } from "../api.js";

// Models are loaded at runtime from a CDN -- nothing is bundled into the app,
// and no photo ever leaves the browser. Only the detected mood label + confidence
// score are sent to the backend.
const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

const MOOD_LABELS = {
  happy: "Happy",
  sad: "Sad",
  angry: "Frustrated",
  fearful: "Anxious",
  disgusted: "Uneasy",
  surprised: "Surprised",
  neutral: "Calm",
};

export default function AINurse() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadModels() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsReady(true);
      } catch {
        setError("Couldn't load the mood-detection models. Check your internet connection and reload this page.");
      }
    }
    loadModels();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setError("Couldn't access your camera. Check your browser's camera permissions and try again.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function analyze() {
    if (!videoRef.current) return;
    setAnalyzing(true);
    setError("");
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (!detection) {
        setError("Couldn't detect a face clearly. Try better lighting or moving a bit closer.");
        setAnalyzing(false);
        return;
      }

      const expressions = detection.expressions;
      const [topMood, topScore] = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0];

      const res = await api.nurseScan(topMood, topScore);
      setResult(res);
    } catch {
      setError("Something went wrong analyzing that. Try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>AI Nurse</h2>
        <p>
          A quick mood check using your camera. Your photo is analyzed locally in your browser and never uploaded or
          stored -- only the detected mood label is saved, and it's shared with your support team as part of your
          weekly summary.
        </p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        {!modelsReady && !error && <div className="loading-state">Loading mood-detection models...</div>}

        {modelsReady && (
          <>
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: "100%",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-alt)",
                display: cameraOn ? "block" : "none",
                transform: "scaleX(-1)",
              }}
            />
            {!cameraOn && (
              <div style={{ padding: "40px 0", color: "var(--ink-faint)" }}>Camera is off</div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
              {!cameraOn ? (
                <button className="btn btn-primary" style={{ width: "auto" }} onClick={startCamera}>
                  Start camera
                </button>
              ) : (
                <>
                  <button className="btn btn-primary" style={{ width: "auto" }} onClick={analyze} disabled={analyzing}>
                    {analyzing ? "Analyzing..." : "Capture & analyze"}
                  </button>
                  <button className="btn btn-outline" onClick={stopCamera}>Stop camera</button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {result && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="stat-label">Detected mood</div>
          <div className="stat-value" style={{ fontSize: 26, margin: "6px 0" }}>
            {MOOD_LABELS[result.mood] || result.mood}
          </div>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, marginTop: 8 }}>{result.instructions}</p>
          {result.helplines && (
            <div style={{ marginTop: 12 }}>
              {result.helplines.map((h) => (
                <div className="helpline-card" key={h.name}>
                  <div className="hl-name">{h.name}</div>
                  <div className="hl-detail">{h.detail}</div>
                  <div className="hl-contact">{h.contact}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <p style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>
          This is an approximate, camera-based reading -- not a medical or diagnostic tool. If something feels
          seriously wrong, please reach out to a real person or use the Immediate Help chat.
        </p>
      </div>
    </div>
  );
}