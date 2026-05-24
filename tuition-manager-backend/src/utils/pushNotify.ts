import webpush from 'web-push';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@classkhata.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendPushNotification(
  subscription: object,
  payload: { title: string; body: string; icon?: string }
): Promise<void> {
  if (!process.env.VAPID_PUBLIC_KEY) return;
  try {
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify({ ...payload, icon: payload.icon || '/logo-192.png' })
    );
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      // Subscription expired — caller should clean it up
      throw { expired: true, err };
    }
    console.error('Push notification error:', err.message);
  }
}
