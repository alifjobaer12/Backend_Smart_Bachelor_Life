const firebaseAdmin = require("firebase-admin");

const envConfig = require("./env.config");

// Initialize Firebase Admin SDK
firebaseAdmin.initializeApp({
	credential: firebaseAdmin.credential.cert({
		projectId: envConfig.FIREBASE_PROJECT_ID,
		clientEmail: envConfig.FIREBASE_CLIENT_EMAIL,
		privateKey: envConfig.FIREBASE_PRIVATE_KEY,
	}),
});

module.exports = firebaseAdmin;