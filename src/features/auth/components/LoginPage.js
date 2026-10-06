"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginForm from "./LoginForm";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    router.replace("/");
  }, [isAuthenticated, isLoading, router]);

  function handleLoginSuccess() {
    router.push("/");
  }

  if (isLoading || isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background-soft">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background-soft px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <div className="inline-flex items-center">
              <span className="text-2xl font-bold tracking-tight text-primary">
                NalburJet
              </span>
            </div>

            <h1 className="mt-7 text-2xl font-bold tracking-tight text-text-primary">
              Yönetim Paneli
            </h1>

            <p className="mt-2 text-sm text-text-secondary">
              Yönetim paneline erişmek için hesabınızla giriş yapın.
            </p>
          </div>

          <div className="mt-8">
            <LoginForm onSuccess={handleLoginSuccess} />
          </div>
        </div>
      </div>
    </main>
  );
}