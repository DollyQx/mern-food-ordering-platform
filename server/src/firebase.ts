import admin from 'firebase-admin';
import path from 'path';

// Check if service account file exists, otherwise skip (to prevent crash)
// User must place 'service-account.json' in server root
let serviceAccount: any;

// 1. Try reading from Environment Variable (Best for Render/Production)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
        console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT env var");
    }
}

// 2. Fallback to File (Local Development)
if (!serviceAccount) {
    try {
        serviceAccount = require(path.join(__dirname, '../../service-account.json'));
    } catch (e) {
        console.warn("⚠️ Firebase Service Account Key not found. FCM will not work.");
    }
}

if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Admin Initialized");
}

export const messaging = serviceAccount ? admin.messaging() : null;
