import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGestureDetection,
  getSavedGestures,
  saveGesture,
  deleteGesture,
  type SavedGesture,
} from "@/hooks/use-gestures";
import { Camera, Plus, Trash2, Save, ArrowLeft, Hand, Loader2 } from "lucide-react";

const SYSTEM_COMMANDS = [
  { value: "toggle_voice", label: "Toggle voice input" },
  { value: "clear_chat", label: "Clear chat" },
  { value: "save_memory", label: "Save conversation to Obsidian" },
  { value: "toggle_camera", label: "Toggle camera" },
  { value: "media_play_pause", label: "Play/Pause media" },
  { value: "volume_up", label: "Volume up" },
  { value: "volume_down", label: "Volume down" },
  { value: "screenshot", label: "Take screenshot" },
];

export default function GestureConfig() {
  const navigate = useNavigate();
  const [gestures, setGestures] = useState<SavedGesture[]>(getSavedGestures);
  const [recording, setRecording] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCommand, setNewCommand] = useState("toggle_voice");
  const [recordedLandmarks, setRecordedLandmarks] = useState<number[] | null>(null);
  const [status, setStatus] = useState("");

  const { videoRef, detecting, currentGesture, cameraReady, flattenCurrentLandmarks } =
    useGestureDetection({
      enabled: true,
      onGesture: (g) => {
        if (!recording) {
          setStatus(`Detected: ${g.name}`);
        }
      },
    });

  const handleRecord = useCallback(async () => {
    setRecording(true);
    setStatus("Hold your gesture steady for 2 seconds...");
    setRecordedLandmarks(null);

    // Capture 5 samples over 2 seconds and average
    const samples: number[][] = [];
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 400));
      const lm = await flattenCurrentLandmarks();
      if (lm) samples.push(lm);
    }

    if (samples.length >= 3) {
      // Average the samples
      const avg = samples[0].map((_, idx) => {
        const sum = samples.reduce((s, sample) => s + sample[idx], 0);
        return sum / samples.length;
      });
      setRecordedLandmarks(avg);
      setStatus("✓ Gesture captured! Name it and assign a command.");
    } else {
      setStatus("✗ Couldn't capture enough data. Keep your hand visible and try again.");
    }
    setRecording(false);
  }, [flattenCurrentLandmarks]);

  const handleSave = useCallback(() => {
    if (!recordedLandmarks || !newName.trim()) return;
    const gesture: SavedGesture = {
      id: crypto.randomUUID(),
      name: newName.trim().toLowerCase().replace(/\s+/g, "_"),
      command: newCommand,
      landmarks: recordedLandmarks,
      createdAt: new Date().toISOString(),
    };
    saveGesture(gesture);
    setGestures(getSavedGestures());
    setNewName("");
    setRecordedLandmarks(null);
    setStatus(`Saved gesture "${gesture.name}"!`);
  }, [recordedLandmarks, newName, newCommand]);

  const handleDelete = useCallback((id: string) => {
    deleteGesture(id);
    setGestures(getSavedGestures());
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={18} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-mono tracking-wider text-foreground">Gesture Controls</h1>
            <p className="text-xs text-muted-foreground">Record hand gestures to trigger system commands</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Camera feed + recorder */}
          <div className="space-y-4">
            <div className="glass rounded-xl overflow-hidden">
              <div className="relative aspect-[4/3] bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover mirror"
                  muted
                  playsInline
                  style={{ transform: "scaleX(-1)" }}
                />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Camera size={32} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">Starting camera...</p>
                    </div>
                  </div>
                )}
                {currentGesture && (
                  <div className="absolute top-3 left-3 glass rounded-full px-3 py-1 text-xs font-mono text-primary">
                    {currentGesture}
                  </div>
                )}
                {detecting && (
                  <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
            </div>

            {/* Status */}
            {status && (
              <div className="glass rounded-lg px-4 py-2 text-xs font-mono text-muted-foreground">
                {status}
              </div>
            )}

            {/* Record new gesture */}
            <div className="glass rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-mono text-foreground flex items-center gap-2">
                <Hand size={14} className="text-primary" />
                Record New Gesture
              </h2>

              <button
                onClick={handleRecord}
                disabled={recording || !cameraReady}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-mono hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {recording ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Camera size={14} />
                    Capture Gesture
                  </>
                )}
              </button>

              {recordedLandmarks && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Gesture name (e.g. wave, point)"
                    className="w-full bg-secondary rounded-lg px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 ring-primary"
                  />
                  <select
                    value={newCommand}
                    onChange={(e) => setNewCommand(e.target.value)}
                    className="w-full bg-secondary rounded-lg px-3 py-2 text-xs font-mono text-foreground outline-none focus:ring-1 ring-primary"
                  >
                    {SYSTEM_COMMANDS.map((cmd) => (
                      <option key={cmd.value} value={cmd.value}>
                        {cmd.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleSave}
                    disabled={!newName.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary text-foreground text-xs font-mono hover:bg-secondary/80 disabled:opacity-40 transition-all"
                  >
                    <Save size={14} />
                    Save Gesture
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Saved gestures list */}
          <div className="space-y-4">
            <div className="glass rounded-xl p-4">
              <h2 className="text-sm font-mono text-foreground mb-4 flex items-center gap-2">
                <Plus size={14} className="text-primary" />
                Saved Gestures ({gestures.length})
              </h2>

              {gestures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Hand size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No gestures saved yet.</p>
                  <p className="text-xs opacity-60">Record your first gesture using the camera.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {gestures.map((g) => {
                    const cmd = SYSTEM_COMMANDS.find((c) => c.value === g.command);
                    return (
                      <div
                        key={g.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <div>
                          <p className="text-xs font-mono text-foreground">{g.name}</p>
                          <p className="text-[10px] text-muted-foreground">→ {cmd?.label || g.command}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(g.id)}
                          className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Built-in gestures */}
            <div className="glass rounded-xl p-4">
              <h2 className="text-sm font-mono text-foreground mb-3">Built-in Gestures</h2>
              <div className="space-y-2 text-xs font-mono text-muted-foreground">
                {[
                  { gesture: "👍 Thumbs Up", desc: "Detected automatically" },
                  { gesture: "✌️ Peace Sign", desc: "Detected automatically" },
                  { gesture: "✋ Open Palm", desc: "Detected automatically" },
                  { gesture: "✊ Fist", desc: "Detected automatically" },
                ].map((item) => (
                  <div key={item.gesture} className="flex justify-between p-2 rounded-lg bg-secondary/30">
                    <span>{item.gesture}</span>
                    <span className="opacity-60">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
