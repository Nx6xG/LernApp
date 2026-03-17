/**
 * Browser Notification system for due card reminders.
 * Works without Firebase Cloud Messaging — runs client-side.
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function sendNotification(title: string, options?: NotificationOptions): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  new Notification(title, {
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    ...options,
  });
}

/**
 * Checks for due cards and sends a notification if there are any.
 * Called periodically from the app.
 */
export function notifyDueCards(dueCount: number): void {
  if (dueCount === 0) return;
  sendNotification('Karteikarten fällig!', {
    body: `Du hast ${dueCount} Karte${dueCount !== 1 ? 'n' : ''} zur Wiederholung.`,
    tag: 'due-cards', // prevents duplicate notifications
  });
}

/**
 * Sets up a periodic check for due cards.
 * Returns a cleanup function.
 */
export function startDueCardReminder(
  checkDueCount: () => Promise<number>,
  intervalMinutes: number = 30
): () => void {
  // Check immediately
  checkDueCount().then(notifyDueCards);

  // Then periodically
  const interval = setInterval(async () => {
    const count = await checkDueCount();
    notifyDueCards(count);
  }, intervalMinutes * 60 * 1000);

  return () => clearInterval(interval);
}
