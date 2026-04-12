import Link from "next/link";
import { auth } from "@/auth";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { AUSLogo } from "@/components/ui/AUSLogo";
import { DesktopNavLinks } from "./NavLinks";
import { MobileMenu } from "./MobileMenu";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <AUSLogo className="h-10 w-auto" variant="negro" />
          </Link>

          {/* Desktop nav */}
          <DesktopNavLinks />

          {/* Auth + mobile menu */}
          <div className="flex items-center gap-3">
            {session ? (
              <UserAvatar />
            ) : (
              <Link
                href="/login"
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue-dark transition-colors"
              >
                Ingresar
              </Link>
            )}
            <MobileMenu isLoggedIn={!!session} />
          </div>
        </div>
      </div>
    </header>
  );
}
