"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { preloadStartup, STARTUP_TASK_COUNT } from "@/lib/startup-preloader";

const initialProgress = Object.freeze({ completed: 0, total: STARTUP_TASK_COUNT, progress: 0, status: "Preparing adventure assets..." });

export function SplashScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(initialProgress);
  const [problem, setProblem] = useState(null);
  const attempt = useRef(0);
  const continueToWelcome = useCallback(() => router.replace("/welcome"), [router]);

  const start = useCallback(() => {
    const currentAttempt = ++attempt.current;
    const controller = new AbortController();
    void preloadStartup({ signal: controller.signal, onProgress: (next) => {
      if (attempt.current === currentAttempt) setProgress(next);
    } }).then((result) => {
      if (controller.signal.aborted || attempt.current !== currentAttempt) return;
      if (result.timedOut) setProblem("Some resources are still loading. You can retry or continue with lazy-loading fallbacks.");
      else if (result.requiredFailures.length) setProblem("Some artwork could not be prepared. You can retry or continue with the game’s built-in loaders.");
      else continueToWelcome();
    });
    return () => controller.abort();
  }, [continueToWelcome]);

  const retry = useCallback(() => {
    setProblem(null);
    setProgress(initialProgress);
    start();
  }, [start]);

  useEffect(() => start(), [start]);

  return (
    <main className="splash-screen">
      <section className="splash-card" aria-labelledby="splash-title" aria-live="polite">
        <span className="splash-kicker">The legendary adventure awaits</span>
        <h1 id="splash-title"><span>Treasure</span><em>Hunt</em></h1>
        <div className="splash-progress" role="progressbar" aria-label="Adventure loading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress.progress * 100)}>
          <span style={{ width: `${Math.round(progress.progress * 100)}%` }} />
        </div>
        <p>{problem || progress.status}</p>
        <small>{Math.round(progress.progress * 100)}% · {progress.completed} of {progress.total} resources prepared</small>
        {problem ? <div className="splash-actions"><button type="button" onClick={retry}>Retry</button><button type="button" onClick={continueToWelcome}>Continue</button></div> : null}
      </section>
    </main>
  );
}
