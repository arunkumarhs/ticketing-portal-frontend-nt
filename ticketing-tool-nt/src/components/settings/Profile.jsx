import React, { useState, useEffect, useMemo } from "react";
import {
  Save,
  X,
  Shield,
  User,
  Check,
  Eye,
  EyeOff,
  Mail,
  AtSign,
  Building2,
  Briefcase,
  CircleDot,
  Lock,
  KeyRound,
} from "lucide-react";
import axios from "axios";
import { useSelector } from "react-redux";
import { encryptPassword } from "../../utils/PasswordEnc";

/* ================================================================
   Theme tokens — defined as CSS variables in the injected stylesheet
   below so both light and dark mode resolve correctly everywhere
   this token is used (arbitrary Tailwind values: bg-[var(--x)]).

   --canvas      page background
   --surface     card / input background
   --surface-alt subtle inset panel background (read-only fields)
   --ink         primary text
   --muted       secondary text
   --border      hairline borders
   --primary     steel blue — brand / actions
   --primary-hv  primary hover state
   --accent      brass — status & signature moments
   ================================================================ */

const FIELD_META = {
  name: { label: "Full name", icon: User },
  email: { label: "Email address", icon: Mail },
  username: { label: "Username", icon: AtSign },
  type: { label: "Account type", icon: Briefcase },
  company: { label: "Company", icon: Building2 },
  status: { label: "Status", icon: CircleDot },
};

