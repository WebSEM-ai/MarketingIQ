"use client";

import { useState, useEffect, useCallback } from "react";

export function usePersistedState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`miq:${key}`);
      if (stored) {
        setState(JSON.parse(stored));
      }
    } catch {
      // Invalid JSON, ignore
    }
    setHydrated(true);
  }, [key]);

  // Save to localStorage on change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(`miq:${key}`, JSON.stringify(state));
    } catch {
      // Storage full or unavailable
    }
  }, [key, state, hydrated]);

  const clear = useCallback(() => {
    setState(initialValue);
    localStorage.removeItem(`miq:${key}`);
  }, [key, initialValue]);

  return [state, setState, { hydrated, clear }] as const;
}
