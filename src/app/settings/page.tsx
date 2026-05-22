"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://loan-recovery-api.onrender.com";

interface Settings {
  bank_name: string;
  bank_logo_url: string;
  timezone: string;
  human_agent_number: string;
  max_calls_per_day: number;
  call_start_hour: number;
  call_end_hour: number;
  default_language: string;
  bypass_compliance: boolean;
  prohibited_phrases: string[];
  razorpay_enabled: boolean;
  whatsapp_enabled: boolean;
}

interface ApiKeyStatus {
  groq: boolean;
  sarvam: boolean;
  twilio: boolean;
  deepgram: boolean;
  razorpay: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  bank_name: "Faiz Finance Ltd",
  bank_logo_url: "",
  timezone: "Asia/Kolkata",
  human_agent_number: "",
  max_calls_per_day: 3,
  call_start_hour: 8,
  call_end_hour: 19,
  default_language: "hi",
  bypass_compliance: false,
  prohibited_phrases: ["dhamki", "ghar aayenge", "police", "arrest"],
  razorpay_enabled: false,
  whatsapp_enabled: false,
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [apiKeys, setApiKeys] = useState<ApiKeyStatus>({
    groq: false,
    sarvam: false,
    twilio: false,
    deepgram: false,
    razorpay: false,
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [loading, setLoading] = useState(true);
  const [newPhrase, setNewPhrase] = useState("");
  const [activeSection, setActiveSection] = useState("bank");

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        setApiKeys(data.api_key_status || apiKeys);
      }
    } catch {
      // Fallback: load from localStorage
      const saved = localStorage.getItem("priyaai_settings");
      if (saved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        localStorage.setItem("priyaai_settings", JSON.stringify(settings));
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        throw new Error("API error");
      }
    } catch {
      // Save to localStorage as fallback
      localStorage.setItem("priyaai_settings", JSON.stringify(settings));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const addPhrase = () => {
    const phrase = newPhrase.trim().toLowerCase();
    if (phrase && !settings.prohibited_phrases.includes(phrase)) {
      setSettings((s) => ({
        ...s,
        prohibited_phrases: [...s.prohibited_phrases, phrase],
      }));
      setNewPhrase("");
    }
  };

  const removePhrase = (phrase: string) => {
    setSettings((s) => ({
      ...s,
      prohibited_phrases: s.prohibited_phrases.filter((p) => p !== phrase),
    }));
  };

  const sections = [
    { id: "bank", label: "Bank profile", icon: "🏦" },
    { id: "calls", label: "Call config", icon: "📞" },
    { id: "compliance", label: "Compliance", icon: "⚖️" },
    { id: "keys", label: "API keys", icon: "🔑" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure PriyaAI for your bank
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            saveStatus === "saved"
              ? "bg-green-600 text-white"
              : saveStatus === "error"
              ? "bg-red-600 text-white"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {saveStatus === "saving"
            ? "Saving..."
            : saveStatus === "saved"
            ? "✓ Saved"
            : saveStatus === "error"
            ? "Error — retry"
            : "Save changes"}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav className="w-44 shrink-0">
          <ul className="space-y-1">
            {sections.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2.5 ${
                    activeSection === s.id
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>{s.icon}</span>
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {/* ── BANK PROFILE ── */}
          {activeSection === "bank" && (
            <Section title="Bank profile" description="Identity shown to borrowers during calls and in reports.">
              <Field label="Bank name">
                <input
                  type="text"
                  value={settings.bank_name}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, bank_name: e.target.value }))
                  }
                  placeholder="e.g. Faiz Finance Ltd"
                  className="input-field"
                />
              </Field>

              <Field label="Logo URL" hint="Shown on PDF reports (optional)">
                <input
                  type="url"
                  value={settings.bank_logo_url}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, bank_logo_url: e.target.value }))
                  }
                  placeholder="https://..."
                  className="input-field"
                />
              </Field>

              <Field label="Timezone">
                <select
                  value={settings.timezone}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, timezone: e.target.value }))
                  }
                  className="input-field"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </Field>

              <Field label="Default language">
                <select
                  value={settings.default_language}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      default_language: e.target.value,
                    }))
                  }
                  className="input-field"
                >
                  <option value="hi">Hindi</option>
                  <option value="en">English</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                  <option value="mr">Marathi</option>
                  <option value="bn">Bengali</option>
                  <option value="gu">Gujarati</option>
                  <option value="kn">Kannada</option>
                </select>
              </Field>
            </Section>
          )}

          {/* ── CALL CONFIG ── */}
          {activeSection === "calls" && (
            <Section title="Call configuration" description="Control how PriyaAI places and manages calls.">
              <Field label="Human agent number" hint="When borrower requests human escalation, Twilio transfers here">
                <input
                  type="tel"
                  value={settings.human_agent_number}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      human_agent_number: e.target.value,
                    }))
                  }
                  placeholder="+919876543210"
                  className="input-field"
                />
              </Field>

              <Field label="Max calls per borrower per day">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={1}
                    value={settings.max_calls_per_day}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        max_calls_per_day: Number(e.target.value),
                      }))
                    }
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-6 text-center">
                    {settings.max_calls_per_day}
                  </span>
                  <span className="text-xs text-gray-500">(RBI max: 3)</span>
                </div>
              </Field>

              <Field label="Calling hours (24h)">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500">Start</label>
                    <select
                      value={settings.call_start_hour}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          call_start_hour: Number(e.target.value),
                        }))
                      }
                      className="input-field w-24"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-gray-400">→</span>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500">End</label>
                    <select
                      value={settings.call_end_hour}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          call_end_hour: Number(e.target.value),
                        }))
                      }
                      className="input-field w-24"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  RBI mandates 08:00–19:00 IST
                </p>
              </Field>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <Toggle
                  label="Razorpay payment links"
                  description="Send payment link via SMS after promise-to-pay detected"
                  checked={settings.razorpay_enabled}
                  onChange={(v) =>
                    setSettings((s) => ({ ...s, razorpay_enabled: v }))
                  }
                />
                <Toggle
                  label="WhatsApp follow-up"
                  description="Send WhatsApp message after call completion"
                  checked={settings.whatsapp_enabled}
                  onChange={(v) =>
                    setSettings((s) => ({ ...s, whatsapp_enabled: v }))
                  }
                />
              </div>
            </Section>
          )}

          {/* ── COMPLIANCE ── */}
          {activeSection === "compliance" && (
            <Section title="Compliance" description="RBI debt recovery guidelines enforcement.">
              <div className="mb-4">
                <Toggle
                  label="Bypass compliance checks"
                  description="Disables time-of-day restriction and call limits — for testing only"
                  checked={settings.bypass_compliance}
                  onChange={(v) =>
                    setSettings((s) => ({ ...s, bypass_compliance: v }))
                  }
                  danger
                />
                {settings.bypass_compliance && (
                  <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    ⚠️ Compliance bypass is ON. Disable before going live with real borrowers.
                  </div>
                )}
              </div>

              <Field
                label="Prohibited phrases"
                hint="PriyaAI filters these from AI responses in real time"
              >
                <div className="flex flex-wrap gap-2 mb-3">
                  {settings.prohibited_phrases.map((phrase) => (
                    <span
                      key={phrase}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs rounded-full border border-red-200"
                    >
                      {phrase}
                      <button
                        onClick={() => removePhrase(phrase)}
                        className="hover:text-red-900 ml-0.5"
                        aria-label={`Remove ${phrase}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPhrase}
                    onChange={(e) => setNewPhrase(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addPhrase()}
                    placeholder="Add phrase and press Enter"
                    className="input-field flex-1"
                  />
                  <button
                    onClick={addPhrase}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
              </Field>
            </Section>
          )}

          {/* ── API KEYS ── */}
          {activeSection === "keys" && (
            <Section
              title="API key status"
              description="Keys are configured via environment variables on Render. This panel shows their status."
            >
              <div className="space-y-3">
                <KeyRow
                  name="Groq (LLM)"
                  description="Llama 3.3 70B — AI conversation engine"
                  configured={apiKeys.groq}
                  envVar="GROQ_API_KEY"
                />
                <KeyRow
                  name="Sarvam AI (TTS)"
                  description="Hindi/Indian language text-to-speech"
                  configured={apiKeys.sarvam}
                  envVar="SARVAM_API_KEY"
                />
                <KeyRow
                  name="Twilio"
                  description="Outbound voice calling"
                  configured={apiKeys.twilio}
                  envVar="TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN"
                />
                <KeyRow
                  name="Deepgram (STT)"
                  description="Speech-to-text — needed for live 2-way calls"
                  configured={apiKeys.deepgram}
                  envVar="DEEPGRAM_API_KEY"
                  warning={!apiKeys.deepgram}
                />
                <KeyRow
                  name="Razorpay"
                  description="Payment links via SMS after promise-to-pay"
                  configured={apiKeys.razorpay}
                  envVar="RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET"
                />
              </div>

              <div className="mt-5 p-4 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-1">
                <p className="font-medium text-gray-700">How to update keys:</p>
                <p>1. Go to your Render dashboard → PriyaAI backend service</p>
                <p>2. Click <strong>Environment</strong> → edit the variable</p>
                <p>3. Render will auto-redeploy with the new key</p>
              </div>
            </Section>
          )}
        </div>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          background: white;
          color: #111827;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-field:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        select.input-field {
          appearance: auto;
        }
      `}</style>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {hint && (
          <span className="font-normal text-gray-400 ml-1.5 text-xs">
            — {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  danger = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p
          className={`text-sm font-medium ${
            danger ? "text-amber-700" : "text-gray-900"
          }`}
        >
          {label}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 h-6 w-11 rounded-full transition-colors ${
          checked
            ? danger
              ? "bg-amber-500"
              : "bg-indigo-600"
            : "bg-gray-200"
        }`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function KeyRow({
  name,
  description,
  configured,
  envVar,
  warning = false,
}: {
  name: string;
  description: string;
  configured: boolean;
  envVar: string;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-500">{description}</p>
        <code className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
          {envVar}
        </code>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium ${
            configured
              ? "bg-green-50 text-green-700 border border-green-200"
              : warning
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-gray-50 text-gray-500 border border-gray-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              configured
                ? "bg-green-500"
                : warning
                ? "bg-amber-500"
                : "bg-gray-400"
            }`}
          />
          {configured ? "Configured" : "Not set"}
        </span>
      </div>
    </div>
  );
}
