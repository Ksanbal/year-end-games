export function Coin({ size, left, top }: { size: number; left: number; top: number }) {
  const depth = size <= 40 ? 4 : size <= 58 ? 6 : size <= 72 ? 9 : 10;
  return (
    <span
      className="coin"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        left,
        top,
        ["--coin-depth" as string]: `${depth}px`,
      }}
    >
      <span className="coin-inner" />
    </span>
  );
}
