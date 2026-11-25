const CLOUDS: { x: number; y: number; w: number; h: number }[] = [
  { x: -60, y: 920, w: 200, h: 120 },
  { x: 50, y: 880, w: 220, h: 170 },
  { x: 190, y: 930, w: 200, h: 120 },
  { x: 1540, y: 944, w: 220, h: 132 },
  { x: 1661, y: 900, w: 242, h: 187 },
  { x: 1815, y: 955, w: 220, h: 132 },
  { x: 1660, y: 174, w: 120, h: 72 },
  { x: 1726, y: 150, w: 132, h: 102 },
  { x: 1810, y: 180, w: 120, h: 72 },
  { x: 40, y: 210, w: 100, h: 60 },
  { x: 95, y: 190, w: 110, h: 85 },
  { x: 165, y: 215, w: 100, h: 60 },
];

export function Clouds() {
  return (
    <div className="clouds" aria-hidden="true">
      {CLOUDS.map((cloud, i) => (
        <span
          key={i}
          className="cloud"
          style={{ left: cloud.x, top: cloud.y, width: cloud.w, height: cloud.h }}
        />
      ))}
    </div>
  );
}
