import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IDLE_MINUTES, WARNING_SECONDS, COUNT_WHEN_HIDDEN  } from "./idle-config";

const DEBUG = false;
const log = (...a) => DEBUG && console.debug("[Idle]", ...a);

// Throttle incidental jitter (mouse move noise)
const ACTIVITY_THROTTLE_MS = 1000; // 1s

export default function IdleProvider({ children, idleMinutes = IDLE_MINUTES, warningSeconds = WARNING_SECONDS }) {
  const navigate = useNavigate();

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(warningSeconds);

  // refs
  const showWarningRef = useRef(false);
  const initializedRef = useRef(false);
  const logoutTimerRef = useRef(null);
  const warnTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const lastHumanActivityRef = useRef(0);
  const logoutAtRef = useRef(0);
  const warnAtRef = useRef(0);

  const isAuthenticated = () => !!localStorage.getItem("accessToken");

  const clearTimers = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    logoutTimerRef.current = null;
    warnTimerRef.current = null;
    countdownIntervalRef.current = null;
    log("Timers cleared");
  }, []);

  const broadcastLogout = () => {
    try {
      localStorage.setItem("__idle__logout", JSON.stringify({ ts: Date.now() }));
    } catch {}
  };

  const doLogout = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    showWarningRef.current = false;

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");

    broadcastLogout();
    navigate("/", { replace: true });
  }, [clearTimers, navigate]);

  const startTimers = useCallback(() => {
    clearTimers();
    if (!isAuthenticated()) {
      log("Not authenticated; not starting timers");
      return;
    }

    const totalMs = Math.max(1, idleMinutes * 60 * 1000);
    // Ensure warning < total; if not, skip warning and just logout at total
    const enableWarning = warningSeconds > 0 && warningSeconds * 1000 < totalMs;
    const warnMs = enableWarning ? totalMs - warningSeconds * 1000 : null;
    const now = Date.now();
    logoutAtRef.current = now + totalMs;
    warnAtRef.current = enableWarning ? now + warnMs : 0;

    log(`Start timers: total=${totalMs}ms, warnAt=${enableWarning ? warnMs : "none"}`);

    if (enableWarning) {
      warnTimerRef.current = setTimeout(() => {
        setShowWarning(true);
        showWarningRef.current = true;
        setCountdown(warningSeconds);
        countdownIntervalRef.current = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) {
              clearInterval(countdownIntervalRef.current);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      }, warnMs);
    }

    logoutTimerRef.current = setTimeout(() => {
      setShowWarning(false);
      showWarningRef.current = false;
      doLogout();
    }, totalMs);
  }, [clearTimers, doLogout, idleMinutes, warningSeconds]);

  // Human input resets (but NOT while warning is visible)
  const onHumanActivity = useCallback(() => {
    if (showWarningRef.current) return; // require explicit click
    const now = Date.now();
    if (now - lastHumanActivityRef.current < ACTIVITY_THROTTLE_MS) return;
    lastHumanActivityRef.current = now;
    startTimers();
  }, [startTimers]);

  // Visibility handler: don't pause if COUNT_WHEN_HIDDEN.
  // Instead, when we come back, "catch up" if deadlines already passed.
  const onVisibility = useCallback(() => {
    if (document.hidden) return; // do nothing; timer continues in background
    const now = Date.now();
    // If logout deadline passed while hidden (or throttled), logout immediately
    if (logoutAtRef.current && now >= logoutAtRef.current) {
      setShowWarning(false);
      showWarningRef.current = false;
      doLogout();
      return;
    }
    // If warning deadline passed and we aren't showing it yet, show with correct remaining seconds
    if (!showWarningRef.current && warnAtRef.current && now >= warnAtRef.current) {
      const secsLeft = Math.max(0, Math.ceil((logoutAtRef.current - now) / 1000));
      setShowWarning(true);
      showWarningRef.current = true;
      setCountdown(secsLeft);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((c) => (c <= 1 ? 0 : c - 1));
      }, 1000);
    }
  }, [doLogout]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      if (isAuthenticated()) startTimers();
    }

    const evts = ["mousemove", "mousedown", "keydown", "wheel", "touchstart", "scroll"];
    evts.forEach((e) => window.addEventListener(e, onHumanActivity, { passive: true }));

    // Always listen to visibilitychange, but only to "catch up" (no pausing)
    document.addEventListener("visibilitychange", onVisibility);


    // Cross-tab logout sync
    const storageHandler = (e) => {
      if (e.key === "__idle__logout" && e.newValue) doLogout();
    };
    window.addEventListener("storage", storageHandler);

    return () => {
      evts.forEach((e) => window.removeEventListener(e, onHumanActivity));
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", storageHandler);
      clearTimers();
    };
  }, [onHumanActivity, onVisibility, startTimers, clearTimers, doLogout]);

  const stayLoggedIn = () => {
    setShowWarning(false);
    showWarningRef.current = false;
    startTimers(); // explicit extend
  };

  return (
    <>
      {children}

      {showWarning && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
          <div className="bg-white text-black rounded-2xl shadow-lg p-6 w-[90%] max-w-md">
            <h2 className="text-xl font-semibold mb-2">You’re about to be signed out</h2>
            <p className="mb-4">
              You’ve been inactive. You’ll be signed out in{" "}
              <span className="font-bold">{countdown}</span> seconds.
            </p>
            <div className="flex gap-3 justify-end">
              <button className="px-4 py-2 rounded-lg border border-gray-300" onClick={doLogout}>
                Sign out now
              </button>
              <button className="px-4 py-2 rounded-lg bg-blue-600 text-white" onClick={stayLoggedIn}>
                Stay signed in
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
