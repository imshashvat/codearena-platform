import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useProctoring, type ProctoringViolation, type ProctoringOptions } from "@/hooks/useProctoring";
import {
  Shield, Camera, CameraOff, Monitor, MonitorOff,
  Mic, MicOff, AlertTriangle, CheckCircle, XCircle,
  Eye, EyeOff, ChevronRight, Loader2, Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Warning Banner ───────────────────────────────────────────────────────────
export function ProctoringWarningBanner({
  warnings, maxWarnings, faceStatus, bypassDetected,
}: {
  warnings: number;
  maxWarnings: number;
  faceStatus: string;
  bypassDetected: boolean;
}) {
  if (warnings === 0 && faceStatus === 'ok' && !bypassDetected) return null;

  return (
    <div className={cn(
      "fixed top-14 left-0 right-0 z-40 transition-all",
    )}>
      {/* Warning count bar */}
      {warnings > 0 && (
        <div className={cn(
          "flex items-center justify-between px-4 py-2 text-sm font-semibold border-b",
          warnings >= maxWarnings
            ? "bg-red-600 text-white border-red-700"
            : warnings === maxWarnings - 1
            ? "bg-orange-500/90 text-white border-orange-600"
            : "bg-yellow-500/90 text-black border-yellow-600"
        )}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 animate-pulse shrink-0" />
            <span>
              Warning {warnings}/{maxWarnings}
              {warnings >= maxWarnings
                ? " — Test auto-submitted!"
                : ` — ${maxWarnings - warnings} more will auto-submit your test!`}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: maxWarnings }).map((_, i) => (
              <div key={i} className={cn(
                "w-3 h-3 rounded-full border",
                i < warnings ? "bg-current" : "bg-current/20"
              )} />
            ))}
          </div>
        </div>
      )}

      {/* Bypass detected banner */}
      {bypassDetected && (
        <div className="bg-red-700 text-white px-4 py-2 text-sm font-bold flex items-center gap-2 border-b border-red-800">
          <Ban className="h-4 w-4" />
          🚨 Security bypass extension detected! Your activity is being flagged.
        </div>
      )}

      {/* Face status indicators */}
      {faceStatus === 'missing' && warnings < maxWarnings && (
        <div className="bg-orange-500/95 text-white px-4 py-1.5 text-xs font-medium flex items-center gap-2">
          <EyeOff className="h-3.5 w-3.5 animate-pulse" />
          Face not detected — please look at the camera
        </div>
      )}
      {faceStatus === 'turned' && warnings < maxWarnings && (
        <div className="bg-yellow-500/95 text-black px-4 py-1.5 text-xs font-medium flex items-center gap-2">
          <Eye className="h-3.5 w-3.5" />
          Head turned — please face the camera directly
        </div>
      )}
      {faceStatus === 'multiple' && (
        <div className="bg-red-500/95 text-white px-4 py-1.5 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
          Multiple faces detected!
        </div>
      )}
    </div>
  );
}

// ─── Webcam Preview ───────────────────────────────────────────────────────────
export function WebcamPreview({ stream, faceStatus }: { stream: MediaStream | null; faceStatus: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const borderColor = {
    ok: "border-green-500/50",
    missing: "border-red-500/50",
    turned: "border-yellow-500/50",
    multiple: "border-red-600/80",
    loading: "border-muted/50",
    unavailable: "border-muted/30",
  }[faceStatus] || "border-muted/50";

  const dotColor = {
    ok: "bg-green-400",
    missing: "bg-red-400 animate-pulse",
    turned: "bg-yellow-400 animate-pulse",
    multiple: "bg-red-600 animate-pulse",
    loading: "bg-blue-400 animate-pulse",
    unavailable: "bg-muted-foreground",
  }[faceStatus] || "bg-muted-foreground";

  return (
    <div className={cn("relative w-24 h-18 rounded-lg overflow-hidden border-2 bg-black shrink-0", borderColor)}>
      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center">
          <CameraOff className="h-6 w-6 text-muted-foreground/50" />
        </div>
      )}
      <div className="absolute bottom-1 right-1 flex items-center gap-1">
        <span className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
      </div>
    </div>
  );
}

