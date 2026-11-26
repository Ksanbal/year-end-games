import type { CSSProperties } from "react";
import { COIN_ASPECT, pickCoinAsset } from "./coinAsset.ts";

export function Coin(props: {
  size: number;
  left?: number;
  top?: number;
  empty?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const asset = pickCoinAsset(props.size, props.empty);
  const className = ["coin", props.empty ? "is-empty" : "", props.className ?? ""].filter(Boolean).join(" ");
  return (
    <span
      className={className}
      aria-hidden="true"
      data-coin={asset.name}
      data-coin-size={String(props.size)}
      style={{
        width: props.size,
        height: props.size,
        left: props.left,
        top: props.top,
        ...props.style,
      }}
    >
      <img
        className="coin-face"
        alt=""
        width={props.size}
        height={props.size * COIN_ASPECT}
        src={asset.src}
        srcSet={asset.srcSet}
        draggable={false}
      />
    </span>
  );
}
