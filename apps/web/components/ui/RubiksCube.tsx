// Colors from the AUS logo SVG
const B = "#2061BB"; // st1 — azul
const W = "#EFEFEF"; // st2 — blanco/gris
const Y = "#FFCC05"; // st3 — amarillo

// 9 stickers per face, row by row
const faces: { className: string; stickers: string[] }[] = [
  {
    className: "cube-face cube-face-front",
    stickers: [W, B, W, W, W, W, B, W, B],
  },
  {
    className: "cube-face cube-face-back",
    stickers: [W, B, W, W, W, W, B, W, B],
  },
  {
    className: "cube-face cube-face-left",
    stickers: [W, B, W, W, B, W, W, W, W],
  },
  {
    className: "cube-face cube-face-right",
    stickers: [W, B, W, W, B, W, W, W, W],
  },
  {
    className: "cube-face cube-face-top",
    stickers: [B, Y, B, Y, Y, Y, B, Y, B],
  },
];

export function RubiksCube() {
  return (
    <div className="rubik-cube-scene">
      <div className="rubik-cube-3d">
        {faces.map((face) => (
          <div key={face.className} className={face.className}>
            {face.stickers.map((color, i) => (
              <div key={i} style={{ backgroundColor: color }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
