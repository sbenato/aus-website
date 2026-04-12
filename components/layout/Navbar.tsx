import Link from "next/link";
import { auth } from "@/auth";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { AUSLogo } from "@/components/ui/AUSLogo";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/competitions", label: "Competencias" },
  { href: "/members", label: "Miembros" },
  { href: "/about", label: "Sobre AUS" },
];

export async function Navbar() {
  const session = await auth();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <AUSLogo className="h-9 w-9" />
            <span className="font-bold text-gray-900 hidden sm:block">
              <span className="text-brand-blue">AUS</span>
              <span className="text-gray-400 font-normal text-xs ml-1 hidden md:inline">
                Asociación Uruguaya de Speedcubing
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-brand-blue hover:bg-blue-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {session ? (
              <UserAvatar />
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue-dark transition-colors"
              >
                Ingresar
              </Link>
            )}

            {/* Mobile menu button */}
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileMenu() {
  return (
    <details className="md:hidden group">
      <summary className="list-none cursor-pointer p-2 rounded-lg hover:bg-gray-100 text-gray-600">
        <svg className="h-5 w-5 group-open:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg className="h-5 w-5 hidden group-open:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </summary>
      <div className="absolute left-0 right-0 top-16 bg-white border-b border-gray-100 shadow-lg px-4 py-3 z-40">
        <nav className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-brand-blue transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </details>
  );
}
