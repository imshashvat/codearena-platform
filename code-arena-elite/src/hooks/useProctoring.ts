import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ViolationType = 
  | 'face_missing'
  | 'face_turned'
  | 'multiple_faces'
  | 'tab_switch'
  | 'copy_paste'
  | 'right_click'
  | 'screen_lost'
  | 'bypass_detected'
  | 'fullscreen_exit';

export interface ProctoringViolation {
  type: ViolationType;
  timestamp: Date;
  message: string;
  severity: 'warning' | 'critical';
}

export interface ProctoringOptions {
  requireWebcam: boolean;
  requireScreen: boolean;
  requireMic: boolean;
  maxWarnings?: number;
  onAutoSubmit: (violations: ProctoringViolation[], warnings: number) => void;
  onWarning?: (v: ProctoringViolation, count: number) => void;
}

export interface ProctoringState {
  warnings: number;
  violations: ProctoringViolation[];
  webcamStream: MediaStream | null;
  screenStream: MediaStream | null;
  faceStatus: 'ok' | 'missing' | 'turned' | 'multiple' | 'loading' | 'unavailable';
  bypassDetected: boolean;
  bypassDetails: string[];
  isActive: boolean;
  autoSubmitted: boolean;
}

// ─── NeoBypass Detection Engine ───────────────────────────────────────────────
function runBypassDetection(): { detected: boolean; details: string[] } {
  const details: string[] = [];

  // 1. Check if getDisplayMedia has been overridden
  try {
    const gdmSrc = Function.prototype.toString.call(navigator.mediaDevices.getDisplayMedia);
    if (!gdmSrc.includes('[native code]')) {
      details.push('getDisplayMedia() has been overridden (not native)');
    }
  } catch { /* ignore */ }

  // 2. Check for NeoBypass's specific marker
  if ('__originalGetDisplayMedia' in (navigator.mediaDevices as any)) {
    details.push('NeoBypass extension marker detected (__originalGetDisplayMedia)');
  }

  // 3. Check if document.visibilityState has been spoofed
  // NeoBypass uses Object.defineProperty(document, 'visibilityState', ...) on the instance
  // This creates an OWN property on document (not just prototype), which we can detect
  const visDesc = Object.getOwnPropertyDescriptor(document, 'visibilityState');
  if (visDesc !== undefined) {
    // document has its own visibilityState property → it was overridden
    const getterSrc = visDesc.get ? visDesc.get.toString() : '';
    if (!getterSrc.includes('[native code]')) {
      details.push('document.visibilityState has been spoofed');
    }
  }

  // 4. Check if document.hidden has been spoofed
  const hiddenDesc = Object.getOwnPropertyDescriptor(document, 'hidden');
  if (hiddenDesc !== undefined) {
    const getterSrc = hiddenDesc.get ? hiddenDesc.get.toString() : '';
    if (!getterSrc.includes('[native code]')) {
      details.push('document.hidden has been spoofed');
    }
  }

  // 5. Check if EventTarget.prototype.addEventListener has been overridden
  try {
    const aelSrc = Function.prototype.toString.call(EventTarget.prototype.addEventListener);
    if (!aelSrc.includes('[native code]')) {
      details.push('EventTarget.prototype.addEventListener has been overridden');
    }
  } catch { /* ignore */ }

  // 6. Check if fetch has been overridden (mock_code.js does this)
  try {
    const fetchSrc = Function.prototype.toString.call(window.fetch);
    if (!fetchSrc.includes('[native code]')) {
      details.push('window.fetch has been overridden (extension interceptor detected)');
    }
  } catch { /* ignore */ }

  return { detected: details.length > 0, details };
}

