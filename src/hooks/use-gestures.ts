import { useEffect, useRef, useState, useCallback } from "react";

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureResult {
  name: string;
  confidence: number;
  landmarks: HandLandmark[];
}

export interface SavedGesture {
  id: string;
  name: string;
  command: string;
  landmarks: number[]; // flattened [x,y,z,x,y,z,...] of key points
  createdAt: string;
}

const GESTURE_STORAGE_KEY = "jarvis-gestures";

// ── Built-in gesture classifiers ────────────────────────────

function isThumbsUp(landmarks: any[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const thumb = landmarks[4];
  const index = landmarks[8];
  const middle = landmarks[12];
  const ring = landmarks[16];
  const pinky = landmarks[20];
  const wrist = landmarks[0];
  return (
    thumb.y < wrist.y - 0.15 &&
    index.y > wrist.y - 0.05 &&
    middle.y > wrist.y - 0.05 &&
    ring.y > wrist.y - 0.05 &&
    pinky.y > wrist.y - 0.05
  );
}

function isOpenPalm(landmarks: any[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const wrist = landmarks[0];
  const tips = [landmarks[4], landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
  return tips.every((t) => t.y < wrist.y - 0.08);
}

function isFist(landmarks: any[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const wrist = landmarks[0];
  const tips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
  return tips.every((t) => Math.abs(t.y - wrist.y) < 0.08);
}

function isPeace(landmarks: any[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const wrist = landmarks[0];
  const index = landmarks[8];
  const middle = landmarks[12];
  const ring = landmarks[16];
  const pinky = landmarks[20];
  return (
    index.y < wrist.y - 0.12 &&
    middle.y < wrist.y - 0.12 &&
    ring.y > wrist.y - 0.05 &&
    pinky.y > wrist.y - 0.05
  );
}

function classifyBuiltIn(landmarks: any[]): GestureResult | null {
  if (isThumbsUp(landmarks)) return { name: "thumbs_up", confidence: 0.85, landmarks };
  if (isPeace(landmarks)) return { name: "peace", confidence: 0.85, landmarks };
  if (isOpenPalm(landmarks)) return { name: "open_palm", confidence: 0.8, landmarks };
  if (isFist(landmarks)) return { name: "fist", confidence: 0.8, landmarks };
  return null;
}

// ── Custom gesture matching ─────────────────────────────────

function flattenLandmarks(landmarks: any[]): number[] {
  const keyPoints = [0, 4, 8, 12, 16, 20]; // wrist + fingertips
  return keyPoints.flatMap((i) => [landmarks[i].x, landmarks[i].y, landmarks[i].z]);
}

function gestureSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  const dist = Math.sqrt(sum / a.length);
  return Math.max(0, 1 - dist * 5);
}

// ── Saved gestures CRUD ─────────────────────────────────────

export function getSavedGestures(): SavedGesture[] {
  try {
    return JSON.parse(localStorage.getItem(GESTURE_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveGesture(gesture: SavedGesture): void {
  const gestures = getSavedGestures();
  const idx = gestures.findIndex((g) => g.id === gesture.id);
  if (idx >= 0) gestures[idx] = gesture;
  else gestures.push(gesture);
  localStorage.setItem(GESTURE_STORAGE_KEY, JSON.stringify(gestures));
}

export function deleteGesture(id: string): void {
  const gestures = getSavedGestures().filter((g) => g.id !== id);
  localStorage.setItem(GESTURE_STORAGE_KEY, JSON.stringify(gestures));
}

// ── Hook ────────────────────────────────────────────────────

export function useGestureDetection(options: {
  enabled: boolean;
  onGesture?: (gesture: GestureResult, command?: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const detectorRef = useRef<any>(null);
  const frameRef = useRef<number>(0);
  const lastGestureRef = useRef<string | null>(null);
  const gestureHoldRef = useRef(0);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    setDetecting(false);
    setCurrentGesture(null);
  }, []);

  const initDetector = useCallback(async () => {
    try {
      const handPoseDetection = await import("@tensorflow-models/hand-pose-detection");
      await import("@tensorflow/tfjs");
      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      detectorRef.current = await handPoseDetection.createDetector(model, {
        runtime: "tfjs",
        maxHands: 1,
      });
      setDetecting(true);
    } catch (err) {
      console.error("Failed to init hand detector:", err);
    }
  }, []);

  useEffect(() => {
    if (!options.enabled) {
      stopCamera();
      return;
    }

    startCamera().then(initDetector);

    return () => {
      stopCamera();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [options.enabled]);

  useEffect(() => {
    if (!detecting || !cameraReady || !detectorRef.current || !videoRef.current) return;

    const HOLD_FRAMES = 8; // Must hold gesture for ~8 frames (~0.5s at 15fps)
    let active = true;

    const detect = async () => {
      if (!active || !detectorRef.current || !videoRef.current) return;

      try {
        const hands = await detectorRef.current.estimateHands(videoRef.current);
        if (hands.length > 0) {
          const landmarks = hands[0].keypoints;
          const normalized = landmarks.map((kp: any) => ({
            x: kp.x / 320,
            y: kp.y / 240,
            z: kp.z || 0,
          }));

          // Check built-in gestures
          let result = classifyBuiltIn(normalized);

          // Check custom gestures if no built-in match
          if (!result) {
            const flat = flattenLandmarks(normalized);
            const saved = getSavedGestures();
            let best: SavedGesture | null = null;
            let bestSim = 0;
            for (const g of saved) {
              const sim = gestureSimilarity(flat, g.landmarks);
              if (sim > bestSim && sim > 0.7) {
                bestSim = sim;
                best = g;
              }
            }
            if (best) {
              result = { name: best.name, confidence: bestSim, landmarks: normalized };
            }
          }

          if (result) {
            if (lastGestureRef.current === result.name) {
              gestureHoldRef.current++;
            } else {
              lastGestureRef.current = result.name;
              gestureHoldRef.current = 1;
            }

            if (gestureHoldRef.current === HOLD_FRAMES) {
              setCurrentGesture(result.name);
              // Find command for this gesture
              const saved = getSavedGestures();
              const match = saved.find((g) => g.name === result!.name);
              options.onGesture?.(result, match?.command);
            }
          } else {
            lastGestureRef.current = null;
            gestureHoldRef.current = 0;
            setCurrentGesture(null);
          }
        } else {
          lastGestureRef.current = null;
          gestureHoldRef.current = 0;
          setCurrentGesture(null);
        }
      } catch { /* skip frame */ }

      if (active) {
        frameRef.current = requestAnimationFrame(() => setTimeout(detect, 66)); // ~15fps
      }
    };

    detect();
    return () => { active = false; };
  }, [detecting, cameraReady, options.onGesture]);

  return {
    videoRef,
    detecting,
    currentGesture,
    cameraReady,
    startCamera,
    stopCamera,
    flattenCurrentLandmarks: async (): Promise<number[] | null> => {
      if (!detectorRef.current || !videoRef.current) return null;
      try {
        const hands = await detectorRef.current.estimateHands(videoRef.current);
        if (hands.length > 0) {
          const normalized = hands[0].keypoints.map((kp: any) => ({
            x: kp.x / 320,
            y: kp.y / 240,
            z: kp.z || 0,
          }));
          return flattenLandmarks(normalized);
        }
      } catch {}
      return null;
    },
  };
}
