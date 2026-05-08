"use client";

import { useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { BarVisualizer } from "@/components/ui/bar-visualizer";
import { ParticleOrb } from "@/components/ui/particle-orb";
import { X } from "lucide-react";
import { DOCSPOT_AGENT_ID } from "@/config/agent";

export default function Home() {
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      setShowVisualizer(true);
    },
    onDisconnect: () => {
      setShowVisualizer(false);
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
      }
    },
    onError: (error) => {
      console.error("Error:", error);
      setShowVisualizer(false);
    },
  });

  const startConversation = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);

      await conversation.startSession({
        agentId: DOCSPOT_AGENT_ID,
        connectionType: "webrtc",
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  }, [conversation]);

  const endConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fbff] text-[#111827] font-sans overflow-hidden">
      <main className="relative flex flex-1 flex-col items-center justify-center p-4">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(88,245,255,0.18),transparent_34%),linear-gradient(225deg,rgba(255,111,206,0.16),transparent_38%),radial-gradient(circle_at_50%_60%,rgba(14,31,88,0.08),transparent_42%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(to_top,rgba(255,255,255,0.94),transparent)]" />

        <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-8">
          <div className="text-center space-y-3 px-4">
            <h1 className="text-4xl font-semibold tracking-normal text-gray-950 md:text-5xl">
              Docspot AI
            </h1>
            <p className="mx-auto max-w-md text-base font-normal leading-7 text-slate-500 md:text-lg">
              Your AI assistant for dental call handling and patient support.
            </p>
          </div>

          <div className="relative flex min-h-[460px] w-full items-center justify-center">
            {!showVisualizer ? (
              <div className="flex flex-col items-center gap-7 py-8">
                <div className="flex flex-col items-center gap-5">
                  <button
                    onClick={startConversation}
                    className="group relative h-64 w-64 focus:outline-none md:h-80 md:w-80"
                    aria-label="Talk to Docspot AI"
                  >
                    <div className="absolute inset-8 rounded-full bg-cyan-300/25 blur-3xl transition-opacity duration-500 group-hover:opacity-90" />
                    <div className="absolute inset-16 rounded-full bg-fuchsia-300/20 blur-2xl transition-transform duration-700 group-hover:scale-125" />
                    <div className="relative h-full w-full transition-transform duration-500 group-hover:scale-105 group-focus-visible:scale-105">
                      <ParticleOrb />
                    </div>
                  </button>
                  <span className="rounded-full border border-cyan-200/80 bg-white/80 px-5 py-2 text-base font-semibold text-slate-900 shadow-[0_16px_36px_rgba(15,23,42,0.10)] backdrop-blur">
                    Talk to Docspot AI
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-md flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500 slide-in-from-bottom-4">
                <div className="w-full rounded-2xl border border-cyan-100 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-md">
                  <BarVisualizer
                    state={
                      conversation.status === "connected"
                        ? conversation.isSpeaking
                          ? "speaking"
                          : "listening"
                        : "connecting"
                    }
                    barCount={20}
                    mediaStream={mediaStream}
                    className="h-32"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={endConversation}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-8 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-cyan-200 hover:bg-cyan-50 hover:text-slate-950"
                  >
                    <X size={16} />
                    End Call with Docspot AI
                  </button>
                </div>

                <p className="text-xs font-medium animate-pulse uppercase tracking-wider text-red-600/80">
                  {conversation.status === "connected"
                    ? conversation.isSpeaking
                      ? "Docspot AI Speaking"
                      : "Listening"
                    : "Connecting..."}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-100 bg-white/70 py-6 text-center text-sm text-slate-400">
        <p>&copy; 2026 Docspot AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
