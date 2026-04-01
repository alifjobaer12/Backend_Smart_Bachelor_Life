const firebaseAdmin = require("firebase-admin");

const envConfig = require("./env.config");

// Initialize Firebase Admin SDK
try {
	firebaseAdmin.initializeApp({
		credential: firebaseAdmin.credential.cert({
			projectId: envConfig.FIREBASE_PROJECT_ID,
			clientEmail: envConfig.FIREBASE_CLIENT_EMAIL,
			privateKey: envConfig.FIREBASE_PRIVATE_KEY,
		}),
	});
	console.log("✔️  Firebase connected successfully");
} catch (error) {
	console.error("Firebase connection failed:", error);
}

module.exports = firebaseAdmin;