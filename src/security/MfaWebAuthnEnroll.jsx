import React, { useState } from "react";
import api from "../utils/ApiClient";
import { b64uToBytes, bytesToB64u } from "./webauthn-b64";

export default function MfaWebAuthnEnroll({ onDone, preAuthToken }) {
  const [error, setError] = useState("");

  const enroll = async () => {
    try {
      setError("");
      // BEGIN register
      if (!preAuthToken) throw new Error("Missing preAuthToken");
      const { data: opt } = await api.post(
        "/auth/mfa/webauthn/register/begin",
        {},
        { headers: { Authorization: `Bearer ${preAuthToken}` } }
      );
      const publicKey = {
        rp: { id: opt.rpId, name: opt.rpName },
        user: {
          id: b64uToBytes(opt.userIdB64),
          name: opt.userName,
          displayName: opt.displayName,
        },
        challenge: b64uToBytes(opt.challengeB64),
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        timeout: 60000,
        attestation: opt.attestation || "none",
        authenticatorSelection: {
          residentKey: opt.residentKey || "preferred",
          userVerification: opt.userVerification || "preferred",
        },
        excludeCredentials: (opt.excludeCredentialIdsB64 || []).map(id => ({
          type: "public-key", id: b64uToBytes(id),
        })),
      };

      const cred = await navigator.credentials.create({ publicKey });

      await api.post("/auth/mfa/webauthn/register/finish", {
        credentialIdB64: bytesToB64u(cred.rawId),
        attestationObjectB64: bytesToB64u(new Uint8Array(cred.response.attestationObject)),
        clientDataJSONB64: bytesToB64u(new Uint8Array(cred.response.clientDataJSON)),
      },{ headers: { Authorization: `Bearer ${preAuthToken}` } });

      onDone?.();
    } catch (e) {
      console.error(e);
      setError("Passkey enrollment failed on this device. Try again or use another device.");
    }
  };

  return (
    <div className="space-y-3">
      {error && <div className="text-red-600">{error}</div>}
      <button onClick={enroll} className="px-4 py-2 rounded bg-blue-600 text-white">
        Enroll a Passkey
      </button>
      <p className="text-sm text-gray-600">
        Adds a passkey using your device’s secure authenticator.
      </p>
    </div>
  );
}
