import { Request, Response } from 'express';
import User from '../models/User';
import webpush from 'web-push';
import { messaging } from '../firebase';

// Configure Web Push with keys from env (loaded in server.ts)
// Note: We'll initialize this in server.ts or here if envs are ready
webpush.setVapidDetails(
    process.env.VAPID_MAILTO || 'mailto:admin@example.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export const saveFcmToken = async (req: any, res: Response) => {
    try {
        const { token } = req.body;
        const userId = req.user._id;

        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        await User.findByIdAndUpdate(userId, { fcmToken: token });
        res.status(200).json({ message: 'FCM Token saved' });
    } catch (error) {
        console.error('Save FCM Token Error:', error);
        res.status(500).json({ message: 'Failed to save token' });
    }
};

export const subscribeToNotifications = async (req: any, res: Response) => {
    try {
        const subscription = req.body;
        const userId = req.user._id;

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ message: 'Invalid subscription object' });
        }

        // Save subscription to user
        await User.findByIdAndUpdate(userId, { pushSubscription: subscription });

        res.status(201).json({ message: 'Subscription added successfully' });
    } catch (error) {
        console.error('Push Subscription Error:', error);
        res.status(500).json({ message: 'Failed to subscribe' });
    }
};

export const sendPushNotification = async (userId: string, payload: any) => {
    try {
        const user = await User.findById(userId);

        // Web Push
        if (user && user.pushSubscription) {
            await webpush.sendNotification(user.pushSubscription, JSON.stringify(payload));
            console.log(`Web Push sent to ${user.name}`);
        }

        // FCM Push (Android)
        if (user && user.fcmToken && messaging) {
            await messaging.send({
                token: user.fcmToken,
                data: {
                    title: payload.title,
                    body: payload.body,
                    url: payload.url || '/',
                    orderId: payload.orderId ? String(payload.orderId) : ''
                },
                android: {
                    priority: 'high'
                }
            });
            console.log(`FCM Data-only sent to ${user.name}`);
        }
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};

export const notifyAdmins = async (payload: any) => {
    try {
        const admins = await User.find({ role: 'admin' });

        for (const admin of admins) {
            // 1. Web Push
            if (admin.pushSubscription) {
                try {
                    await webpush.sendNotification(admin.pushSubscription, JSON.stringify(payload));
                } catch (err) {
                    console.error(`Failed to web push to admin ${admin.name}`, err);
                }
            }

            // 2. FCM Push (Mobile) - Data Only
            if (admin.fcmToken && messaging) {
                try {
                    await messaging.send({
                        token: admin.fcmToken,
                        data: {
                            title: payload.title,
                            body: payload.body,
                            url: payload.url || '/',
                            orderId: payload.orderId ? String(payload.orderId) : ''
                        },
                        android: {
                            priority: 'high'
                        }
                    });
                    console.log(`FCM Data sent to admin ${admin.name}`);
                } catch (err) {
                    console.error(`Failed to FCM push to admin ${admin.name}`, err);
                }
            }
        }
        console.log(`Notified admins via Push`);
    } catch (error) {
        console.error('Error notifying admins:', error);
    }
};
