"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function LoginForm({ onSuccess }) {
  const { login, isLoading, error } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setValidationError("");

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setValidationError("E-posta adresinizi girin.");
      return;
    }

    if (!password) {
      setValidationError("Şifrenizi girin.");
      return;
    }

    try {
      const result = await login(normalizedEmail, password);
  
      if (result) {
          onSuccess?.();
      }
  } catch {
      // Beklenmeyen hatalar için.
  }
  }

  const displayError = validationError || error?.message;
2
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="login-email"
          className="mb-2 block text-sm font-semibold text-text-primary"
        >
          E-posta
        </label>

        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="E-posta adresiniz"
          disabled={isLoading}
          className="h-12 w-full rounded-lg border border-border bg-white px-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary disabled:cursor-not-allowed disabled:bg-background-soft"
        />
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="mb-2 block text-sm font-semibold text-text-primary"
        >
          Şifre
        </label>

        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Şifreniz"
            disabled={isLoading}
            className="h-12 w-full rounded-lg border border-border bg-white px-4 pr-12 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary disabled:cursor-not-allowed disabled:bg-background-soft"
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            disabled={isLoading}
            aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" strokeWidth={1.8} />
            ) : (
              <Eye className="h-5 w-5" strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>

      {displayError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {displayError}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading && (
          <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
        )}

        {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
    </form>
  );
}