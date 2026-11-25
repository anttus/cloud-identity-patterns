import { useState } from "react";

const PREFIX = "cip.";

const read = (key: string, fallback: boolean): boolean => {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : raw === "1";
  } catch {
    return fallback; // storage blocked (private mode, sandboxed preview, …)
  }
};

/** A boolean UI preference remembered in this browser only. Never required for correctness. */
export const usePersistentFlag = (key: string, fallback: boolean) => {
  const [value, setValue] = useState(() => read(key, fallback));
  const set = (next: boolean) => {
    setValue(next);
    try {
      window.localStorage.setItem(PREFIX + key, next ? "1" : "0");
    } catch {
      // Not persisted; the in-memory value still works for this session.
    }
  };
  return [value, set] as const;
};

const readNumber = (key: string, fallback: number): number => {
  try {
    const n = Number(window.localStorage.getItem(PREFIX + key));
    return Number.isFinite(n) && n > 0 ? n : fallback;
  } catch {
    return fallback;
  }
};

/**
 * A number remembered in this browser only (e.g. a panel width). `value` updates live;
 * `save` also writes it to storage, so callers can persist once at the end of a drag.
 */
export const usePersistentNumber = (key: string, fallback: number) => {
  const [value, setValue] = useState(() => readNumber(key, fallback));
  const save = (next: number) => {
    setValue(next);
    try {
      window.localStorage.setItem(PREFIX + key, String(Math.round(next)));
    } catch {
      // Not persisted; the in-memory value still works for this session.
    }
  };
  return [value, setValue, save] as const;
};
