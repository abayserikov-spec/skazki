import { supabase } from "lib/supabase";

const REDIRECT_URL = `${window.location.origin}/app`;

export async function signInWithGoogle() {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: REDIRECT_URL },
  });
  if (error) throw error;
}

export async function signInWithApple() {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: { redirectTo: REDIRECT_URL },
  });
  if (error) throw error;
}

export async function signInWithEmail(email: string) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: REDIRECT_URL },
  });
  if (error) throw error;
}

export async function resetPassword(email: string) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/app/reset-password`,
  });
  if (error) throw error;
}

export async function signInWithPassword(email: string, password: string) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithEmail(
  name: string,
  email: string,
  password: string,
): Promise<{ needsConfirmation: boolean }> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: REDIRECT_URL,
      data: { full_name: name },
    },
  });
  if (error) throw error;
  // empty identities = email already registered (Supabase hides this when email confirmation is on)
  if (data.user?.identities?.length === 0) {
    throw new Error("An account with this email already exists.");
  }
  // session present means Supabase auto-confirmed (no email sent)
  return { needsConfirmation: !data.session };
}
