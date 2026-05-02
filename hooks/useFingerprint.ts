"use client";

import { useState, useEffect } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

export function useFingerprint(): string | null {
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  useEffect(() => {
    FingerprintJS.load()
      .then((fp) => fp.get())
      .then((result) => setFingerprint(result.visitorId))
      .catch((err) => console.error("Fingerprint error:", err));
  }, []);

  return fingerprint;
}
