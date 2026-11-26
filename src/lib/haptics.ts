"use client";

/**
 * Shared Browser Haptic Feedback Utility using the Navigator Vibration API.
 * Gracefully no-ops on unsupported desktop/iOS browsers or when user disables haptics.
 */

export function isHapticsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const saved = localStorage.getItem("bodhi-haptics");
    return saved === null ? true : saved === "true";
  } catch {
    return true;
  }
}

export function triggerHaptic(pattern: number | number[] = 12): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (!isHapticsEnabled()) return false;
  try {
    if (typeof navigator.vibrate === "function") {
      return navigator.vibrate(pattern);
    }
  } catch {
    // Ignore errors in restricted iframe/browser contexts
  }
  return false;
}

export function hapticTap() {
  triggerHaptic(12);
}

export function hapticFavorite(isAdding: boolean) {
  triggerHaptic(isAdding ? [14, 28, 20] : 10);
}

export function hapticSuccess() {
  triggerHaptic([18, 35, 26]);
}
