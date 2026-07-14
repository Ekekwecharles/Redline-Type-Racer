"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import type { PresenceChannel, Members } from "pusher-js";
import { getPusherClient } from "@/lib/pusher-client";
import { useTypingCore } from "@/hooks/useTypingCore";
import { useProfile } from "@/hooks/useProfile";
import { genText } from "@/lib/words";
import { currentDifficultyConfig, defaultSettings } from "@/lib/difficulty";
import { CARS } from "@/lib/cars";
import HUD from "@/components/HUD";
import RaceTrack, { LaneData } from "@/components/RaceTrack";
import TypingPanel from "@/components/TypingPanel";

type Phase = "lobby" | "countdown" | "racing" | "finished";

interface Peer {
  id: string;
  name: string;
  pct: number;
  finished: boolean;
}

function roomCode(len: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export default function MultiplayerPage() {
  const { status } = useSession();
  const { profile, recordRace } = useProfile();
  const [room, setRoom] = useState<string | null>(null);
  const [joinInput, setJoinInput] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [phase, setPhase] = useState<Phase>("lobby");
  const [peers, setPeers] = useState<Record<string, Peer>>({});
  const [myId, setMyId] = useState<string | null>(null);
  const [targetText, setTargetText] = useState("");
  const channelRef = useRef<PresenceChannel | null>(null);
  const myCar = CARS.find((c) => c.id === profile.selectedCar) || CARS[0];
  const settings = defaultSettings();
  const diff = currentDifficultyConfig(settings);

  const typing = useTypingCore({
    targetText,
    penaltyPerMistake: diff.penalty,
    onComplete: () => handleFinish(),
  });

  const beginRace = useCallback((text: string, startAt: number) => {
    setTargetText(text);
    setPhase("countdown");
    const wait = Math.max(0, startAt - Date.now());
    setTimeout(() => setPhase("racing"), wait);
  }, []);

  const joinRoom = useCallback(
    (code: string, asHost: boolean) => {
      const pusher = getPusherClient();
      const channel = pusher.subscribe(`presence-race-${code}`) as PresenceChannel;
      channelRef.current = channel;
      setRoom(code);
      setIsHost(asHost);

      channel.bind("pusher:subscription_succeeded", (members: Members) => {
        setMyId(String(members.myID));
        const next: Record<string, Peer> = {};
        members.each((m: { id: string; info: { name?: string } }) => {
          next[m.id] = { id: m.id, name: m.info?.name || "Racer", pct: 0, finished: false };
        });
        setPeers(next);
      });
      channel.bind("pusher:member_added", (m: { id: string; info: { name?: string } }) => {
        setPeers((prev) => ({ ...prev, [m.id]: { id: m.id, name: m.info?.name || "Racer", pct: 0, finished: false } }));
      });
      channel.bind("pusher:member_removed", (m: { id: string }) => {
        setPeers((prev) => {
          const next = { ...prev };
          delete next[m.id];
          return next;
        });
      });
      channel.bind("client-start", (data: { text: string; startAt: number }) => {
        beginRace(data.text, data.startAt);
      });
      channel.bind("client-progress", (data: { id: string; pct: number }) => {
        setPeers((prev) => (prev[data.id] ? { ...prev, [data.id]: { ...prev[data.id], pct: data.pct } } : prev));
      });
      channel.bind("client-finish", (data: { id: string }) => {
        setPeers((prev) => (prev[data.id] ? { ...prev, [data.id]: { ...prev[data.id], finished: true } } : prev));
      });
    },
    [beginRace]
  );

  function createRoom() {
    joinRoom(roomCode(4), true);
  }
  function joinExisting() {
    if (joinInput.trim()) joinRoom(joinInput.trim().toUpperCase(), false);
  }
  function leaveRoom() {
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    setRoom(null);
    setPhase("lobby");
    setPeers({});
  }

  function startRace() {
    if (!isHost || !channelRef.current) return;
    const text = genText(55);
    const startAt = Date.now() + 3000;
    channelRef.current.trigger("client-start", { text, startAt });
    beginRace(text, startAt); // host doesn't receive its own client event, so start locally too
  }

  function handleFinish() {
    setPhase("finished");
    channelRef.current?.trigger("client-finish", { id: myId });
    recordRace({ wpm: typing.wpm, acc: typing.acc, maxCombo: typing.maxCombo, won: true, mode: "multiplayer" });
  }

  // broadcast progress as we type
  useEffect(() => {
    if (phase === "racing" && channelRef.current && myId) {
      channelRef.current.trigger("client-progress", { id: myId, pct: typing.progressPct });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typing.progressPct]);

  useEffect(() => {
    if (typing.active) typing.tickGauges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typing.correctChars, typing.mistakes]);

  useEffect(() => {
    return () => {
      channelRef.current?.unsubscribe();
    };
  }, []);

  if (status !== "authenticated") {
    return (
      <div className="bg-asphalt-2 border border-line rounded-2xl p-6 text-center">
        <h2 className="font-display text-lg mb-2">Sign in to race online</h2>
        <p className="text-sm text-dim mb-4">Solo races vs AI don&apos;t need an account, but real multiplayer does — it's how we know who's in your room.</p>
        <a href="/login" className="inline-block font-display text-[11px] tracking-wider font-bold bg-gradient-to-r from-violet to-cyan text-asphalt rounded-lg px-4 py-2.5">
          Sign In / Register
        </a>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="bg-asphalt-2 border border-line rounded-2xl p-5">
        <h2 className="font-display text-sm tracking-widest uppercase text-fog mb-2">Race Someone, Anywhere</h2>
        <p className="text-xs text-dim mb-4">
          Real-time, cross-device rooms powered by Pusher Channels. Create a room and send the code to a friend on any device, anywhere.
        </p>
        <div className="flex gap-2.5 flex-wrap items-center">
          <button onClick={createRoom} className="font-display text-[11px] tracking-wider font-bold bg-gradient-to-r from-violet to-cyan text-asphalt rounded-lg px-4 py-2.5">
            Create Room
          </button>
          <input
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value)}
            placeholder="Enter room code"
            className="bg-asphalt-3 border border-line rounded-lg px-3 py-2 text-sm uppercase w-40"
          />
          <button onClick={joinExisting} className="font-display text-[11px] tracking-wider border border-line text-fog rounded-lg px-4 py-2.5 hover:border-cyan hover:text-white">
            Join Room
          </button>
        </div>
      </div>
    );
  }

  const peerList = Object.values(peers);

  if (phase === "lobby" || phase === "countdown") {
    return (
      <div className="bg-asphalt-2 border border-line rounded-2xl p-5">
        <div className="font-display text-3xl tracking-[8px] text-cyan">{room}</div>
        <div className="flex gap-2.5 mt-2">
          <button
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/multiplayer?room=${room}`)}
            className="font-display text-[11px] tracking-wider border border-line text-fog rounded-lg px-4 py-2.5 hover:border-cyan hover:text-white"
          >
            Copy Invite Link
          </button>
          <button onClick={leaveRoom} className="font-display text-[11px] tracking-wider border border-line text-fog rounded-lg px-4 py-2.5 hover:border-pink hover:text-white">
            Leave Room
          </button>
        </div>

        <div className="flex flex-col gap-2 mt-3.5">
          {peerList.map((p) => (
            <div key={p.id} className="flex justify-between bg-asphalt-3 border border-line rounded-lg px-3 py-2 text-xs">
              <span>
                {p.name} {p.id === myId ? "(you)" : ""}
              </span>
              {isHost && p.id === myId && <span className="text-amber text-[10px]">HOST</span>}
            </div>
          ))}
        </div>

        {isHost ? (
          <button
            onClick={startRace}
            disabled={peerList.length < 2 || phase === "countdown"}
            className="font-display text-[11px] tracking-wider font-bold bg-gradient-to-r from-violet to-cyan text-asphalt rounded-lg px-4 py-2.5 mt-3.5 disabled:opacity-40"
          >
            {phase === "countdown" ? "Starting…" : "Start Race"}
          </button>
        ) : (
          <p className="text-xs text-dim mt-3.5">Waiting for the host to start…</p>
        )}
        {peerList.length < 2 && <p className="text-xs text-dim mt-2">Waiting for at least one more racer to join…</p>}
      </div>
    );
  }

  const lanes: LaneData[] = peerList.map((p) => ({
    key: p.id,
    label: p.id === myId ? `${profile.name} (You)` : p.name,
    emoji: p.id === myId ? myCar.emoji : "🚗",
    pct: p.id === myId ? typing.progressPct : Math.min(96, p.pct),
    isYou: p.id === myId,
  }));

  return (
    <div>
      <HUD wpm={typing.wpm} acc={typing.acc} combo={typing.combo} penalty={typing.penaltyChars} />
      <RaceTrack lanes={lanes} moving={phase === "racing"} boosting={typing.wpm >= 55} />
      <TypingPanel
        targetText={targetText}
        typedChars={typing.typedChars}
        typedState={typing.typedState}
        statusText={
          phase === "finished"
            ? `🏁 Finished! ${typing.wpm} WPM · ${typing.acc}% accuracy.`
            : "GO! Keep typing — mistakes send you backward."
        }
        statusVariant={phase === "finished" ? "win" : "neutral"}
        onChange={typing.handleInputValue}
        disabled={phase === "finished"}
      />
      {phase === "finished" && (
        <button onClick={leaveRoom} className="font-display text-[11px] tracking-wider font-bold bg-gradient-to-r from-violet to-cyan text-asphalt rounded-lg px-4 py-2.5 mt-4">
          Back to Lobby
        </button>
      )}
    </div>
  );
}