// ─── Screen Share Integrity Check ─────────────────────────────────────────────
async function verifyScreenShareIsFullScreen(stream: MediaStream): Promise<{
  isFullScreen: boolean;
  actualWidth: number;
  actualHeight: number;
  screenWidth: number;
  screenHeight: number;
  reportedSurface: string;
}> {
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) return { isFullScreen: false, actualWidth: 0, actualHeight: 0, screenWidth: window.screen.width, screenHeight: window.screen.height, reportedSurface: 'unknown' };

  const settings = videoTrack.getSettings();
  const reportedSurface = (settings as any).displaySurface || 'unknown';
  const screenWidth = window.screen.width * window.devicePixelRatio;
  const screenHeight = window.screen.height * window.devicePixelRatio;

  // Try to grab actual frame dimensions using ImageCapture
  try {
    const imageCapture = new (window as any).ImageCapture(videoTrack);
    const bitmap: ImageBitmap = await imageCapture.grabFrame();
    const actualWidth = bitmap.width;
    const actualHeight = bitmap.height;
    bitmap.close();

    // Allow 20% tolerance (different DPI/scaling)
    const widthRatio = actualWidth / screenWidth;
    const heightRatio = actualHeight / screenHeight;
    const isFullScreen = widthRatio > 0.7 && heightRatio > 0.7;

    return { isFullScreen, actualWidth, actualHeight, screenWidth, screenHeight, reportedSurface };
  } catch {
    // ImageCapture not supported, fall back to settings check
    const w = settings.width || 0;
    const h = settings.height || 0;
    return {
      isFullScreen: w > 0.6 * window.screen.width && h > 0.6 * window.screen.height,
      actualWidth: w, actualHeight: h, screenWidth, screenHeight, reportedSurface
    };
  }
}

// ─── Face API Loader ──────────────────────────────────────────────────────────
let faceApiLoaded = false;
let faceApiLoading = false;

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model';

async function loadFaceAPI(): Promise<any> {
  if (faceApiLoaded) return (window as any).faceapi;
  if (faceApiLoading) {
    // Wait for it to load
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (faceApiLoaded) { clearInterval(check); resolve((window as any).faceapi); }
      }, 200);
    });
  }

  faceApiLoading = true;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/dist/face-api.js';
    script.onload = async () => {
      try {
        const faceapi = (window as any).faceapi;
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ]);
        faceApiLoaded = true;
        faceApiLoading = false;
        resolve(faceapi);
      } catch (e) {
        faceApiLoading = false;
        reject(e);
      }
    };
    script.onerror = (e) => { faceApiLoading = false; reject(e); };
    document.head.appendChild(script);
  });
}

// ─── Head Pose Analysis (using 68 landmarks) ─────────────────────────────────
function analyzeHeadPose(landmarks: any): { isLookingAtScreen: boolean; yawRatio: number; confidence: string } {
  try {
    const positions = landmarks.positions;
    if (!positions || positions.length < 68) return { isLookingAtScreen: true, yawRatio: 0, confidence: 'unknown' };

    // Key landmark indices (face-api.js 68-point model)
    const leftEyeOuter = positions[36];   // Left eye outer corner
    const rightEyeOuter = positions[45];  // Right eye outer corner
    const noseTip = positions[30];        // Nose tip
    const leftMouth = positions[48];      // Left mouth corner
    const rightMouth = positions[54];     // Right mouth corner

    // Face width based on eye-to-eye distance
    const eyeWidth = Math.abs(rightEyeOuter.x - leftEyeOuter.x);
    
    // Face center X (midpoint between eyes)
    const faceCenterX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
    
    // Nose deviation from face center (normalized by eye width)
    // When face is turned, nose tip moves significantly off-center
    const noseDev = (noseTip.x - faceCenterX) / eyeWidth;
    
    // Check mouth symmetry (helps detect pitch/yaw)
    const mouthCenter = (leftMouth.x + rightMouth.x) / 2;
    const mouthDev = Math.abs(mouthCenter - faceCenterX) / eyeWidth;

    // If nose tip deviates more than 30% of eye width → head significantly turned
    const yawThreshold = 0.35;
    const isLookingAtScreen = Math.abs(noseDev) < yawThreshold;
    
    return { isLookingAtScreen, yawRatio: Math.abs(noseDev), confidence: `yaw:${noseDev.toFixed(2)}` };
  } catch {
    return { isLookingAtScreen: true, yawRatio: 0, confidence: 'error' };
  }
}

