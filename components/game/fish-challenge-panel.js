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
  const loadRequestRef = useRef(0);

  const receiveChallenge = useCallback((response, requestId) => {
    if (!mountedRef.current || requestId !== loadRequestRef.current) return;
    if (!response.ok || !response.challenge) {
      setStatus("error"); setMessage(response.error || "The Fish puzzle could not be loaded."); return;
    }
    setChallenge(response.challenge); setStatus("ready");
  }, []);

  const requestChallenge = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    const response = await postJson("/api/fish/challenges", { mode, runAttemptId, worldId });
    receiveChallenge(response, requestId);
  }, [mode, receiveChallenge, runAttemptId, worldId]);

  useEffect(() => {
    mountedRef.current = true;
    const requestId = ++loadRequestRef.current;
    postJson("/api/fish/challenges", { mode, runAttemptId, worldId }).then((response) => receiveChallenge(response, requestId));
    return () => { mountedRef.current = false; loadRequestRef.current += 1; };
  }, [mode, receiveChallenge, runAttemptId, worldId]);

  function retryChallenge() {
    setStatus("loading"); setMessage(""); setAnswer(""); setChallenge(null);
    requestChallenge();
  }

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
      setStatus(response.status === 410 || response.status === 429 ? "error" : "ready");
      setMessage(response.error || "The answer could not be verified."); return;
    }
    if (approvedRef.current) return;
    approvedRef.current = true; setStatus("approved"); setMessage("Correct! Restoring one life safely...");
    onApproved();
  }

  const busy = status === "loading" || status === "submitting" || status === "approved";
  return <section className="fish-challenge-overlay" role="dialog" aria-modal="true" aria-labelledby="fish-challenge-title">
    <div className="fish-challenge-panel">
      <button className="fish-challenge-close" type="button" onClick={onClose} disabled={status === "submitting" || status === "approved"} aria-label="Close Fish challenge"><X size={19} /></button>
      <div className="fish-challenge-heading"><span><Fish size={18} />One revival available</span><h2 id="fish-challenge-title">Count the Fish</h2><p>Solve the genuine Fish Game API puzzle to continue this run with exactly one life.</p></div>
      {status === "loading" ? <div className="fish-challenge-loading" role="status"><LoaderCircle className="button-spinner" size={28} /><strong>Requesting a secure puzzle...</strong></div> : null}
      {challenge ? <form onSubmit={submitAnswer}>
        <div className="fish-puzzle-frame">{/* The provider URL is runtime data and must not be proxied or configured as a static Next image host. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={challenge.imageUrl} alt="Fish Game puzzle. Count every fish shown." />
        </div>
        <label htmlFor="fish-answer">How many fish are shown?</label>
        <input id="fish-answer" className="form-field fish-answer-input" type="number" inputMode="numeric" min="0" max="1000" step="1" autoComplete="off" value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={busy} autoFocus />
        {message ? <p className={`fish-challenge-message ${status === "approved" ? "is-success" : ""}`} role="status">{status === "approved" ? <ShieldCheck size={17} /> : null}{message}</p> : null}
        <button className="game-button game-button-primary fish-submit" type="submit" disabled={busy || answer === ""}>{status === "submitting" || status === "approved" ? <><LoaderCircle className="button-spinner" size={17} />Verifying Securely</> : "Submit Fish Count"}</button>
      </form> : null}
      {status === "error" ? <div className="fish-challenge-error" role="alert"><p>{message}</p><button className="game-button game-button-primary" type="button" onClick={retryChallenge}><RefreshCw size={17} />Request Another Puzzle</button></div> : null}
      <small>The solution is validated on the server and is never sent to this browser.</small>
    </div>
  </section>;
}
