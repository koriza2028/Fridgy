/* global fetch */
// Firebase Functions v2 (ESM)
import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { defineSecret, defineString } from "firebase-functions/params";

// Firebase Admin (modular)
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

// ---- Global options (pick your region) --------------------------------
setGlobalOptions({ region: "europe-west3", maxInstances: 10 });

// ---- Admin init -------------------------------------------------------
if (!getApps().length) initializeApp();
const db = getFirestore();

// ---- Config (no functions.config()) -----------------------------------
const RC_API_KEY = defineSecret("REVENUECAT_API_KEY");                 // set with: firebase functions:secrets:set REVENUECAT_API_KEY
const RC_ENTITLEMENT_ID = defineString("RC_ENTITLEMENT_ID", { default: "Pro" });

// ---- Helpers ----------------------------------------------------------
function pick(obj, keys) {
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (obj && Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) return obj[k];
  }
  return undefined;
}

function normalizeEvent(payload) {
  const evt = (payload && typeof payload.event === "object") ? payload.event : payload;
  const type = pick(evt, ["type", "event_type"]) || "UNKNOWN";
  const appUserId = pick(evt, ["app_user_id", "appUserId", "app_userID"]);
  const entitlementId =
    pick(evt, ["entitlement_id"]) ||
    (Array.isArray(evt && evt.entitlement_ids) ? evt.entitlement_ids[0] : undefined);
  const expirationMs = pick(evt, ["expiration_at_ms", "expirationAtMs", "expiration_ms", "expires_at_ms"]);
  return {
    type,
    appUserId,
    entitlementId,
    expirationMs: typeof expirationMs === "number" ? expirationMs : undefined,
    raw: evt,
  };
}

function computePremiumState({ type, expirationMs }) {
  let premiumUntilTs = null;
  if (typeof expirationMs === "number" && expirationMs > 0) premiumUntilTs = Timestamp.fromMillis(expirationMs);
  const nowMs = Date.now();
  const activeFromUntil = premiumUntilTs ? expirationMs > nowMs : undefined;

  let premiumActive;
  if (typeof activeFromUntil === "boolean") {
    premiumActive = activeFromUntil;
  } else {
    premiumActive = ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION"].includes(type);
  }
  if (type === "EXPIRATION") {
    premiumActive = false;
    premiumUntilTs = null;
  }
  return { premiumActive, premiumUntilTs };
}

// ---- Canary -----------------------------------------------------------
export const ping = onRequest((_, res) => res.status(200).send("ok"));

// ---- Webhook: RevenueCat → families/{familyId} -----------------------
export const revenuecatWebhook = onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.set("Allow", "POST");
      return res.status(405).send("Method Not Allowed");
    }

    const targetEntitlement = RC_ENTITLEMENT_ID.value() || "Pro";
    const { type, appUserId, entitlementId, expirationMs, raw } = normalizeEvent(req.body || {});
    console.log("[RC] Event:", { type, appUserId, entitlementId, expirationMs, targetEntitlement });

    if (!appUserId) return res.status(200).send("Ignored: missing user");

    const isTarget =
      entitlementId === targetEntitlement ||
      (Array.isArray(raw && raw.entitlement_ids) && raw.entitlement_ids.includes(targetEntitlement));
    if (!isTarget) return res.status(200).send("Ignored: not target entitlement");

    const userSnap = await db.doc(`users/${appUserId}`).get();
    if (!userSnap.exists) return res.status(200).send("Ignored: user not found");

    const familyId = userSnap.data()?.familyId;
    if (!familyId) return res.status(200).send("OK"); // personal premium only

    const { premiumActive, premiumUntilTs } = computePremiumState({ type, expirationMs });

    await db.doc(`families/${familyId}`).set(
      {
        premiumOwner: appUserId,
        premiumActive: !!premiumActive,
        premiumUpdatedAt: FieldValue.serverTimestamp(),
        premiumUntil: premiumUntilTs ? premiumUntilTs : FieldValue.delete(),
      },
      { merge: true }
    );

    return res.status(200).send("OK");
  } catch (err) {
    console.error("[RC] Webhook error:", err);
    return res.status(500).send("Internal error");
  }
});

// ---- Callable: manual sync (any family member can call) ---------------
export const syncFamilyPremium = onCall({ secrets: [RC_API_KEY] }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login required.");
  const callerId = req.auth.uid;
  const reqFamilyId = typeof req.data?.familyId === "string" ? req.data.familyId : null;

  // caller -> familyId
  const userSnap = await db.doc(`users/${callerId}`).get();
  if (!userSnap.exists) throw new HttpsError("not-found", "User not found.");
  const familyId = userSnap.data()?.familyId;
  if (!familyId) throw new HttpsError("failed-precondition", "User has no family.");
  if (reqFamilyId && reqFamilyId !== familyId) throw new HttpsError("permission-denied", "Family mismatch.");

  // family -> ownerId
  const famSnap = await db.doc(`families/${familyId}`).get();
  if (!famSnap.exists) throw new HttpsError("not-found", "Family not found.");
  const fam = famSnap.data() || {};
  const ownerId = fam.createdBy || fam.premiumOwner || callerId; // prefer createdBy

const apiKey = RC_API_KEY.value();
console.log("[sync] region:", process.env.FUNCTION_REGION);
console.log("[sync] key prefix:", apiKey ? apiKey.slice(0, 3) : "none"); // should be "sk_"
  const entitlement = RC_ENTITLEMENT_ID.value() || "Pro";

  const hit = async (appUserId) => {
    const url = `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}`, "X-Platform": "ios" } });
    const text = await resp.text().catch(() => "");
    console.log("RC GET", resp.status, appUserId, text.slice(0, 400));

    return { resp, text };
  };

  // 1st attempt: owner uid
  let { resp, text } = await hit(ownerId);

  // Retry once for 429/5xx (transient)
  if (resp.status === 429 || (resp.status >= 500 && resp.status < 600)) {
    await new Promise((r) => setTimeout(r, 800));
    ({ resp, text } = await hit(ownerId));
  }

  // Optional 2nd id attempt: saved anonymous RC id (if different)
  if (resp.status === 404 && rcFallbackId && rcFallbackId !== ownerId) {
    ({ resp, text } = await hit(rcFallbackId));
  }

  if (resp.status === 404) {
    // Owner not yet known under this id -> mark inactive, do NOT throw
    await db.doc(`families/${familyId}`).set({
      premiumOwner: ownerId,
      premiumActive: false,
      premiumUntil: FieldValue.delete(),
      premiumUpdatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return { ok: true, premiumActive: false, premiumUntilMs: null };
  }

  if (resp.status === 401) throw new HttpsError("failed-precondition", "RevenueCat unauthorized (check REST key).");
  if (!resp.ok) throw new HttpsError("internal", `RevenueCat error ${resp.status}: ${text.slice(0, 200)}`);

  const json = JSON.parse(text);
  const ent = json?.subscriber?.entitlements?.[entitlement];
  const isActive = !!ent?.active;
  const expiresMs = ent?.expires_date_ms ? Number(ent.expires_date_ms) : undefined;

  await db.doc(`families/${familyId}`).set({
    premiumOwner: ownerId,
    premiumActive: isActive,
    premiumUntil: (isActive && expiresMs) ? Timestamp.fromMillis(expiresMs) : FieldValue.delete(),
    premiumUpdatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return { ok: true, premiumActive: isActive, premiumUntilMs: expiresMs || null };
});
