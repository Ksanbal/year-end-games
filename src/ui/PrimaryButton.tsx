import type { CSSProperties } from "react";

type Size = "lg" | "md" | "wideLg" | "wideMd";

const SIZES: Record<Size, { w: number; h: number; radius: number; font: number; depth: number }> = {
  lg: { w: 400, h: 120, radius: 60, font: 50, depth: 16 },
  md: { w: 400, h: 112, radius: 56, font: 47, depth: 16 },
  wideLg: { w: 440, h: 120, radius: 60, font: 50, depth: 16 },
  wideMd: { w: 500, h: 112, radius: 56, font: 47, depth: 16 },
};

export function PrimaryButton(props: {
  label: string;
  onClick: () => void;
  size?: Size;
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const size = SIZES[props.size ?? "lg"];
  const className = props.disabled ? "btn-primary is-disabled" : "btn-primary";
  return (
    <button
      type="button"
      className={className}
      disabled={props.disabled}
      onClick={props.onClick}
      style={{
        width: size.w,
        height: size.h,
        borderRadius: size.radius,
        fontSize: size.font,
        lineHeight: `${size.font + 10}px`,
        ["--btn-depth" as string]: `${size.depth}px`,
        ...props.style,
      }}
    >
      <span className="btn-primary-face">
        <span className="btn-primary-gloss" />
        <span className="btn-primary-label">{props.label}</span>
      </span>
    </button>
  );
}
