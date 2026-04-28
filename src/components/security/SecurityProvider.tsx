import { useEffect, useRef, useState, createContext, useContext } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Eye } from "lucide-react";

// ─── Security Context ───────────────────────────────────────────────────────
interface SecurityContextType {
  securityLevel: "normal" | "warning" | "critical";
  violations: number;
}
const SecurityContext = createContext<SecurityContextType>({
  securityLevel: "normal",
  violations: 0,
});
export const useSecurity = () => useContext(SecurityContext);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateSessionId() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

// Anomaly detector — tracks suspicious patterns
class AnomalyDetector {
  private events: { type: string; ts: number }[] = [];

  record(type: string) {
    this.events.push({ type, ts: Date.now() });
    // Keep last 50 events only
    if (this.events.length > 50) this.events.shift();
  }

  /** Returns a 0–100 risk score based on recent event frequency */
  riskScore(): number {
    const windowMs = 10_000; // 10 seconds
    const now = Date.now();
    const recent = this.events.filter((e) => now - e.ts < windowMs);
    const devtoolsEvents = recent.filter((e) => e.type === "devtools").length;
    const screenshotEvents = recent.filter((e) => e.type === "screenshot").length;
    const copyEvents = recent.filter((e) => e.type === "copy").length;
    return Math.min(100, devtoolsEvents * 30 + screenshotEvents * 25 + copyEvents * 10);
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [blurred, setBlurred] = useState(false);
  const [violations, setViolations] = useState(0);
  const [securityLevel, setSecurityLevel] = useState<"normal" | "warning" | "critical">("normal");
  const [warningMsg, setWarningMsg] = useState("");
  const sessionId = useRef(generateSessionId());
  const detector = useRef(new AnomalyDetector());
  const devtoolsInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const addViolation = (type: string, msg: string) => {
    detector.current.record(type);
    const score = detector.current.riskScore();
    setViolations((v) => v + 1);
    setWarningMsg(msg);
    if (score >= 60) {
      setSecurityLevel("critical");
    } else if (score >= 25) {
      setSecurityLevel("warning");
    }
    // Auto-clear warning after 4 seconds
    setTimeout(() => setWarningMsg(""), 4000);
  };

  useEffect(() => {
    // ── 1. Disable right-click ─────────────────────────────────────────────
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addViolation("copy", "Right-click is disabled on EdWorld.");
    };

    // ── 2. Block dangerous keyboard shortcuts ──────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      const blocked = [
        // DevTools
        e.key === "F12",
        e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key),
        e.ctrlKey && e.key === "U", // View source
        e.ctrlKey && e.key === "S", // Save page
        e.ctrlKey && e.key === "P", // Print
        // Screenshot helpers
        e.key === "PrintScreen",
        e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key), // Mac screenshot
      ];
      if (blocked.some(Boolean)) {
        e.preventDefault();
        e.stopPropagation();
        addViolation("screenshot", "🔒 This action is blocked by EdWorld Security.");
      }
    };

    // ── 3. Disable text selection ──────────────────────────────────────────
    const onSelectStart = (e: Event) => {
      // Allow selection inside inputs/textareas
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      e.preventDefault();
    };

    // ── 4. Block copy/cut ──────────────────────────────────────────────────
    const onCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      e.preventDefault();
      addViolation("copy", "Copying content is not allowed.");
    };
    const onCut = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    // ── 5. DevTools detection (size-difference heuristic) ──────────────────
    const detectDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > threshold || heightDiff > threshold) {
        addViolation("devtools", "⚠️ Developer Tools detected. Session flagged.");
      }
    };
    devtoolsInterval.current = setInterval(detectDevTools, 1500);

    // ── 6. Blur content when window loses focus (potential screenshot tool) ─
    const onVisibilityChange = () => {
      if (document.hidden) {
        setBlurred(true);
      } else {
        // Short delay so re-appearing screen doesn't flash unblurred
        setTimeout(() => setBlurred(false), 300);
      }
    };

    const onWindowBlur = () => setBlurred(true);
    const onWindowFocus = () => setTimeout(() => setBlurred(false), 300);

    // ── 7. Screen Capture API detection ───────────────────────────────────
    // If getDisplayMedia is called (screen share/capture), flag it
    const origGetDisplayMedia = navigator.mediaDevices?.getDisplayMedia?.bind(
      navigator.mediaDevices
    );
    if (navigator.mediaDevices && origGetDisplayMedia) {
      (navigator.mediaDevices as any).getDisplayMedia = async (...args: any[]) => {
        addViolation("screenshot", "🚨 Screen capture attempt blocked by EdWorld.");
        throw new DOMException("Permission denied", "NotAllowedError");
      };
    }

    // ── 8. Drag prevention ─────────────────────────────────────────────────
    const onDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "IMG") return;
      e.preventDefault();
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("selectstart", onSelectStart);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("dragstart", onDragStart);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("selectstart", onSelectStart);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("dragstart", onDragStart);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
      if (devtoolsInterval.current) clearInterval(devtoolsInterval.current);
      // Restore getDisplayMedia
      if (navigator.mediaDevices && origGetDisplayMedia) {
        (navigator.mediaDevices as any).getDisplayMedia = origGetDisplayMedia;
      }
    };
  }, []);

  // Watermark text — includes user ID and session for forensic traceability
  const watermarkText = user
    ? `EdWorld · ${user.email ?? "user"} · Session ${sessionId.current}`
    : `EdWorld Secured · Session ${sessionId.current}`;

  return (
    <SecurityContext.Provider value={{ securityLevel, violations }}>
      {/* ── Global CSS overrides for screenshot prevention ── */}
      <style>{`
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
        }
        input, textarea, [contenteditable="true"] {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          user-select: text !important;
        }
        img {
          -webkit-user-drag: none !important;
          pointer-events: none !important;
        }
        /* Make page blank when printing */
        @media print {
          body * { visibility: hidden !important; }
          body::after {
            visibility: visible !important;
            content: "🔒 Printing is disabled on EdWorld for security reasons.";
            display: block;
            font-size: 24px;
            text-align: center;
            margin-top: 40vh;
            color: #000;
          }
        }
      `}</style>

      {/* ── Invisible forensic watermark (visible on screenshots) ── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9997,
          pointerEvents: "none",
          overflow: "hidden",
          opacity: 0.035,
        }}
      >
        {Array.from({ length: 12 }).map((_, row) =>
          Array.from({ length: 6 }).map((_, col) => (
            <div
              key={`${row}-${col}`}
              style={{
                position: "absolute",
                top: `${row * 9}%`,
                left: `${col * 17}%`,
                transform: "rotate(-30deg)",
                fontSize: "10px",
                fontWeight: 700,
                whiteSpace: "nowrap",
                color: "#000",
                userSelect: "none",
              }}
            >
              {watermarkText}
            </div>
          ))
        )}
      </div>

      {/* ── Blur overlay when window loses focus ── */}
      <AnimatePresence>
        {blurred && (
          <motion.div
            key="blur-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ color: "white", textAlign: "center" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <Eye size={28} color="white" />
              </div>
              <p style={{ fontSize: 20, fontWeight: 900, letterSpacing: 1 }}>
                EdWorld — Content Protected
              </p>
              <p style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                Click anywhere to resume
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Security warning toast ── */}
      <AnimatePresence>
        {warningMsg && (
          <motion.div
            key="sec-warn"
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            style={{
              position: "fixed",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 9999,
              background:
                securityLevel === "critical"
                  ? "linear-gradient(135deg,#7f1d1d,#dc2626)"
                  : "linear-gradient(135deg,#1e293b,#334155)",
              color: "white",
              borderRadius: 16,
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              maxWidth: "90vw",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <ShieldAlert size={18} color={securityLevel === "critical" ? "#fca5a5" : "#94a3b8"} />
            <span>{warningMsg}</span>
            {violations > 2 && (
              <span
                style={{
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: 8,
                  padding: "2px 8px",
                  fontSize: 11,
                }}
              >
                Violation #{violations}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </SecurityContext.Provider>
  );
}
