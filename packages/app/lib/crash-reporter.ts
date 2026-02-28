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
import { NativeModules } from "react-native";

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
  //
  // Guard: check for the Firebase native module before requiring anything.
  // With New Architecture (TurboModules/JSI), accessing a missing native
  // property throws a synchronous ReferenceError at the JSI layer that can
  // escape a regular try/catch. The NativeModules check avoids touching
  // Firebase at all when the native module isn't present — this covers both
  // de-Googled Android (no GMS) and dev clients built before Firebase was added.
  if (!NativeModules.RNFBAppModule) {
    return createNoopReporter();
  }

  let crashlytics: ReturnType<
    typeof import("@react-native-firebase/crashlytics").default
  > | null = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    crashlytics = require("@react-native-firebase/crashlytics").default();
  } catch {
    // Unexpected init failure — fail silently.
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
