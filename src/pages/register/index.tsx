import { AppleIcon, EmailIcon, GoogleIcon } from "assets/svg";
import { clsx } from "clsx";
import { AnimIn } from "components/AnimIn";
import AuthButton from "components/AuthButton";
import AuthError from "components/AuthError";
import AuthLayout from "components/AuthLayout";
import Input from "components/Input";
import { signInWithApple, signInWithGoogle, signUpWithEmail } from "lib/auth";
import { useState } from "react";
import { Link } from "react-router-dom";

function getPasswordStrength(pwd: string): {
  score: 0 | 1 | 2 | 3;
  level: string;
  label: string;
} {
  if (!pwd) return { score: 0, level: "", label: "" };
  let score = 0;
  if (pwd.length >= 3) score++;
  const hasLetter = /[a-zA-Z]/.test(pwd);
  if (
    score >= 1 &&
    hasLetter &&
    (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd))
  )
    score++;
  if (score >= 2 && hasLetter && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd))
    score++;
  const levels = ["Too short", "Weak", "Medium", "Strong"];
  const missing2 = [
    ...(!hasLetter ? ["a letter"] : []),
    ...(!/[0-9]/.test(pwd) ? ["a number"] : []),
    ...(!/[^A-Za-z0-9]/.test(pwd) ? ["a symbol"] : []),
  ];
  const toText = (parts: string[]) =>
    parts.length > 1
      ? parts.slice(0, -1).join(", ") + " and " + parts.at(-1)
      : parts[0];
  const missing2Text = toText(missing2);
  const missing1 = [
    ...(!hasLetter ? ["a letter"] : []),
    ...(!(/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd))
      ? ["a number or symbol"]
      : []),
  ];
  const missing1Text = toText(missing1);
  const labels = [
    "Use at least 3 characters, numbers and symbols.",
    `Add ${missing1Text} to reach the next level.`,
    `Almost there! Add ${missing2Text} to make it stronger.`,
    "Your password is excellent. You are good to go!",
  ];
  return {
    score: score as 0 | 1 | 2 | 3,
    level: levels[score],
    label: labels[score],
  };
}

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
      const { needsConfirmation } = await signUpWithEmail(
        name.trim(),
        email.trim(),
        password,
      );
      if (needsConfirmation) setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout padding={showEmail ? "p-10" : ""}>
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
            onSubmit={(e) => {
              e.preventDefault();
              handleEmailSubmit();
            }}
            className={clsx("flex flex-col gap-10 mt-10 w-full")}
          >
            <div className="flex flex-col gap-4">
              <Input
                label="Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Type your Name here"
                required
                autoComplete="name"
              />
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
                autoComplete="new-password"
              />
              {password &&
                (() => {
                  const { score, level, label } = getPasswordStrength(password);
                  return (
                    <div className="flex flex-col gap-4 pt-1">
                      <div className="flex gap-2">
                        {[1, 2, 3].map((step) => (
                          <div
                            key={step}
                            className={clsx(
                              "flex-1 h-1 rounded-full transition-colors duration-300",
                              step <= score
                                ? "bg-accent-green"
                                : "bg-grey-medium",
                            )}
                          />
                        ))}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <p className="h-3 font-sans font-medium text-xs leading-none self-stretch text-accent-green">
                          {level}
                        </p>
                        <p className="font-sans font-normal text-xs leading-body text-black-secondary self-stretch">
                          {label}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              <AuthError message={error} />
            </div>

            <div className="flex gap-6 flex-col">
              <AuthButton
                variant="primary"
                type="submit"
                disabled={loading || getPasswordStrength(password).score < 3}
                className={
                  !name.trim() || !email.trim() || getPasswordStrength(password).score < 3 ? "opacity-40" : ""
                }
              >
                {loading ? "Sign Up…" : "Sign Up"}
              </AuthButton>
              <div className="font-sans font-normal text-xs leading-body text-center text-black-prime flex flex-col gap-3.75">
                <p>
                  By clicking the “Sign up” button, you are creating a Anyturn
                  <br />
                  account and therefore you agree to Anyturn’s
                  <br />
                  <Link
                    to="/app/login"
                    className="text-accent-green underline font-medium"
                  >
                    Terms of Use
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/app/login"
                    className="text-accent-green underline font-medium"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
                <p>
                  <span>
                    Already have an account?{" "}
                    <Link
                      to="/app/login"
                      className="text-accent-green underline font-medium"
                    >
                      Log in
                    </Link>
                  </span>
                </p>
              </div>
            </div>
          </form>
        </AnimIn>
      )}
    </AuthLayout>
  );
}
