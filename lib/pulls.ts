import { PullState } from '@prisma/client';

export const MAX_PULLS = 12;
export const PULL_INTERVAL_HOURS = 1;

export interface PullInfo {
  availablePulls: number;
  nextPullAt: Date | null;
}

/**
 * Compute available pulls dynamically from stored state.
 * Never trust only the stored availablePulls value.
 */
export function computePulls(state: PullState): PullInfo {
  const now = new Date();
  const elapsedMs = now.getTime() - state.lastPullAt.getTime();
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const earned = Math.floor(elapsedHours / PULL_INTERVAL_HOURS);
  const availablePulls = Math.min(state.availablePulls + earned, MAX_PULLS);

  // Compute when next pull accrues (null if already at max)
  let nextPullAt: Date | null = null;
  if (availablePulls < MAX_PULLS) {
    const hoursUntilNext = PULL_INTERVAL_HOURS - (elapsedHours % PULL_INTERVAL_HOURS);
    nextPullAt = new Date(now.getTime() + hoursUntilNext * 60 * 60 * 1000);
  }

  return { availablePulls, nextPullAt };
}

/**
 * Returns the updated PullState fields to persist after a pull is consumed.
 */
export function consumePull(state: PullState): {
  availablePulls: number;
  lastPullAt: Date;
} {
  const { availablePulls } = computePulls(state);
  if (availablePulls <= 0) {
    throw new Error('No pulls available');
  }

  const now = new Date();
  // Reset the timer anchor so future pulls accrue from now
  return {
    availablePulls: availablePulls - 1,
    lastPullAt: now,
  };
}
