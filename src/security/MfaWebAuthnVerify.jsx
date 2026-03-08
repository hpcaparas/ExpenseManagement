import React, { useState } from "react";
import api from "../utils/ApiClient";
import { b64uToBytes, bytesToB64u } from "./webauthn-b64";

export default function MfaWebAuthnVerify({ onSuccess, preAuthToken }) {
  const [error, setError] = useState("");

  const verify = async () => {
    try {
      setError("");
      // BEGIN: get challenge + allowCredentials
      const { data: opt } = await api.post(
        "/auth/mfa/webauthn/auth/begin",
        {},
        { headers: { Authorization: `Bearer ${preAuthToken}` } }
      );

      const publicKey = {
        rpId: opt.rpId,
        challenge: b64uToBytes(opt.challengeB64),
        allowCredentials: (opt.allowCredentialIdsB64 || []).map(id => ({
          type: "public-key",
          id: b64uToBytes(id),
        })),
        userVerification: opt.userVerification || "preferred",
        timeout: 60000,
      };

      // BROWSER PROMPT
      const assertion = await navigator.credentials.get({ publicKey });

      // FINISH: send assertion
      const resp = await api.post(
        "/auth/mfa/webauthn/auth/finish",
        {
          credentialIdB64: bytesToB64u(assertion.rawId),
          clientDataJSONB64: bytesToB64u(new Uint8Array(assertion.response.clientDataJSON)),
          authenticatorDataB64: bytesToB64u(new Uint8Array(assertion.response.authenticatorData)),
          signatureB64: bytesToB64u(new Uint8Array(assertion.response.signature)),
          userHandleB64: assertion.response.userHandle
            ? bytesToB64u(new Uint8Array(assertion.response.userHandle))
            : null,
        },
        { headers: { Authorization: `Bearer ${preAuthToken}` } }
      );
      const { id, accessToken, refreshToken, name, email, roles, company, profilePicture } = resp.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userId", id);
      localStorage.setItem("user", JSON.stringify({ id, name, email, roles, company, profilePicture }));

      // Backend should now respond (or next call) with normal access/refresh tokens.
      onSuccess?.();
    } catch (e) {
      console.error(e);
      setError("Passkey verification failed. Try again or use another method.");
    }
  };

  return (
    <div className="space-y-3">
      {error && <div className="text-red-600">{error}</div>}
      <button onClick={verify} className="w-full py-2 rounded bg-blue-600 text-white">
        Verify with Passkey
      </button>
      <p className="text-sm text-gray-600">
        Use Windows Hello, Touch ID, or a security key.
      </p>
    </div>
  );
}
