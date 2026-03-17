import { getUserProfile, updateUserProfile } from './firestore';

/**
 * Updates the user's streak after a study session.
 * Call this after logging any study session.
 */
export async function updateStreak(userId: string): Promise<number> {
  const profile = await getUserProfile(userId);
  if (!profile) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Check when the last session was (stored as lastStudyDate on profile)
  const lastDate = (profile as any).lastStudyDate as string | undefined;

  let newStreak = profile.streak;

  if (lastDate === today) {
    // Already studied today — no change
    return newStreak;
  } else if (lastDate === yesterday) {
    // Consecutive day — increment
    newStreak = profile.streak + 1;
  } else {
    // Streak broken — reset to 1
    newStreak = 1;
  }

  await updateUserProfile(userId, {
    streak: newStreak,
    lastStudyDate: today,
  } as any);

  return newStreak;
}
