import fs from "node:fs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function loadCredential() {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) {
    return cert(JSON.parse(inline));
  }
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (path && fs.existsSync(path)) {
    return cert(JSON.parse(fs.readFileSync(path, "utf8")));
  }
  return undefined;
}

export function initFirebase() {
  if (getApps().length) return;
  const credential = loadCredential();
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "money-machine-247";
  if (credential) {
    initializeApp({ credential, projectId });
  } else {
    // ADC / metadata server (or emulator). Prefer a service account JSON on the VPS.
    initializeApp({ projectId });
  }
}

export { getAuth, getFirestore };
