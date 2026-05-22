interface AUSLogoProps {
  className?: string;
  variant?: "negro" | "blanco" | "negativo" | "una-tinta" | "negro-chico" | "blanco-chico" | "negativo-chico" | "una-tinta-chico";
  alt?: string;
}

const logoSrc: Record<NonNullable<AUSLogoProps["variant"]>, string> = {
  negro: "/logos/logo-negro.svg",
  blanco: "/logos/logo-blanco.svg",
  negativo: "/logos/logo-negativo.svg",
  "una-tinta": "/logos/logo-una-tinta.svg",
  "negro-chico": "/logos/logo-negro-chico.svg",
  "blanco-chico": "/logos/logo-blanco-chico.svg",
  "negativo-chico": "/logos/logo-negativo-chico.svg",
  "una-tinta-chico": "/logos/logo-una-tinta-chico.svg",
};

export function AUSLogo({
  className = "h-9 w-auto",
  variant = "negro",
  alt = "Asociación Uruguaya de Speedcubing",
}: AUSLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoSrc[variant]}
      alt={alt}
      className={className}
    />
  );
}
