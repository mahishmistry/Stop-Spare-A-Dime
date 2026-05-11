const admin = require("firebase-admin");

try {
  const serviceAccount = require("./serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (error) {
  console.warn("⚠️  Firebase initialization failed (local dev mode).");
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: "stop-spare-a-dime-dev",
    });
  }
}

module.exports = admin;
