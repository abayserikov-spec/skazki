import { AppleIcon, EmailIcon, GoogleIcon } from "assets/svg";
import { clsx } from "clsx";
import { AnimIn } from "components/AnimIn";
import AuthButton from "components/AuthButton";
import AuthError from "components/AuthError";
import AuthLayout from "components/AuthLayout";
import Input from "components/Input";
import {
  resetPassword,
  signInWithApple,
  signInWithGoogle,
  signInWithPassword,
} from "lib/auth";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type View = "oauth" | "email" | "forgot" | "forgot-sent";

export default function Login() {
  const navigate = useNavigate();
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
      navigate("/app", { replace: true });
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
          {view === "forgot" || view === "forgot-sent"
            ? "Reset password"
            : "Login"}
        </h1>
      </AnimIn>

      {view === "oauth" && (
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
            onClick={() => reset("email")}
          >
            Continue with Email
          </AuthButton>
          <AuthError message={error} />
        </div>
      )}

      {view === "email" && (
        <AnimIn>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEmailSubmit();
            }}
            className={clsx("flex flex-col gap-10 mt-10 w-full")}
          >
            <div className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Type your Email here"
                required
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Type your password here"
                required
                autoComplete="current-password"
              />
              <div className="flex justify-end -my-3">
                <button
                  type="button"
                  onClick={() => reset("forgot")}
                  className="inline text-sm text-black-secondary/50 hover:text-black-secondary/80 transition-colors duration-200 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <AuthError message={error} />
            </div>

            <div className="flex gap-6 flex-col">
              <AuthButton
                variant="primary"
                type="submit"
                disabled={loading}
                className={!email.trim() || !password ? "opacity-40" : ""}
              >
                {loading ? "Signing in…" : "Sign in"}
              </AuthButton>
              <p className="font-sans font-normal text-xs leading-body text-center text-black-prime">
                Don't have an account?{" "}
                <Link
                  to="/app/register"
                  className="text-accent-green underline font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </AnimIn>
      )}

      {view === "forgot" && (
        <AnimIn>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleForgotSubmit();
            }}
            className={clsx("flex flex-col gap-10 mt-10 w-full")}
          >
            <div className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
              <AuthError message={error} />
            </div>

            <div className="flex gap-6 flex-col">
              <AuthButton variant="primary" type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </AuthButton>
              <button
                type="button"
                onClick={() => reset("email")}
                className="text-sm text-black-secondary/50 hover:text-black-secondary/80 transition-colors duration-200 cursor-pointer"
              >
                ← Back
              </button>
            </div>
          </form>
        </AnimIn>
      )}

      {view === "forgot-sent" && (
        <AnimIn>
          <p
            className={clsx(
              "mt-10 text-center text-black-secondary/70",
              "text-sm leading-relaxed",
            )}
          >
            Check your inbox — we sent a reset link to <strong>{email}</strong>.
          </p>
        </AnimIn>
      )}
    </AuthLayout>
  );
}
