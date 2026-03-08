import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import MfaWebAuthnVerify from "../security/MfaWebAuthnVerify";
import MfaWebAuthnEnroll from "../security/MfaWebAuthnEnroll";
import config from "../config/config";
import loginBg from "../images/ExpenseManagement_BGOnly2.png";

const METHOD = {
  PASSKEY: "webauthn",
  EMAIL: "email",
  TOTP: "totp",
};

export default function MfaChallenge() {
  const nav = useNavigate();
  const loc = useLocation();

  const initial = loc.state || {};

  const [methods, setMethods] = useState(
    initial.methods || JSON.parse(sessionStorage.getItem("mfa_methods") || "[]")
  );
  const [preAuthToken, setPreAuthToken] = useState(
    initial.preAuthToken || sessionStorage.getItem("mfa_preAuth") || ""
  );
  const [hasTotp, setHasTotp] = useState(
    initial.hasTotp ??
      (sessionStorage.getItem("mfa_hasTotp") === "true"
        ? true
        : sessionStorage.getItem("mfa_hasTotp") === "false"
        ? false
        : null)
  );

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [selectedMethod, setSelectedMethod] = useState(null);

  // Email
  const [maskedEmail, setMaskedEmail] = useState(null);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailCode, setEmailCode] = useState("");

  // TOTP
  const [totpBegin, setTotpBegin] = useState(null);
  const [totpCode, setTotpCode] = useState("");

  const mode = loc.state?.mode || sessionStorage.getItem("mfa_mode") || "verify";

  useEffect(() => {
    if (loc.state?.mode) sessionStorage.setItem("mfa_mode", loc.state.mode);
    if (loc.state?.methods) {
      sessionStorage.setItem("mfa_methods", JSON.stringify(loc.state.methods));
    }
    if (loc.state?.preAuthToken) {
      sessionStorage.setItem("mfa_preAuth", loc.state.preAuthToken);
    }

    if (typeof loc.state?.hasTotp === "boolean") {
      sessionStorage.setItem("mfa_hasTotp", String(loc.state.hasTotp));
    }
  }, [loc.state]);

  useEffect(() => {
    if (!methods?.length) return;
    if (methods.length === 1) {
      setSelectedMethod(methods[0]);
    }
  }, [methods]);

  const busy = loading || sending || verifying;

  const supportsPasskey = methods.includes(METHOD.PASSKEY);
  const supportsEmail = methods.includes(METHOD.EMAIL);
  const supportsTotp = methods.includes(METHOD.TOTP);

  const needsTotpEnroll = useMemo(() => {
    return supportsTotp && hasTotp === false;
  }, [supportsTotp, hasTotp]);

  const cleanupMfaSession = () => {
    sessionStorage.removeItem("mfa_methods");
    sessionStorage.removeItem("mfa_preAuth");
    sessionStorage.removeItem("mfa_mode");
    sessionStorage.removeItem("mfa_hasTotp");
  };

  const saveAuthResponseIfPresent = (data) => {
    if (!data) return;

    if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
    if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
    if (data.id) localStorage.setItem("userId", data.id);

    if (data.name || data.email || data.roles || data.company || data.profilePicture) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          name: data.name,
          email: data.email,
          roles: data.roles,
          company: data.company,
          profilePicture: data.profilePicture,
        })
      );
    }
  };

  const finishLoginFromAuthResponse = (data) => {
    saveAuthResponseIfPresent(data);
    cleanupMfaSession();
    nav("/dashboard", { replace: true });
  };

  const clearError = () => {
    if (error) setError("");
  };

  const backToMethodSelection = () => {
    setSelectedMethod(null);
    setError("");
    setLoading(false);
    setSending(false);
    setVerifying(false);
  };

  const goBackToLogin = () => {
    cleanupMfaSession();
    nav("/", { replace: true });
  };

  // ---------------- EMAIL ----------------
  const handleSendEmailCode = async () => {
    setSending(true);
    setError("");
    setEmailCodeSent(false);
    setMaskedEmail(null);
    setEmailCode("");

    try {
      const resp = await axios.post(
        `${config.apiBaseUrl}/auth/mfa/email/send`,
        {},
        {
          headers: {
            Authorization: `Bearer ${preAuthToken}`,
          },
        }
      );

      setMaskedEmail(resp.data?.emailMasked || null);
      setEmailCodeSent(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to send email code."
      );
    } finally {
      setSending(false);
    }
  };

  const handleVerifyEmail = async () => {
    const code = emailCode.trim();

    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const resp = await axios.post(
        `${config.apiBaseUrl}/auth/mfa/email/verify`,
        { code },
        {
          headers: {
            Authorization: `Bearer ${preAuthToken}`,
          },
        }
      );

      finishLoginFromAuthResponse(resp.data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Email verification failed."
      );
    } finally {
      setVerifying(false);
    }
  };

  // ---------------- TOTP ----------------
  const handleTotpBeginEnroll = async () => {
    setLoading(true);
    setError("");

    try {
      const resp = await axios.post(
        `${config.apiBaseUrl}/auth/mfa/totp/enroll/begin`,
        {},
        {
          headers: {
            Authorization: `Bearer ${preAuthToken}`,
          },
        }
      );

      setTotpBegin(resp.data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to start TOTP setup."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTotpFinishEnrollAndVerify = async () => {
    const code = totpCode.trim();

    if (code.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post(
        `${config.apiBaseUrl}/auth/mfa/totp/enroll/finish`,
        { code },
        {
          headers: {
            Authorization: `Bearer ${preAuthToken}`,
          },
        }
      );

      const verifyResp = await axios.post(
        `${config.apiBaseUrl}/auth/mfa/totp/verify`,
        { code },
        {
          headers: {
            Authorization: `Bearer ${preAuthToken}`,
          },
        }
      );

      finishLoginFromAuthResponse(verifyResp.data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "TOTP setup failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTotpVerifyOnly = async () => {
    const code = totpCode.trim();

    if (code.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const resp = await axios.post(
        `${config.apiBaseUrl}/auth/mfa/totp/verify`,
        { code },
        {
          headers: {
            Authorization: `Bearer ${preAuthToken}`,
          },
        }
      );

      finishLoginFromAuthResponse(resp.data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "TOTP verification failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError("Unable to copy to clipboard.");
    }
  };

  const getStepTitle = () => {
    switch (selectedMethod) {
      case METHOD.PASSKEY:
        return "Verify with passkey";
      case METHOD.EMAIL:
        return "Verify with email";
      case METHOD.TOTP:
        return needsTotpEnroll ? "Set up authenticator" : "Verify with authenticator";
      default:
        return "Secure verification";
    }
  };

  const getStepSubtitle = () => {
    switch (selectedMethod) {
      case METHOD.PASSKEY:
        return "Use your biometrics or device screen lock to continue.";
      case METHOD.EMAIL:
        return "We’ll send a one-time 6-digit code to your email.";
      case METHOD.TOTP:
        return needsTotpEnroll
          ? "Connect your authenticator app, then confirm using the generated code."
          : "Enter the current 6-digit code from your authenticator app.";
      default:
        return "Choose one trusted verification method to securely continue to your account.";
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center px-4 py-8"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="absolute inset-0 bg-slate-950/55 backdrop-[brightness(.8)]" />

      <div className="relative w-full max-w-2xl">
        <div className="rounded-[32px] border border-white/20 bg-white/12 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl overflow-hidden">
          <div className="border-b border-white/10 bg-white/10 px-6 py-5 md:px-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-50">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Protected verification
              </div>

              {selectedMethod && (
                <button
                  type="button"
                  onClick={busy ? undefined : backToMethodSelection}
                  disabled={busy}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/85 hover:bg-white/15 disabled:opacity-50"
                >
                  ← Back
                </button>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
              {selectedMethod ? getStepTitle() : "Verify it’s you"}
            </h1>

            <p className="mt-2 max-w-xl text-sm md:text-base leading-6 text-white/75">
              {selectedMethod ? getStepSubtitle() : getStepSubtitle()}
            </p>
          </div>

          <div className="px-6 py-6 md:px-8 md:py-8">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-500/10 px-4 py-3 text-red-50">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-lg">⚠️</div>
                  <div className="flex-1 text-sm leading-6">{error}</div>
                  <button
                    type="button"
                    onClick={() => setError("")}
                    className="text-red-100/80 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {busy && (
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/85">
                <div className="h-4 w-4 rounded-full border-2 border-white/25 border-t-white animate-spin" />
                <span>Processing your verification request...</span>
              </div>
            )}

            {!selectedMethod ? (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {supportsPasskey && (
                    <MethodChoiceCard
                      icon="🔐"
                      title="Passkey"
                      subtitle="Use Face ID, fingerprint, or device screen lock."
                      accent="from-violet-500/25 to-fuchsia-500/20"
                      onClick={busy ? undefined : () => setSelectedMethod(METHOD.PASSKEY)}
                    />
                  )}

                  {supportsEmail && (
                    <MethodChoiceCard
                      icon="📧"
                      title="Email OTP"
                      subtitle="Receive a one-time verification code in your email."
                      accent="from-blue-500/25 to-cyan-500/20"
                      onClick={busy ? undefined : () => setSelectedMethod(METHOD.EMAIL)}
                    />
                  )}

                  {supportsTotp && (
                    <MethodChoiceCard
                      icon="🛡️"
                      title="Authenticator app"
                      subtitle={
                        needsTotpEnroll
                          ? "Set up Google or Microsoft Authenticator first."
                          : "Use the 6-digit code from your authenticator app."
                      }
                      accent="from-emerald-500/25 to-teal-500/20"
                      badge={needsTotpEnroll ? "Setup required" : "Ready"}
                      onClick={busy ? undefined : () => setSelectedMethod(METHOD.TOTP)}
                    />
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75">
                  <div className="font-medium text-white mb-1">Why this step matters</div>
                  Multi-factor authentication adds an extra layer of protection to your
                  account and helps prevent unauthorized access.
                </div>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={busy ? undefined : goBackToLogin}
                    disabled={busy}
                    className="text-sm text-white/70 underline underline-offset-4 hover:text-white disabled:opacity-50"
                  >
                    Back to login
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {selectedMethod === METHOD.PASSKEY && (
                  <MfaCard
                    icon="🔐"
                    title="Passkey verification"
                    subtitle="Fastest and most secure option using your device credentials."
                    trailing={
                      <StatusPill label={mode === "enroll" ? "Enroll" : "Verify"} />
                    }
                  >
                    {mode === "enroll" ? (
                      <MfaWebAuthnEnroll
                        preAuthToken={preAuthToken}
                        onDone={finishLoginFromAuthResponse}
                        setExternalError={setError}
                      />
                    ) : (
                      <MfaWebAuthnVerify
                        preAuthToken={preAuthToken}
                        onSuccess={finishLoginFromAuthResponse}
                        setExternalError={setError}
                      />
                    )}
                  </MfaCard>
                )}

                {selectedMethod === METHOD.EMAIL && (
                  <MfaCard
                    icon="📧"
                    title="Email verification"
                    subtitle={
                      maskedEmail
                        ? `Your code will be sent to ${maskedEmail}`
                        : "Request a one-time code to continue."
                    }
                    trailing={emailCodeSent ? <StatusPill label="Code sent" tone="success" /> : null}
                  >
                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={handleSendEmailCode}
                        disabled={busy && !sending}
                        className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-medium text-white shadow-lg shadow-blue-900/30 transition hover:scale-[1.01] hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
                      >
                        {sending ? "Sending..." : emailCodeSent ? "Resend code" : "Send code"}
                      </button>

                      {emailCodeSent && (
                        <>
                          <FieldLabel label="Email code" helper="Enter the 6-digit code from your inbox." />
                          <PremiumInput
                            value={emailCode}
                            onChange={(e) => {
                              setEmailCode(e.target.value.replace(/\D/g, ""));
                              clearError();
                            }}
                            placeholder="Enter the 6-digit code"
                            maxLength={6}
                          />

                          <button
                            type="button"
                            onClick={handleVerifyEmail}
                            disabled={verifying}
                            className="w-full rounded-2xl bg-white text-slate-900 px-4 py-3 font-semibold transition hover:bg-slate-100 disabled:opacity-50"
                          >
                            {verifying ? "Verifying..." : "Verify & continue"}
                          </button>
                        </>
                      )}
                    </div>
                  </MfaCard>
                )}

                {selectedMethod === METHOD.TOTP && (
                  <MfaCard
                    icon="🛡️"
                    title="Authenticator app"
                    subtitle={
                      needsTotpEnroll
                        ? "Set up your authenticator app to generate secure time-based codes."
                        : "Enter the current 6-digit code from your authenticator app."
                    }
                    trailing={
                      <StatusPill
                        label={needsTotpEnroll ? "Setup" : "Ready"}
                        tone={needsTotpEnroll ? "warning" : "default"}
                      />
                    }
                  >
                    <div className="space-y-4">
                      {needsTotpEnroll ? (
                        !totpBegin ? (
                          <button
                            type="button"
                            onClick={handleTotpBeginEnroll}
                            disabled={busy}
                            className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 font-medium text-white shadow-lg shadow-emerald-900/25 transition hover:scale-[1.01] hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
                          >
                            Start setup
                          </button>
                        ) : (
                          <>
                            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                              <FieldLabel
                                label="Secret key (Base32)"
                                helper="Add this secret to your authenticator app if QR setup is not available."
                              />
                              <div className="mt-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm break-all text-white/90">
                                {totpBegin.secretB32}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => copyToClipboard(totpBegin.secretB32)}
                              className="w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 font-medium text-white hover:bg-white/12"
                            >
                              Copy secret
                            </button>

                            <div>
                              <FieldLabel
                                label="Authenticator code"
                                helper="Enter the 6-digit code currently shown in your app."
                              />
                              <PremiumInput
                                value={totpCode}
                                onChange={(e) => {
                                  setTotpCode(e.target.value.replace(/\D/g, ""));
                                  clearError();
                                }}
                                placeholder="Enter the code from your app"
                                maxLength={6}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={handleTotpFinishEnrollAndVerify}
                              disabled={busy}
                              className="w-full rounded-2xl bg-white text-slate-900 px-4 py-3 font-semibold transition hover:bg-slate-100 disabled:opacity-50"
                            >
                              Confirm & continue
                            </button>
                          </>
                        )
                      ) : (
                        <>
                          <div>
                            <FieldLabel
                              label="Authenticator code"
                              helper="Use the current 6-digit code from Google Authenticator, Microsoft Authenticator, or similar."
                            />
                            <PremiumInput
                              value={totpCode}
                              onChange={(e) => {
                                setTotpCode(e.target.value.replace(/\D/g, ""));
                                clearError();
                              }}
                              placeholder="Enter the 6-digit code"
                              maxLength={6}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleTotpVerifyOnly}
                            disabled={busy}
                            className="w-full rounded-2xl bg-white text-slate-900 px-4 py-3 font-semibold transition hover:bg-slate-100 disabled:opacity-50"
                          >
                            Verify & continue
                          </button>
                        </>
                      )}
                    </div>
                  </MfaCard>
                )}

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
                  <div className="font-medium text-white mb-1">Security notice</div>
                  Never share your verification code with anyone. Our team will never ask for it.
                </div>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={busy ? undefined : backToMethodSelection}
                    disabled={busy}
                    className="text-sm text-white/70 underline underline-offset-4 hover:text-white disabled:opacity-50"
                  >
                    Choose another method
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MethodChoiceCard({ icon, title, subtitle, onClick, accent, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/8 p-4 text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/12 hover:shadow-2xl"
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${accent || "from-white/5 to-white/0"} opacity-100`} />
      <div className="relative flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/15 text-2xl shadow-inner">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-white text-base md:text-lg">{title}</div>
            {badge ? (
              <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/85">
                {badge}
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-sm leading-5 text-white/70">{subtitle}</div>
        </div>

        <div className="text-white/45 text-2xl transition group-hover:translate-x-1 group-hover:text-white/80">
          ›
        </div>
      </div>
    </button>
  );
}

function MfaCard({ icon, title, subtitle, trailing, children }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/8 p-5 md:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/12 text-xl">
          {icon}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {trailing}
          </div>
          <p className="mt-1 text-sm leading-6 text-white/70">{subtitle}</p>
        </div>
      </div>

      <div className="mt-5">{children}</div>
    </div>
  );
}

function FieldLabel({ label, helper }) {
  return (
    <div>
      <label className="block text-sm font-medium text-white">{label}</label>
      {helper ? <p className="mt-1 text-xs text-white/60">{helper}</p> : null}
    </div>
  );
}

function PremiumInput({ value, onChange, placeholder, maxLength }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={maxLength}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="mt-2 w-full rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 outline-none transition focus:border-blue-300/40 focus:bg-black/25 focus:ring-4 focus:ring-blue-400/10"
    />
  );
}

function StatusPill({ label, tone = "default" }) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-400/15 text-emerald-100 border-emerald-300/20"
      : tone === "warning"
      ? "bg-amber-400/15 text-amber-100 border-amber-300/20"
      : "bg-white/10 text-white/85 border-white/10";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneClass}`}>
      {label}
    </span>
  );
}