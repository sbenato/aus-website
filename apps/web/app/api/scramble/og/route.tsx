/**
 * Imagen vertical del scramble del día, formato historia de Instagram
 * (1080×1920). Se genera con `ImageResponse` de `next/og` (satori): renderiza
 * JSX con flexbox a PNG, sin navegador headless.
 *
 *   GET /api/scramble/og            -> scramble de hoy (zona Uruguay)
 *   GET /api/scramble/og?date=YYYY-MM-DD  -> scramble de esa fecha
 *
 * Ver `docs/plan/03-instagram-image.md`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getDailyScramble } from "@aus/scramble";
import { CubeNet } from "@aus/scramble/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Paleta AUS (ver apps/web/app/globals.css).
const NAVY = "#0d3b6e";
const BLUE = "#0070BD";
const GOLD = "#f5c518";

// Logo cargado una sola vez como data URL (satori no lee del disco).
const logo = readFileSync(
  join(process.cwd(), "public/logos/logo-blanco.png"),
).toString("base64");
const logoSrc = `data:image/png;base64,${logo}`;

// Fuente Poppins: satori necesita los .ttf cargados explícitamente.
const fontsDir = join(process.cwd(), "public/fonts");
const poppins = [
  { name: "Poppins", weight: 400 as const, file: "Poppins-Regular.ttf" },
  { name: "Poppins", weight: 600 as const, file: "Poppins-SemiBold.ttf" },
  { name: "Poppins", weight: 700 as const, file: "Poppins-Bold.ttf" },
].map(({ file, ...font }) => ({
  ...font,
  style: "normal" as const,
  data: readFileSync(join(fontsDir, file)),
}));

export function GET(req: Request): ImageResponse {
  const dateParam = new URL(req.url).searchParams.get("date");
  const daily = getDailyScramble(dateParam ?? undefined);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1920,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 100%)`,
          padding: "110px 50px",
          fontFamily: "Poppins",
        }}
      >
        {/* Pill amarilla con el título */}
        <div
          style={{
            display: "flex",
            backgroundColor: GOLD,
            color: NAVY,
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1.5,
            letterSpacing: 2,
            padding: "28px 56px",
            borderRadius: 999,
          }}
        >
          SCRAMBLE DIARIO DE 3X3
        </div>

        {/* Scramble en texto grande */}
        <div
          style={{
            display: "flex",
            width: "100%",
            marginTop: 90,
            color: "#FFFFFF",
            fontSize: 62,
            fontWeight: 700,
            lineHeight: 1.5,
            textAlign: "center",
            justifyContent: "center",
          }}
        >
          {daily.scramble}
        </div>

        {/* Visualización del cubo (cross-net).
            Ancho = 12·cell + 8·gap + 3·faceGap = 916px, dentro del área útil
            (1080 − padding·2 = 980px). */}
        <div style={{ display: "flex", marginTop: 110 }}>
          <CubeNet state={daily.state} cell={64} gap={8} faceGap={28} />
        </div>

        {/* Llamada a la acción */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#FFFFFF",
              fontSize: 44,
              fontWeight: 700,
              lineHeight: 1.4,
              textAlign: "center",
            }}
          >
            Usá el sticker para contarnos cómo te fue.
          </div>
          <div
            style={{
              display: "flex",
              width: 820,
              marginTop: 28,
              color: GOLD,
              fontSize: 44,
              fontWeight: 700,
              lineHeight: 1.4,
              textAlign: "center",
              justifyContent: "center",
              textDecoration: "underline",
            }}
          >
            ¡Etiquetános para que te compartamos en nuestras historias!
          </div>
        </div>

        {/* Logo AUS al pie */}
        <img
          src={logoSrc}
          width={420}
          height={137}
          alt=""
          style={{ marginTop: 70 }}
        />
      </div>
    ),
    { width: 1080, height: 1920, fonts: poppins },
  );
}
