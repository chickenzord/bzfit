/**
 * Crash reporter abstraction.
 *
 * Currently backed by Firebase Crashlytics. On de-Googled Android devices
 * (no Google Play Services), Crashlytics init/calls fail silently — every
 * method is wrapped in try/catch to guarantee no runtime crash.
 *
 * The active reporter is selected at build time via the CRASH_REPORTER env var
 * (see app.config.js). This makes it straightforward to swap the implementation
 * for a future build flavor (e.g. an F-Droid variant using Sentry or a noop)
 * without touching this interface or its call sites.
 *
 * Supported values for CRASH_REPORTER:
 *   "crashlytics" (default) — Firebase Crashlytics
 *   "none"                  — noop, no crash reporting
 */

import Constants from "expo-constants";

type CrashReporter = {
  recordError: (error: Error, context?: string) => void;
  log: (message: string) => void;
  setUserId: (userId: string | null) => void;
};

// ---------------------------------------------------------------------------
// Implementations
// ---------------------------------------------------------------------------

function createCrashlyticsReporter(): CrashReporter {
  // Dynamic require so the module is only resolved when Crashlytics is active.
  // On de-Googled devices any Firebase call may throw — caught here at init time.
  let crashlytics: ReturnType<
    typeof import("@react-native-firebase/crashlytics").default
  > | null = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    crashlytics = require("@react-native-firebase/crashlytics").default();
  } catch {
    // GMS not available — Crashlytics cannot initialise. Fail silently.
  }

  return {
    recordError(error, context) {
      try {
        crashlytics?.recordError(error, context);
      } catch {
        // silent — no GMS or unexpected Firebase error
      }
    },

    log(message) {
      try {
        crashlytics?.log(message);
      } catch {
        // silent
      }
    },

    setUserId(userId) {
      try {
        // Crashlytics requires a non-null string; pass empty string to clear.
        crashlytics?.setUserId(userId ?? "");
      } catch {
        // silent
      }
    },
  };
}

function createNoopReporter(): CrashReporter {
  return {
    recordError: () => {},
    log: () => {},
    setUserId: () => {},
  };
}

// ---------------------------------------------------------------------------
// Reporter selection (build-time via app.config.js extra.crashReporter)
// ---------------------------------------------------------------------------

const reporterType: string =
  Constants.expoConfig?.extra?.crashReporter ?? "crashlytics";

export const crashReporter: CrashReporter =
  reporterType === "none"
    ? createNoopReporter()
    : createCrashlyticsReporter();
