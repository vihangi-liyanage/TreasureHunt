"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const MINIMUM_SPLASH_MS = 1_700;
const MAXIMUM_ASSET_WAIT_MS = 4_500;
const TRANSITION_MS = 420;
const REQUIRED_ART = ["/art/treasurehunt-hero.png", "/art/worlds-atlas.png"];

function waitForImage(source) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = source;
  });
}

export function SplashScreen() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let active = true;
    let transitionTimer;
    const minimumDelay = new Promise((resolve) => window.setTimeout(resolve, MINIMUM_SPLASH_MS));
    const assetLoad = Promise.all(REQUIRED_ART.map(waitForImage));
    const assetDeadline = new Promise((resolve) => window.setTimeout(resolve, MAXIMUM_ASSET_WAIT_MS));

    Promise.all([minimumDelay, Promise.race([assetLoad, assetDeadline])]).then(() => {
      if (!active) return;
      setLeaving(true);
      transitionTimer = window.setTimeout(() => router.replace("/welcome"), TRANSITION_MS);
    });

    return () => {
      active = false;
      window.clearTimeout(transitionTimer);
    };
  }, [router]);

  return (
    <main className={`splash-screen ${leaving ? "is-leaving" : ""}`}>
      <div className="splash-content">
        <h1 className="game-title">Treasure<span>Hunt</span></h1>
        <div className="loading-track" role="progressbar" aria-label="Loading TreasureHunt">
          <div className="loading-fill" />
        </div>
      </div>
    </main>
  );
}