const Profile = () => {
  const [activeTab, setActiveTab] = useState("profile");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [profileLoading, setProfileLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profile, setProfile] = useState(null);
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const user = useSelector((state) => state.auth.user);
  const userId = user?.userId;
  const username = user?.name;

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const res = await axios.get(
          "http://139.5.190.244:8061/api/user/getUserById",
          { params: { userId } }
        );

        const userData = res.data?.paramObjectsMap?.userVO;

        setProfile({
          name: userData?.firstName,
          email: userData?.email,
          username: userData?.userName,
          type: userData?.type,
          company: userData?.company,
          status: userData?.active ? "Active" : "Inactive",
        });
      } catch {
        setErrorMessage("Failed to load profile");
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  /* ================= AUTO CLOSE MESSAGE ================= */
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  /* ================= PASSWORD ================= */
  const handleClear = () => {
    setPassword({ current: "", new: "", confirm: "" });
  };

  const handleSave = async () => {
    if (!password.current || !password.new || !password.confirm) {
      return setErrorMessage("All fields required");
    }

    if (password.new !== password.confirm) {
      return setErrorMessage("Passwords do not match");
    }

    try {
      setPasswordLoading(true);

      const payload = {
        newPassword: encryptPassword(password.new),
        oldPassword: encryptPassword(password.current),
        userName: username,
      };

      const res = await axios.post(
        "http://139.5.190.244:8061/api/user/changePassword",
        payload
      );

      if (res?.data?.status) {
        setSuccessMessage("Password updated successfully!");
        handleClear();
      } else {
        setErrorMessage("Update failed");
      }
    } catch {
      setErrorMessage("Something went wrong");
    } finally {
      setPasswordLoading(false);
    }
  };

  const initials = useMemo(() => {
    const src = profile?.name || username || "?";
    return src
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");
  }, [profile, username]);

  const isActive = profile?.status === "Active";

  return (
    <div className="min-h-full px-4 py-8 sm:px-8 animate-fadeIn bg-[var(--canvas)] font-body transition-colors">

      {/* ================= SUCCESS / ERROR MODAL ================= */}
      {(successMessage || errorMessage) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-[var(--surface)] rounded-2xl shadow-2xl p-6 text-center animate-slideUp border border-[var(--border)]">
            <div className="flex justify-center mb-4">
              <div
                className={`p-3 rounded-full ${
                  successMessage
                    ? "bg-emerald-500/10"
                    : "bg-rose-500/10"
                }`}
              >
                {successMessage ? (
                  <Check className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
                ) : (
                  <X className="w-5 h-5 text-rose-500" strokeWidth={2.5} />
                )}
              </div>
            </div>

            <h2 className="font-display text-base font-semibold text-[var(--ink)] mb-1">
              {successMessage ? "Success" : "Something's off"}
            </h2>

            <p className="text-sm text-[var(--muted)] mb-5">
              {successMessage || errorMessage}
            </p>

            <button
              onClick={() => {
                setSuccessMessage("");
                setErrorMessage("");
              }}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${
                successMessage
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto grid lg:grid-cols-[280px_1fr] gap-6">

        {/* ================= ID CARD / SIDEBAR ================= */}
        <aside className="animate-slideUp">
          <div className="relative overflow-hidden rounded-2xl bg-[#16213A] p-6 text-white shadow-lg ring-1 ring-white/5">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#2C5F8A]/40 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#C08B3B]/60 to-transparent" />

            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50">
                  Account
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? "bg-emerald-400" : "bg-white/40"
                    }`}
                  />
                  {profile?.status || "—"}
                </span>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2C5F8A] to-[#16213A] border border-white/10 flex items-center justify-center mb-4">
                <span className="font-display text-xl font-semibold tracking-wide">
                  {profileLoading ? "" : initials || "?"}
                </span>
              </div>

              <h1 className="font-display text-lg font-semibold leading-tight">
                {profileLoading ? "Loading…" : profile?.name || "Unnamed user"}
              </h1>
              <p className="text-sm text-white/50 mt-0.5">
                {profileLoading ? "" : profile?.email || "No email on file"}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="mt-4 flex lg:flex-col gap-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors flex-1 lg:flex-none ${
                activeTab === "profile"
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm border border-[var(--border)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface)]/60"
              }`}
            >
              <User
                size={16}
                className={activeTab === "profile" ? "text-[var(--primary)]" : ""}
              />
              Profile
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors flex-1 lg:flex-none ${
                activeTab === "security"
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm border border-[var(--border)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface)]/60"
              }`}
            >
              <Shield
                size={16}
                className={activeTab === "security" ? "text-[var(--accent)]" : ""}
              />
              Security
            </button>
          </nav>
        </aside>

        {/* ================= CONTENT ================= */}
        <section className="animate-slideUp" style={{ animationDelay: "60ms" }}>
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">

            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
              <div>
                <h2 className="font-display text-base font-semibold text-[var(--ink)]">
                  {activeTab === "profile" ? "Profile details" : "Password & access"}
                </h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {activeTab === "profile"
                    ? "Information tied to your account"
                    : "Update the password used to sign in"}
                </p>
              </div>

              {activeTab === "security" && (
                <div className="flex gap-2">
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--border)] rounded-lg transition-colors"
                  >
                    <X size={14} /> Clear
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={passwordLoading}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hv)] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Save size={14} />
                    {passwordLoading ? "Saving…" : "Save changes"}
                  </button>
                </div>
              )}
            </div>

            {/* Panel body */}
            <div className="p-6">
              {activeTab === "profile" && (
                <>
                  {profileLoading ? (
                    <Skeleton />
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {Object.entries(profile || {}).map(([k, v]) => (
                        <Field key={k} fieldKey={k} value={v} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "security" && (
                <div className="max-w-md space-y-5">
                  <Input
                    label="Current password"
                    icon={Lock}
                    value={password.current}
                    onChange={(e) =>
                      setPassword({ ...password, current: e.target.value })
                    }
                  />

                  <div className="pt-1">
                    <Input
                      label="New password"
                      icon={KeyRound}
                      value={password.new}
                      onChange={(e) =>
                        setPassword({ ...password, new: e.target.value })
                      }
                    />
                    <StrengthMeter value={password.new} />
                  </div>

                  <Input
                    label="Confirm new password"
                    icon={KeyRound}
                    value={password.confirm}
                    onChange={(e) =>
                      setPassword({ ...password, confirm: e.target.value })
                    }
                    mismatch={
                      password.confirm.length > 0 &&
                      password.confirm !== password.new
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

/* ================= FIELD (profile, read-only) ================= */
const Field = ({ fieldKey, value }) => {
  const meta = FIELD_META[fieldKey] || { label: fieldKey, icon: User };
  const Icon = meta.icon;

  return (
    <div className="flex items-start gap-3 bg-[var(--surface-alt)] rounded-xl px-4 py-3.5 border border-transparent hover:border-[var(--primary)]/25 transition-colors">
      <div className="mt-0.5 p-1.5 rounded-lg bg-[var(--surface)] text-[var(--primary)] shadow-sm shrink-0">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-mono uppercase tracking-wide text-[var(--muted)]">
          {meta.label}
        </p>
        <p className="text-sm font-semibold text-[var(--ink)] truncate">
          {value || "—"}
        </p>
      </div>
    </div>
  );
};

/* ================= INPUT (password fields) ================= */
const Input = ({ label, value, onChange, icon: Icon, mismatch }) => {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="text-xs font-semibold text-[var(--ink)] mb-1.5 block">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
        )}

        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          className={`w-full border rounded-xl pl-9 pr-10 py-2.5 text-sm bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] transition-colors ${
            mismatch
              ? "border-rose-400 focus:ring-rose-400/30 focus:border-rose-400"
              : "border-[var(--border)]"
          }`}
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>

      {mismatch && (
        <p className="text-[11px] text-rose-500 mt-1">Passwords don't match</p>
      )}
    </div>
  );
};

/* ================= STRENGTH METER ================= */
const StrengthMeter = ({ value }) => {
  const score = useMemo(() => {
    if (!value) return 0;
    let s = 0;
    if (value.length >= 8) s++;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) s++;
    if (/\d/.test(value)) s++;
    if (/[^A-Za-z0-9]/.test(value)) s++;
    return s;
  }, [value]);

  const labels = ["Too short", "Weak", "Okay", "Good", "Strong"];
  const colors = [
    "bg-[var(--border)]",
    "bg-rose-400",
    "bg-amber-400",
    "bg-[var(--primary)]",
    "bg-emerald-500",
  ];

  if (!value) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < score ? colors[score] : "bg-[var(--border)]"
            }`}
          />
        ))}
      </div>
      <p className="text-[11px] text-[var(--muted)] mt-1">{labels[score]}</p>
    </div>
  );
};

/* ================= SKELETON ================= */
const Skeleton = () => (
  <div className="grid sm:grid-cols-2 gap-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="h-14 bg-[var(--surface-alt)] rounded-xl animate-pulse"
      />
    ))}
  </div>
);

/* ================= GLOBAL STYLES & THEME ================= */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --canvas: #F9FAFB;
  --surface: #FFFFFF;
  --surface-alt: #F3F4F6;

  --ink: #111827;
  --muted: #6B7280;

  --border: #E5E7EB;

  --primary: #2563EB;
  --primary-hv: #1D4ED8;

  --accent: #10B981;
}

.dark {
  --canvas: #111827;
  --surface: #1F2937;
  --surface-alt: #374151;

  --ink: #F9FAFB;
  --muted: #9CA3AF;

  --border: #374151;

  --primary: #2563EB;
  --primary-hv: #1D4ED8;

  --accent: #34D399;
}
.font-display { font-family: 'Space Grotesk', 'Inter', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }
.font-mono { font-family: 'JetBrains Mono', monospace; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.animate-fadeIn { animation: fadeIn 0.4s ease; }
.animate-slideUp { animation: slideUp 0.45s ease forwards; opacity: 0; }
`;

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default Profile;