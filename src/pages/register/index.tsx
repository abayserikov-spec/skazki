import { AppleIcon, EmailIcon, GoogleIcon } from "assets/svg";
import { clsx } from "clsx";
import { AnimIn } from "components/AnimIn";
import AuthButton from "components/AuthButton";
import AuthError from "components/AuthError";
import AuthLayout from "components/AuthLayout";
import { useState } from "react";
import { Link } from "react-router-dom";
import { signInWithApple, signInWithGoogle, signUpWithEmail } from "lib/auth";

const inputClass = clsx(
  "w-full h-14 px-5 rounded-full",
  "border-2 border-grey-medium",
  "text-black-secondary placeholder:text-black-secondary/30",
  "font-sans text-button-sm sm:text-button",
  "outline-none focus:border-black-secondary/40 transition-colors duration-200",
);

export default function Register() {
  const [showEmail, setShowEmail] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [sent, setSent] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function handleOAuth(fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function handleEmailSubmit() {
    if (!name.trim() || !email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      const { needsConfirmation } = await signUpWithEmail(name.trim(), email.trim(), password);
      if (needsConfirmation) setSent(true);
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
          Create an account
        </h1>
      </AnimIn>

      {!showEmail ? (
        <div className={clsx("flex flex-col", "gap-4 mt-10", "w-full")}>
          <AuthButton
            icon={GoogleIcon}
            delay={0.08}
            onClick={() => handleOAuth(signInWithGoogle)}
          >
            Continue with Google
          </AuthButton>
          <AuthButton
            icon={AppleIcon}
            delay={0.11}
            onClick={() => handleOAuth(signInWithApple)}
          >
            Continue with Apple
          </AuthButton>
          <AuthButton
            icon={EmailIcon}
            delay={0.14}
            onClick={() => setShowEmail(true)}
          >
            Continue with Email
          </AuthButton>
          <AuthError message={error} />
        </div>
      ) : sent ? (
        <AnimIn>
          <p
            className={clsx(
              "mt-10 text-center text-black-secondary/70",
              "text-sm leading-relaxed",
            )}
          >
            Check your inbox — we sent a confirmation link to{" "}
            <strong>{email}</strong>.
          </p>
        </AnimIn>
      ) : (
        <AnimIn>
          <form
            onSubmit={(e) => { e.preventDefault(); handleEmailSubmit(); }}
            className={clsx("flex flex-col gap-3 mt-10 w-full")}
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              autoComplete="name"
              className={inputClass}
            />
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
              autoComplete="new-password"
              className={inputClass}
            />
            <AuthError message={error} />
            <button
              type="submit"
              disabled={loading}
              className={clsx(
                "w-full h-14 rounded-full",
                "bg-black-secondary text-white",
                "font-sans font-bold text-button-sm sm:text-button",
                "cursor-pointer transition-all duration-200",
                "hover:bg-black-secondary/85 active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
            <button
              type="button"
              onClick={() => { setShowEmail(false); setError(null); }}
              className="text-sm text-black-secondary/50 hover:text-black-secondary/80 transition-colors duration-200 cursor-pointer mt-1"
            >
              ← Back
            </button>
          </form>
        </AnimIn>
      )}
      <p className="mt-6 text-sm text-black-secondary/50 text-center">
        Already have an account?{" "}
        <Link to="/app/login" className="text-black-secondary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