// ─── Main Proctoring Hook ─────────────────────────────────────────────────────
export function useProctoring(options: ProctoringOptions) {
  const {
    requireWebcam,
    requireScreen,
    requireMic,
    maxWarnings = 3,
    onAutoSubmit,
    onWarning,
  } = options;

  const [state, setState] = useState<ProctoringState>({
    warnings: 0,
    violations: [],
    webcamStream: null,
    screenStream: null,
    faceStatus: 'loading',
    bypassDetected: false,
    bypassDetails: [],
    isActive: false,
    autoSubmitted: false,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const faceDetectionIntervalRef = useRef<number | null>(null);
  const focusPollIntervalRef = useRef<number | null>(null);
  const screenCheckIntervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastFaceMissingRef = useRef<number>(0);
  const consecutiveFaceMissingRef = useRef<number>(0);

  // ── Issue Warning ────────────────────────────────────────────────────────────
  const issueWarning = useCallback((type: ViolationType, message: string, severity: 'warning' | 'critical' = 'warning') => {
    if (stateRef.current.autoSubmitted) return;

    const violation: ProctoringViolation = { type, message, severity, timestamp: new Date() };
    
    const newWarnings = stateRef.current.warnings + 1;
    const newViolations = [...stateRef.current.violations, violation];

    setState(prev => ({
      ...prev,
      warnings: newWarnings,
      violations: newViolations,
    }));

    onWarning?.(violation, newWarnings);

    const remaining = maxWarnings - newWarnings;
    if (remaining > 0) {
      toast.warning(`⚠️ Warning ${newWarnings}/${maxWarnings}: ${message}. ${remaining} warning${remaining === 1 ? '' : 's'} remaining!`, {
        duration: 5000,
        id: `proctor-warning-${newWarnings}`,
      });
    }

    // Auto-submit at max warnings
    if (newWarnings >= maxWarnings) {
      setState(prev => ({ ...prev, autoSubmitted: true }));
      toast.error('🚫 Maximum warnings reached. Your test has been auto-submitted!', { duration: 10000 });
      setTimeout(() => {
        onAutoSubmit(newViolations, newWarnings);
      }, 1000);
    }
  }, [maxWarnings, onAutoSubmit, onWarning]);

  // ── Setup Screen Share ───────────────────────────────────────────────────────
  const setupScreenShare = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    // STEP 1: Run bypass detection BEFORE requesting screen share
    const bypassCheck = runBypassDetection();
    if (bypassCheck.detected) {
      setState(prev => ({
        ...prev,
        bypassDetected: true,
        bypassDetails: bypassCheck.details,
      }));
      return { 
        success: false, 
        error: `Security bypass extension detected! Please disable it: ${bypassCheck.details.join('; ')}` 
      };
    }

    // STEP 2: Request FULL SCREEN share (monitor only)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',  // Require full screen
          frameRate: { ideal: 5, max: 15 },
          width: { ideal: window.screen.width },
          height: { ideal: window.screen.height },
        } as any,
        audio: false,
      });

      // STEP 3: Verify it's actually the full screen (catches NeoBypass that spoofs getSettings)
      const verification = await verifyScreenShareIsFullScreen(stream);
      
      if (!verification.isFullScreen) {
        stream.getTracks().forEach(t => t.stop());
        return {
          success: false,
          error: `Full screen share required! You shared a window/tab (${verification.actualWidth}×${verification.actualHeight}) instead of your full screen (${verification.screenWidth}×${verification.screenHeight}). Please share your ENTIRE SCREEN.`
        };
      }

      // STEP 4: Also verify reported surface isn't spoofed
      if (verification.reportedSurface !== 'monitor') {
        // Check if it could be bypass spoofing
        const postBypassCheck = runBypassDetection();
        if (postBypassCheck.detected) {
          stream.getTracks().forEach(t => t.stop());
          setState(prev => ({ ...prev, bypassDetected: true, bypassDetails: postBypassCheck.details }));
          return { success: false, error: 'Security bypass detected after screen share. Extension is modifying browser APIs.' };
        }
      }

      // STEP 5: Monitor if screen share gets stopped
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        setState(prev => ({ ...prev, screenStream: null }));
        if (!stateRef.current.autoSubmitted) {
          issueWarning('screen_lost', 'Screen sharing was stopped! Please re-enable screen share.', 'critical');
        }
      });

      setState(prev => ({ ...prev, screenStream: stream }));

      // STEP 6: Periodically verify screen share integrity (anti-bypass monitoring)
      screenCheckIntervalRef.current = window.setInterval(async () => {
        if (stateRef.current.autoSubmitted) return;
        if (!stream.active) {
          issueWarning('screen_lost', 'Screen share connection lost');
          return;
        }
        
        // Re-run bypass detection periodically
        const periodicBypassCheck = runBypassDetection();
        if (periodicBypassCheck.detected && !stateRef.current.bypassDetected) {
          setState(prev => ({ ...prev, bypassDetected: true, bypassDetails: periodicBypassCheck.details }));
          issueWarning('bypass_detected', 'Security bypass extension detected during exam!', 'critical');
        }
      }, 15000); // Every 15 seconds

      return { success: true };
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        return { success: false, error: 'Screen share permission denied. This is required for the proctored exam.' };
      }
      return { success: false, error: `Screen share failed: ${err.message}` };
    }
  }, [issueWarning]);

  // ── Setup Webcam ─────────────────────────────────────────────────────────────
  const setupWebcam = useCallback(async (videoEl: HTMLVideoElement): Promise<{ success: boolean; error?: string }> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } },
        audio: requireMic,
      });
      videoEl.srcObject = stream;
      webcamRef.current = videoEl;
      setState(prev => ({ ...prev, webcamStream: stream }));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: `Webcam access failed: ${err.message}` };
    }
  }, [requireMic]);

  // ── Face Detection Loop ──────────────────────────────────────────────────────
  const startFaceDetection = useCallback(async () => {
    if (!webcamRef.current || !requireWebcam) {
      setState(prev => ({ ...prev, faceStatus: 'unavailable' }));
      return;
    }

    setState(prev => ({ ...prev, faceStatus: 'loading' }));

    try {
      const faceapi = await loadFaceAPI();
      setState(prev => ({ ...prev, faceStatus: 'ok' }));

      // Create detection canvas
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      canvasRef.current = canvas;

      const detectOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });

      let consecutiveMissing = 0;
      let consecutiveTurned = 0;
      let lastWarningTime = 0;

      faceDetectionIntervalRef.current = window.setInterval(async () => {
        if (stateRef.current.autoSubmitted) return;
        const videoEl = webcamRef.current;
        if (!videoEl || videoEl.readyState < 2) return;

        try {
          const detections = await faceapi
            .detectAllFaces(videoEl, detectOptions)
            .withFaceLandmarks(true);

          const now = Date.now();
          const minGapBetweenWarnings = 8000; // 8 seconds between face warnings

          if (detections.length === 0) {
            consecutiveMissing++;
            consecutiveTurned = 0;
            setState(prev => ({ ...prev, faceStatus: 'missing' }));

            // Require 3 consecutive missing frames (6 seconds) before warning
            if (consecutiveMissing >= 3 && now - lastWarningTime > minGapBetweenWarnings) {
              lastWarningTime = now;
              consecutiveMissing = 0;
              issueWarning('face_missing', 'Your face is not visible! Please look at the camera.');
            }
          } else if (detections.length > 1) {
            consecutiveMissing = 0;
            setState(prev => ({ ...prev, faceStatus: 'multiple' }));
            if (now - lastWarningTime > minGapBetweenWarnings) {
              lastWarningTime = now;
              issueWarning('multiple_faces', 'Multiple faces detected in camera view!', 'critical');
            }
          } else {
            consecutiveMissing = 0;
            const { isLookingAtScreen } = analyzeHeadPose(detections[0].landmarks);

            if (!isLookingAtScreen) {
              consecutiveTurned++;
              setState(prev => ({ ...prev, faceStatus: 'turned' }));

              // Require 2 consecutive turned frames before warning  
              if (consecutiveTurned >= 2 && now - lastWarningTime > minGapBetweenWarnings) {
                lastWarningTime = now;
                consecutiveTurned = 0;
                issueWarning('face_turned', 'Please look at the screen! Head turned away detected.');
              }
            } else {
              consecutiveTurned = 0;
              setState(prev => ({ ...prev, faceStatus: 'ok' }));
            }
          }
        } catch { /* detection frame error, skip */ }
      }, 2000); // Every 2 seconds

    } catch (err) {
      console.warn('Face API failed to load, using basic monitoring:', err);
      setState(prev => ({ ...prev, faceStatus: 'unavailable' }));
      
      // Fallback: basic webcam presence check (is video track active?)
      faceDetectionIntervalRef.current = window.setInterval(() => {
        const videoEl = webcamRef.current;
        if (!videoEl) return;
        const track = (videoEl.srcObject as MediaStream)?.getVideoTracks()[0];
        if (!track || track.readyState === 'ended') {
          issueWarning('face_missing', 'Webcam disconnected or stopped!', 'critical');
        }
      }, 5000);
    }
  }, [requireWebcam, issueWarning]);

  // ── Tab Switch Detection (NeoBypass-resistant) ────────────────────────────────
  const startTabMonitoring = useCallback(() => {
    let tabSwitchCount = 0;
    let lastTabWarning = 0;

    // PRIMARY: Poll document.hasFocus() — NeoBypass does NOT spoof this!
    focusPollIntervalRef.current = window.setInterval(() => {
      if (stateRef.current.autoSubmitted) return;
      
      if (!document.hasFocus()) {
        tabSwitchCount++;
        const now = Date.now();
        if (now - lastTabWarning > 5000) { // Max 1 warning per 5 seconds
          lastTabWarning = now;
          issueWarning('tab_switch', 'Focus lost! Do not switch tabs or windows during the exam.');
        }
      }
    }, 500);

    // SECONDARY: visibilitychange event (works if NeoBypass is NOT installed)
    const handleVisibility = () => {
      if (document.hidden) {
        issueWarning('tab_switch', 'Tab switch detected! Stay on the exam tab.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // TERTIARY: window blur
    const handleBlur = () => {
      issueWarning('tab_switch', 'Window focus lost! Do not leave the exam window.');
    };
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [issueWarning]);

  // ── Copy-Paste Blocking ───────────────────────────────────────────────────────
  const setupCopyPasteBlock = useCallback(() => {
    const blockAndWarn = (e: ClipboardEvent | KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      issueWarning('copy_paste', 'Copy/paste is not allowed during the exam!');
    };

    // Block clipboard events
    document.addEventListener('copy', blockAndWarn as EventListener, true);
    document.addEventListener('paste', blockAndWarn as EventListener, true);
    document.addEventListener('cut', blockAndWarn as EventListener, true);

    // Block keyboard shortcuts
    const blockKeys = (e: KeyboardEvent) => {
      const isCopyPaste = (e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase());
      if (isCopyPaste && e.key.toLowerCase() !== 'a') {
        e.preventDefault();
        issueWarning('copy_paste', `Keyboard shortcut Ctrl+${e.key.toUpperCase()} is not allowed!`);
      }
    };
    document.addEventListener('keydown', blockKeys, true);

    // Block right-click context menu
    const blockRightClick = (e: MouseEvent) => {
      e.preventDefault();
      toast.warning('Right-click is disabled during the exam', { duration: 2000, id: 'right-click-block' });
    };
    document.addEventListener('contextmenu', blockRightClick, true);

    return () => {
      document.removeEventListener('copy', blockAndWarn as EventListener, true);
      document.removeEventListener('paste', blockAndWarn as EventListener, true);
      document.removeEventListener('cut', blockAndWarn as EventListener, true);
      document.removeEventListener('keydown', blockKeys, true);
      document.removeEventListener('contextmenu', blockRightClick, true);
    };
  }, [issueWarning]);

  // ── Activate Proctoring ───────────────────────────────────────────────────────
  const activateProctoring = useCallback(() => {
    setState(prev => ({ ...prev, isActive: true }));

    // Start tab monitoring
    const cleanupTab = startTabMonitoring();
    
    // Start copy-paste blocking
    const cleanupCopyPaste = setupCopyPasteBlock();

    // Start face detection if webcam is active
    startFaceDetection();

    return () => {
      cleanupTab();
      cleanupCopyPaste();
    };
  }, [startTabMonitoring, setupCopyPasteBlock, startFaceDetection]);

  // ── Cleanup ───────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (faceDetectionIntervalRef.current) clearInterval(faceDetectionIntervalRef.current);
    if (focusPollIntervalRef.current) clearInterval(focusPollIntervalRef.current);
    if (screenCheckIntervalRef.current) clearInterval(screenCheckIntervalRef.current);
    
    stateRef.current.webcamStream?.getTracks().forEach(t => t.stop());
    stateRef.current.screenStream?.getTracks().forEach(t => t.stop());
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // ── Set Streams (from external setup) ────────────────────────────────────────
  const setStreams = useCallback((webcam?: MediaStream, screen?: MediaStream) => {
    if (webcam) {
      // Create a video element to attach the webcam stream for face detection
      const videoEl = document.createElement('video');
      videoEl.srcObject = webcam;
      videoEl.autoplay = true;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.play().catch(() => {});
      webcamRef.current = videoEl;
    }
    setState(prev => ({
      ...prev,
      webcamStream: webcam ?? prev.webcamStream,
      screenStream: screen ?? prev.screenStream,
    }));
  }, []);

  return {
    state,
    setupWebcam,
    setupScreenShare,
    activateProctoring,
    cleanup,
    issueWarning,
    setStreams,
    runBypassDetection: () => runBypassDetection(),
  };
}
