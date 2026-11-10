"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Fish, LoaderCircle, RefreshCw, ShieldCheck, X } from "lucide-react";
import { postJson } from "@/lib/auth/client-api";

export function FishChallengePanel({ mode, runAttemptId, worldId, onClose, onApproved }) {
  const [challenge, setChallenge] = useState(null);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const approvedRef = useRef(false);
  const mountedRef = useRef(true);
  const initialRequestStartedRef = useRef(false);
  const requestInFlightRef = useRef(false);

  const requestChallenge = useCallback(async () => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    setStatus("loading"); setMessage(""); setAnswer(""); setChallenge(null);
    const response = await postJson("/api/fish/challenges", { mode, runAttemptId, worldId });
    requestInFlightRef.current = false;
    if (!mountedRef.current) return;
    if (!response.ok || !response.challenge) {
      setStatus("error"); setMessage(response.error || "The Fish puzzle could not be loaded."); return;
    }
    setChallenge(response.challenge); setStatus("ready");
  }, [mode, runAttemptId, worldId]);

  useEffect(() => {
    mountedRef.current = true;
    if (!initialRequestStartedRef.current) {
      initialRequestStartedRef.current = true;
      requestChallenge();
    }
    return () => { mountedRef.current = false; };
  }, [requestChallenge]);

  useEffect(() => {
    if (status !== "incorrect") return undefined;
    const timer = window.setTimeout(onClose, 1_500);
    return () => window.clearTimeout(timer);
  }, [onClose, status]);

  async function submitAnswer(event) {
    event.preventDefault();
    const numericAnswer = Number(answer);
    if (!challenge || !Number.isInteger(numericAnswer) || numericAnswer < 0 || numericAnswer > 1_000) {
      setMessage("Enter a whole number from 0 to 1,000."); return;
    }
    setStatus("submitting"); setMessage("");
    const response = await postJson(`/api/fish/challenges/${challenge.id}/answer`, { mode, runAttemptId, answer: numericAnswer });
    if (!mountedRef.current) return;
    if (!response.ok || response.revivalGranted !== true) {
      if (response.code === "incorrect") {
        setStatus("incorrect"); setMessage("Incorrect answer! Try again."); return;
      }
      setStatus(response.status === 429 ? "error" : "ready");
      setMessage(response.error || "The answer could not be verified."); return;
    }
    if (approvedRef.current) return;
    approvedRef.current = true; setStatus("approved"); setMessage("Correct! Restoring one life safely...");
    onApproved();
  }

  const busy = status !== "ready";
  return <section className="fish-challenge-overlay" role="dialog" aria-modal="true" aria-labelledby="fish-challenge-title">
    <div className="fish-challenge-panel">
      <button className="fish-challenge-close" type="button" onClick={onClose} disabled={status === "submitting" || status === "approved"} aria-label="Close Fish challenge"><X size={19} /></button>
      <div className="fish-challenge-heading"><span><Fish size={18} />One revival available</span><h2 id="fish-challenge-title">Count the Fish</h2><p>Solve the genuine Fish Game API puzzle to continue this run with exactly one life.</p></div>
      {status === "loading" ? <div className="fish-challenge-loading" role="status"><LoaderCircle className="button-spinner" size={28} /><strong>Requesting a secure puzzle...</strong></div> : null}
      {challenge && ["ready", "submitting", "incorrect", "approved"].includes(status) ? <form onSubmit={submitAnswer}>
        <div className="fish-puzzle-frame">{/* The server returns an opaque base64 PNG data URL without solution fields. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={challenge.imageUrl} alt="Fish Game puzzle. Count every fish shown." />
        </div>
        <label htmlFor="fish-answer">How many fish are shown?</label>
        <input id="fish-answer" className="form-field fish-answer-input" type="number" inputMode="numeric" min="0" max="1000" step="1" autoComplete="off" value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={busy} autoFocus />
        {message ? <p className={`fish-challenge-message ${status === "approved" ? "is-success" : status === "incorrect" ? "is-incorrect" : ""}`} role={status === "incorrect" ? "alert" : "status"}>{status === "approved" ? <ShieldCheck size={17} /> : null}{message}</p> : null}
        <button className="game-button game-button-primary fish-submit" type="submit" disabled={busy || answer === ""}>{status === "submitting" || status === "approved" ? <><LoaderCircle className="button-spinner" size={17} />Verifying Securely</> : status === "incorrect" ? "Returning to Game Over..." : "Submit Fish Count"}</button>
      </form> : null}
      {status === "error" ? <div className="fish-challenge-error" role="alert"><p>{message}</p><button className="game-button game-button-primary" type="button" onClick={requestChallenge}><RefreshCw size={17} />Try Again</button></div> : null}
      <small>The solution is validated on the server and is never sent to this browser.</small>
    </div>
  </section>;
}
