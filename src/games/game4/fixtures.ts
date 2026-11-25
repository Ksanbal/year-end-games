export type TimerFixture = {
  phase: "ready" | "running" | "stopped" | "autostop";
  elapsedMs: number;
};

export function screenCode(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("screen");
}

export function timerFixture(code: string | null): TimerFixture | null {
  switch (code) {
    case "05-0":
      return { phase: "ready", elapsedMs: 0 };
    case "05-1":
      return { phase: "running", elapsedMs: 6_482 };
    case "05-2":
      return { phase: "stopped", elapsedMs: 10_137 };
    case "05-3":
      return { phase: "autostop", elapsedMs: 20_000 };
    case "06-1":
      return { phase: "running", elapsedMs: 0 };
    case "06-2":
      return { phase: "stopped", elapsedMs: 9_874 };
    case "06-3":
      return { phase: "autostop", elapsedMs: 20_000 };
    default:
      return null;
  }
}
