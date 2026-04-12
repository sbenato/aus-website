import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginButton } from "@/components/auth/LoginButton";
import { AUSLogo } from "@/components/ui/AUSLogo";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ingresar",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (session) {
    redirect(params.callbackUrl ?? "/dashboard");
  }

  const errorMessages: Record<string, string> = {
    OAuthSignin: "Error al iniciar el proceso de autenticación.",
    OAuthCallback: "Error al procesar la respuesta de WCA.",
    OAuthCreateAccount: "No se pudo crear la cuenta.",
    AccessDenied: "Acceso denegado.",
    Default: "Ocurrió un error. Intentá de nuevo.",
  };

  const errorMessage = params.error
    ? (errorMessages[params.error] ?? errorMessages.Default)
    : null;

  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center px-4">
      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Volver al inicio
      </Link>

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <AUSLogo className="h-16 w-16 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 text-center">
              Ingresá a AUS
            </h1>
            <p className="text-gray-500 text-sm mt-1 text-center">
              Asociación Uruguaya de Speedcubing
            </p>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <svg className="h-5 w-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {/* WCA Login */}
          <div className="space-y-4">
            <LoginButton
              callbackUrl={params.callbackUrl ?? "/dashboard"}
              size="lg"
              className="w-full justify-center"
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400">¿Qué es la WCA?</span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 leading-relaxed">
              <p>
                La{" "}
                <a
                  href="https://www.worldcubeassociation.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:text-brand-blue-dark"
                >
                  World Cube Association (WCA)
                </a>{" "}
                es el organismo internacional que regula las competencias de
                speedcubing. Necesitás una cuenta WCA para ingresar.
              </p>
              <a
                href="https://www.worldcubeassociation.org/users/sign_up"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-brand-blue font-semibold hover:underline"
              >
                Crear cuenta en WCA →
              </a>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/60">
          Al ingresar, aceptás que AUS acceda a tu información pública de la WCA.
        </p>
      </div>
    </div>
  );
}
