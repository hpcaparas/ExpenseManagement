// base64url helpers for WebAuthn
export const b64uToBytes = (b64u) =>
  Uint8Array.from(atob(b64u.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

export const bytesToB64u = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
