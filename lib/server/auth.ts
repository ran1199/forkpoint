// Password gate for the live version (D10). Checked on the server only.
// The cookie never holds the password itself: it holds a fingerprint derived
// from it, so changing FORKPOINT_PASSWORD locks out every old cookie.
// (No "server-only" import here: the proxy, which also uses this file, can't load it.)

import { createHmac, timingSafeEqual } from "node:crypto";

export const UNLOCK_COOKIE = "forkpoint_unlock";

function fingerprint(password: string) {
  return createHmac("sha256", password).update("forkpoint-live-v1").digest("hex");
}

function sameText(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function passwordIsSet() {
  return Boolean(process.env.FORKPOINT_PASSWORD);
}

/** The cookie value to hand out once the password is right, or null if it's wrong. */
export function tokenForPassword(attempt: string): string | null {
  const password = process.env.FORKPOINT_PASSWORD;
  if (!password) return null;
  return sameText(fingerprint(attempt), fingerprint(password)) ? fingerprint(password) : null;
}

/** True if the request's cookie proves the password was entered. */
export function isUnlocked(cookieValue: string | undefined) {
  const password = process.env.FORKPOINT_PASSWORD;
  if (!password || !cookieValue) return false;
  return sameText(cookieValue, fingerprint(password));
}
