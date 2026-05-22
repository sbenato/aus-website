"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/competitions", label: "Competencias" },
  { href: "/members", label: "Miembros" },
  { href: "/about", label: "Sobre AUS" },
];

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function DesktopNavLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden md:flex items-center gap-1">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive(link.href, pathname)
              ? "text-brand-blue bg-blue-50"
              : "text-gray-600 hover:text-brand-blue hover:bg-blue-50"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNavLinks({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Menú mobile">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive(link.href, pathname)
              ? "text-brand-blue bg-blue-50"
              : "text-gray-700 hover:bg-gray-50 hover:text-brand-blue"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
