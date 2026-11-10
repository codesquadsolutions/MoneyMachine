import { getApp } from "firebase/app";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { firebaseReady } from "../firebase";

let functions = null;

export function affiliateFunctions() {
  if (!firebaseReady) return null;
  if (!functions) {
    const app = getApp();
    functions = getFunctions(app, "us-central1");
    if (import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === "true") {
      connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    }
  }
  return functions;
}

export async function callAffiliate(name, data = {}) {
  const fn = affiliateFunctions();
  if (!fn) throw new Error("Firebase is not configured.");
  const callable = httpsCallable(fn, name);
  const result = await callable(data);
  return result.data;
}
