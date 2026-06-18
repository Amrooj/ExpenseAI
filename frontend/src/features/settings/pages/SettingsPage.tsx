// ============================================================
// src/features/settings/pages/SettingsPage.tsx — User Settings
// ============================================================

import { useState } from "react";
import { useAuthStore } from "../../../store/authStore";
import api from "../../../api/client";
import toast from "react-hot-toast";

const CURRENCIES = [
  { code: "USD", symbol: "$",   name: "US Dollar" },
  { code: "EUR", symbol: "€",   name: "Euro" },
  { code: "GBP", symbol: "£",   name: "British Pound" },
  { code: "INR", symbol: "₹",   name: "Indian Rupee" },
  { code: "JPY", symbol: "¥",   name: "Japanese Yen" },
  { code: "CAD", symbol: "C$",  name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$",  name: "Australian Dollar" },
  { code: "SGD", symbol: "S$",  name: "Singapore Dollar" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "NGN", symbol: "₦",   name: "Nigerian Naira" },
  { code: "ZAR", symbol: "R",   name: "South African Rand" },
  { code: "BRL", symbol: "R$",  name: "Brazilian Real" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "CNY", symbol: "¥",   name: "Chinese Yuan" },
  { code: "KRW", symbol: "₩",   name: "South Korean Won" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (EST/EDT)" },
  { value: "America/Chicago", label: "Central Time (CST/CDT)" },
  { value: "America/Denver", label: "Mountain Time (MST/MDT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PST/PDT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Asia/Kolkata", label: "Kolkata (IST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
];

export default function SettingsPage() {
  const { user, updateProfile, isLoading } = useAuthStore();

  const [name,     setName]     = useState(user?.name     ?? "");
  const [currency, setCurrency] = useState(user?.defaultCurrency ?? "USD");
  const [timezone, setTimezone] = useState(user?.timezone ?? "UTC");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmNew,      setConfirmNew]      = useState("");
  const [pwLoading,       setPwLoading]       = useState(false);
  const [showPw,          setShowPw]          = useState(false);

  const profileDirty = name !== (user?.name ?? "") || 
                       currency !== (user?.defaultCurrency ?? "USD") ||
                       timezone !== (user?.timezone ?? "UTC");

  const handleSaveProfile = async () => {
    if (!profileDirty) return;
    await updateProfile({ name: name.trim() || undefined, defaultCurrency: currency, timezone });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNew) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast.error("Password must contain an uppercase letter");
      return;
    }
    if (!/\d/.test(newPassword)) {
      toast.error("Password must contain a number");
      return;
    }
    setPwLoading(true);
    try {
      await api.post("/api/auth/change-password", { currentPassword, newPassword });
      toast.success("Password changed successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmNew("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? "Failed to change password";
      toast.error(msg);
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-dark-muted mt-1">Manage your account preferences</p>
      </div>

      {/* Profile */}
      <div className="card p-6 space-y-5">
        <h3 className="text-lg font-semibold text-white">Profile</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-violet-600 rounded-2xl flex items-center justify-center flex-shrink-0 text-white text-2xl font-bold">
            {(name || user?.name || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <label className="block text-sm text-dark-muted mb-1">Display name</label>
            <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" maxLength={100} />
          </div>
        </div>
        <p className="text-xs text-dark-muted">
          Email: <span className="text-dark-text">{user?.email}</span>
          <span className="ml-2 opacity-50">(cannot be changed)</span>
        </p>
        <button onClick={handleSaveProfile} disabled={isLoading || !profileDirty} className="btn-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          {isLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving…</> : "Save Profile"}
        </button>
      </div>

      {/* Currency */}
      <div className="card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Default Currency</h3>
          <p className="text-xs text-dark-muted mt-0.5">Used to display all expense amounts</p>
        </div>
        <select className="input-field" value={currency} onChange={e => setCurrency(e.target.value)}>
          {CURRENCIES.map(({ code, symbol, name: n }) => (
            <option key={code} value={code}>{symbol} {code} — {n}</option>
          ))}
        </select>
        <button onClick={handleSaveProfile} disabled={isLoading || !profileDirty} className="btn-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          {isLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving…</> : "Save Currency"}
        </button>
      </div>

      {/* Timezone */}
      <div className="card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Timezone</h3>
          <p className="text-xs text-dark-muted mt-0.5">Used for date and time calculations</p>
        </div>
        <select className="input-field" value={timezone} onChange={e => setTimezone(e.target.value)}>
          {TIMEZONES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button onClick={handleSaveProfile} disabled={isLoading || !profileDirty} className="btn-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          {isLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving…</> : "Save Timezone"}
        </button>
      </div>

      {/* Change Password */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Change Password</h3>
            <p className="text-xs text-dark-muted mt-0.5">Keep your account secure</p>
          </div>
          <button onClick={() => setShowPw(v => !v)} className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
            {showPw ? "Cancel" : "Change"}
          </button>
        </div>
        {showPw && (
          <form onSubmit={handleChangePassword} className="space-y-3 animate-fade-in">
            <div>
              <label className="block text-sm text-dark-muted mb-1">Current Password</label>
              <input type="password" className="input-field" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm text-dark-muted mb-1">New Password</label>
              <input type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Min 8 chars, 1 uppercase, 1 number" />
            </div>
            <div>
              <label className="block text-sm text-dark-muted mb-1">Confirm New Password</label>
              <input type="password" className="input-field" value={confirmNew} onChange={e => setConfirmNew(e.target.value)} required placeholder="••••••••" />
            </div>
            <button type="submit" disabled={pwLoading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
              {pwLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Changing…</> : "Change Password"}
            </button>
          </form>
        )}
      </div>

      {/* Data Management */}
      <div className="card p-6 space-y-3">
        <h3 className="text-lg font-semibold text-white">Data Management</h3>
        <div className="flex items-center justify-between p-4 bg-dark-border/20 rounded-xl">
          <div>
            <p className="text-sm font-medium text-white">Export All Data</p>
            <p className="text-xs text-dark-muted">Download expenses as CSV from the Reports page</p>
          </div>
          <a href="/reports" className="px-4 py-2 rounded-lg text-sm border border-dark-border text-dark-muted hover:text-primary-400 hover:border-primary-500 transition-all">
            Go to Reports
          </a>
        </div>
        <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
          <div>
            <p className="text-sm font-medium text-red-400">Danger Zone</p>
            <p className="text-xs text-dark-muted">Contact support to delete your account and all data</p>
          </div>
        </div>
      </div>
    </div>
  );
}