// ─── Violations Log Panel ─────────────────────────────────────────────────────
export function ViolationsPanel({ violations }: { violations: ProctoringViolation[] }) {
  if (!violations.length) return (
    <div className="text-center py-4 text-muted-foreground text-sm">
      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500/50" />
      No violations recorded
    </div>
  );

  return (
    <div className="space-y-2 max-h-48 overflow-auto">
      {[...violations].reverse().map((v, i) => (
        <div key={i} className={cn(
          "flex items-start gap-2 p-2 rounded-lg text-xs border",
          v.severity === 'critical'
            ? "bg-red-500/10 border-red-500/30 text-red-300"
            : "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
        )}>
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p>{v.message}</p>
            <p className="text-muted-foreground mt-0.5">{v.timestamp.toLocaleTimeString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Proctoring Setup Screen ──────────────────────────────────────────────────
interface ProctoringSetupProps {
  contestTitle: string;
  requireWebcam: boolean;
  requireScreen: boolean;
  requireMic: boolean;
  onReady: (streams: { webcam?: MediaStream; screen?: MediaStream }) => void;
  onBack: () => void;
}

type SetupStep = 'intro' | 'bypass-check' | 'webcam' | 'screen' | 'ready';

export function ProctoringSetup({ contestTitle, requireWebcam, requireScreen, requireMic, onReady, onBack }: ProctoringSetupProps) {
  const [step, setStep] = useState<SetupStep>('intro');
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bypassDetails, setBypassDetails] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setupScreenShare, runBypassDetection, setStreams } = useProctoring({
    requireWebcam, requireScreen, requireMic,
    onAutoSubmit: () => {},
  });

  // ── Step: Bypass Check ───────────────────────────────────────────────────────
  const runBypassCheck = useCallback(async () => {
    setStep('bypass-check');
    setLoading(true);
    setError(null);
    await new Promise(r => setTimeout(r, 800)); // Small delay for UX
    
    const result = runBypassDetection();
    setLoading(false);

    if (result.detected) {
      setBypassDetails(result.details);
      setError(`Security bypass extension detected! Disable it before proceeding.`);
      return;
    }

    // Proceed to next required step
    if (requireWebcam) {
      setStep('webcam');
    } else if (requireScreen) {
      setStep('screen');
    } else {
      setStep('ready');
    }
  }, [requireWebcam, requireScreen, runBypassDetection]);

  // ── Step: Webcam ─────────────────────────────────────────────────────────────
  const setupWebcamStep = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: requireMic,
      });
      setWebcamStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      setError(`Webcam error: ${e.message}. Please allow camera access.`);
    }
  }, [requireMic]);

  // ── Step: Screen Share ────────────────────────────────────────────────────────
  const setupScreenStep = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Single call - setupScreenShare handles bypass detection + full-screen verification
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor', frameRate: { ideal: 5, max: 15 } } as any,
        audio: false,
      });

      // Verify it's actually the full screen
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack?.getSettings() as any;
      const surface = settings?.displaySurface || 'unknown';
      const sw = window.screen.width;
      const sh = window.screen.height;
      const vw = settings?.width || 0;
      const vh = settings?.height || 0;

      // Strictly require monitor (entire screen)
      let isFullScreen = false;
      if (surface !== 'unknown') {
        isFullScreen = surface === 'monitor';
      } else {
        isFullScreen = vw > sw * 0.9 && vh > sh * 0.9;
      }

      if (!isFullScreen) {
        stream.getTracks().forEach(t => t.stop());
        setLoading(false);
        setError(`Please share your ENTIRE SCREEN (not a window or tab). Select "Entire Screen" in the sharing dialog.`);
        return;
      }

      setScreenStream(stream);
      setStreams(undefined, stream);
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      if (e.name === 'NotAllowedError') {
        setError('Screen share permission denied. This is required for the proctored contest.');
      } else {
        setError(`Screen share failed: ${e.message}. Please share your ENTIRE SCREEN.`);
      }
    }
  }, [setStreams]);

  const proceedFromWebcam = () => {
    if (!webcamStream && requireWebcam) { setError('Please enable webcam to continue'); return; }
    if (requireScreen) setStep('screen');
    else setStep('ready');
  };

  const proceedFromScreen = () => {
    if (!screenStream && requireScreen) { setError('Please enable screen sharing to continue'); return; }
    setStep('ready');
  };

  const handleReady = () => {
    // Pass streams to parent for injection into main proctoring hook
    onReady({ webcam: webcamStream || undefined, screen: screenStream || undefined });
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-background/98 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-3">
            <Shield className="h-7 w-7 text-purple-400" />
          </div>
          <h1 className="text-xl font-bold mb-1">Proctored Contest Setup</h1>
          <p className="text-sm text-muted-foreground">{contestTitle}</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[
            { id: 'intro', label: 'Rules' },
            { id: 'bypass-check', label: 'Security' },
            ...(requireWebcam ? [{ id: 'webcam', label: 'Camera' }] : []),
            ...(requireScreen ? [{ id: 'screen', label: 'Screen' }] : []),
            { id: 'ready', label: 'Enter' },
          ].map((s, i, arr) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                "flex flex-col items-center gap-1",
              )}>
                <div className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all",
                  s.id === step
                    ? "border-primary bg-primary/20 text-primary"
                    : ['intro', 'bypass-check', 'webcam', 'screen', 'ready'].indexOf(step) > ['intro', 'bypass-check', 'webcam', 'screen', 'ready'].indexOf(s.id)
                    ? "border-green-500 bg-green-500/20 text-green-400"
                    : "border-border/50 text-muted-foreground"
                )}>
                  {i + 1}
                </div>
                <span className="text-[10px] text-muted-foreground">{s.label}</span>
              </div>
              {i < arr.length - 1 && <div className="w-8 h-px bg-border/50 mb-4" />}
            </div>
          ))}
        </div>

        {/* Content Card */}
        <div className="glass-card p-6 mb-4">
          {/* ── INTRO ── */}
          {step === 'intro' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Contest Rules</h2>
              <div className="space-y-2.5">
                {[
                  { icon: "🚫", text: "No copy-paste allowed (keyboard and right-click blocked)" },
                  { icon: "🔒", text: "Stay on this tab — tab switching will trigger warnings" },
                  ...(requireWebcam ? [
                    { icon: "📷", text: "Camera must remain on. Keep your face visible and centered" },
                    { icon: "👤", text: "Looking away from screen triggers a warning" },
                    { icon: "⚠️", text: "3 warnings = automatic test submission" },
                  ] : []),
                  ...(requireScreen ? [
                    { icon: "🖥️", text: "Full screen sharing required (no window/tab share)" },
                    { icon: "🔍", text: "Your entire screen will be monitored" },
                  ] : []),
                ].map((rule, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    <span className="text-base shrink-0 mt-0.5">{rule.icon}</span>
                    <span className="text-muted-foreground">{rule.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── BYPASS CHECK ── */}
          {step === 'bypass-check' && (
            <div className="text-center space-y-4">
              {loading ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">Scanning for security bypass extensions...</p>
                </>
              ) : error ? (
                <>
                  <Ban className="h-10 w-10 text-red-400 mx-auto" />
                  <div>
                    <p className="font-semibold text-red-400 mb-2">Security Extension Detected!</p>
                    <p className="text-sm text-muted-foreground mb-3">{error}</p>
                    <div className="space-y-1 text-left">
                      {bypassDetails.map((d, i) => (
                        <div key={i} className="text-xs bg-red-500/10 border border-red-500/30 rounded p-2 text-red-400">
                          • {d}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Disable the extension in <code>chrome://extensions</code> and refresh.</p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="h-10 w-10 text-green-400 mx-auto" />
                  <p className="text-green-400 font-semibold">No bypass extensions detected</p>
                </>
              )}
            </div>
          )}

          {/* ── WEBCAM ── */}
          {step === 'webcam' && (
            <div className="space-y-4">
              <h2 className="font-semibold">Camera Setup</h2>
              <div className="bg-black rounded-xl overflow-hidden aspect-video relative">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                {!webcamStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <CameraOff className="h-12 w-12 mb-2 opacity-40" />
                    <p className="text-sm">Camera not started</p>
                  </div>
                )}
                {webcamStream && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500/90 text-white text-xs px-2 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </div>
                )}
              </div>
              {!webcamStream && (
                <Button onClick={setupWebcamStep} disabled={loading} className="w-full gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  {loading ? 'Accessing camera...' : 'Enable Camera'}
                </Button>
              )}
              {webcamStream && <p className="text-sm text-green-400 text-center flex items-center justify-center gap-1"><CheckCircle className="h-4 w-4" /> Camera ready!</p>}
            </div>
          )}

          {/* ── SCREEN ── */}
          {step === 'screen' && (
            <div className="space-y-4">
              <h2 className="font-semibold">Screen Share Setup</h2>
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl text-sm space-y-2">
                <p className="font-medium text-blue-400 flex items-center gap-1.5"><Monitor className="h-4 w-4" /> Important</p>
                <ul className="text-muted-foreground space-y-1.5 list-disc pl-4">
                  <li>Select <strong>"Entire Screen"</strong> (not a window or tab)</li>
                  <li>Tab sharing and window sharing will be rejected</li>
                  <li>All screens must be visible (no virtual displays)</li>
                  <li>Bypass extensions that fake screen share are detected automatically</li>
                </ul>
              </div>
              {!screenStream ? (
                <Button onClick={setupScreenStep} disabled={loading} className="w-full gap-2 btn-neon">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Monitor className="h-4 w-4" />}
                  {loading ? 'Waiting for screen share...' : 'Share Entire Screen'}
                </Button>
              ) : (
                <p className="text-sm text-green-400 text-center flex items-center justify-center gap-1"><CheckCircle className="h-4 w-4" /> Screen share active (Full screen verified)</p>
              )}
            </div>
          )}

          {/* ── READY ── */}
          {step === 'ready' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
              <div>
                <p className="font-bold text-lg text-green-400">All checks passed!</p>
                <p className="text-sm text-muted-foreground mt-1">You're ready to enter the proctored contest. Good luck!</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {requireWebcam && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-green-400">
                    <CheckCircle className="h-3.5 w-3.5 mb-1" /> Camera active
                  </div>
                )}
                {requireScreen && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-green-400">
                    <CheckCircle className="h-3.5 w-3.5 mb-1" /> Screen sharing
                  </div>
                )}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-green-400">
                  <CheckCircle className="h-3.5 w-3.5 mb-1" /> No bypass detected
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 text-yellow-400">
                  <AlertTriangle className="h-3.5 w-3.5 mb-1" /> 3 warnings = submit
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && step !== 'bypass-check' && (
            <div className="mt-3 flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-none">← Back</Button>
          <div className="flex-1" />
          {step === 'intro' && (
            <Button onClick={runBypassCheck} className="btn-neon gap-2">
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {step === 'bypass-check' && !error && !loading && (
            <Button onClick={() => requireWebcam ? setStep('webcam') : requireScreen ? setStep('screen') : setStep('ready')} className="btn-neon gap-2">
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {step === 'bypass-check' && error && (
            <Button onClick={runBypassCheck} variant="outline" className="gap-2">
              <Loader2 className="h-4 w-4" /> Retry Check
            </Button>
          )}
          {step === 'webcam' && (
            <Button onClick={proceedFromWebcam} disabled={!webcamStream} className="btn-neon gap-2">
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {step === 'screen' && (
            <Button onClick={proceedFromScreen} disabled={!screenStream} className="btn-neon gap-2">
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {step === 'ready' && (
            <Button onClick={handleReady} className="btn-neon gap-2 px-6">
              <Shield className="h-4 w-4" /> Enter Contest
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
