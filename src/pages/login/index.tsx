import { AppleIcon, EmailIcon, GoogleIcon } from "assets/svg";
import { clsx } from "clsx";
import { AnimIn } from "components/AnimIn";
import AuthButton from "components/AuthButton";
import AuthLayout from "components/AuthLayout";
import { useState } from "react";
import { resetPassword, signInWithApple, signInWithGoogle, signInWithPassword } from "lib/auth";

const inputClass = clsx(
  "w-full h-14 px-5 rounded-full",
  "border-2 border-grey-medium",
  "text-black-secondary placeholder:text-black-secondary/30",
  "font-figtree text-button-sm sm:text-button",
  "outline-none focus:border-black-secondary/40 transition-colors duration-200",
);

type View = "oauth" | "email" | "forgot" | "forgot-sent";

export default function Login() {
  const [view, setView] = useState<View>("oauth");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  function reset(next: View) {
    setError(null);
    setView(next);
  }

  async function handleOAuth(fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function handleEmailSubmit() {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      await signInWithPassword(email.trim(), password);
      window.location.replace("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotSubmit() {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await resetPassword(email.trim());
      setView("forgot-sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <AnimIn>
        <h1
          className={clsx(
            "w-full h-10",
            "font-fraunces text-h1 font-bold leading-10 tracking-[-0.02em] text-center",
            "text-black-secondary",
            "grow",
          )}
        >
          {view === "forgot" || view === "forgot-sent" ? "Reset password" : "Login"}
        </h1>
      </AnimIn>

      {view === "oauth" && (
        <div className={clsx("flex flex-col", "gap-4 mt-10", "w-full")}>
          <AuthButton icon={GoogleIcon} delay={0.08} onClick={() => handleOAuth(signInWithGoogle)}>
            Continue with Google
          </AuthButton>
          <AuthButton icon={AppleIcon} delay={0.11} onClick={() => handleOAuth(signInWithApple)}>
            Continue with Apple
          </AuthButton>
          <AuthButton icon={EmailIcon} delay={0.14} onClick={() => reset("email")}>
            Continue with Email
          </AuthButton>
          {error && <p className="text-sm text-center text-red-500 mt-1">{error}</p>}
        </div>
      )}

      {view === "email" && (
        <AnimIn>
          <form
            onSubmit={(e) => { e.preventDefault(); handleEmailSubmit(); }}
            className={clsx("flex flex-col gap-3 mt-10 w-full")}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              className={inputClass}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoComplete="current-password"
              className={inputClass}
            />
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                onClick={() => reset("forgot")}
                className="text-sm text-black-secondary/50 hover:text-black-secondary/80 transition-colors duration-200 cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            {error && <p className="text-sm text-center text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className={clsx(
                "w-full h-14 rounded-full",
                "bg-black-secondary text-white",
                "font-figtree font-bold text-button-sm sm:text-button",
                "cursor-pointer transition-all duration-200",
                "hover:bg-black-secondary/85 active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => reset("oauth")}
              className="text-sm text-black-secondary/50 hover:text-black-secondary/80 transition-colors duration-200 cursor-pointer mt-1"
            >
              ← Back
            </button>
          </form>
        </AnimIn>
      )}

      {view === "forgot" && (
        <AnimIn>
          <form
            onSubmit={(e) => { e.preventDefault(); handleForgotSubmit(); }}
            className={clsx("flex flex-col gap-3 mt-10 w-full")}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              className={inputClass}
            />
            {error && <p className="text-sm text-center text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className={clsx(
                "w-full h-14 rounded-full",
                "bg-black-secondary text-white",
                "font-figtree font-bold text-button-sm sm:text-button",
                "cursor-pointer transition-all duration-200",
                "hover:bg-black-secondary/85 active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <button
              type="button"
              onClick={() => reset("email")}
              className="text-sm text-black-secondary/50 hover:text-black-secondary/80 transition-colors duration-200 cursor-pointer mt-1"
            >
              ← Back
            </button>
          </form>
        </AnimIn>
      )}

      {view === "forgot-sent" && (
        <AnimIn>
          <p className={clsx("mt-10 text-center text-black-secondary/70", "text-sm leading-relaxed")}>
            Check your inbox — we sent a reset link to <strong>{email}</strong>.
          </p>
        </AnimIn>
      )}

      <p className="mt-6 text-sm text-black-secondary/50 text-center">
        Don't have an account?{" "}
        <a href="/app/register" className="text-black-secondary hover:underline font-medium">
          Sign up
        </a>
      </p>
    </AuthLayout>
  );
}
