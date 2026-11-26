import type { CSSProperties, ReactNode } from "react";

export function Card(props: {
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
  highlight?: boolean;
  shadow?: boolean;
  shadowFill?: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  children?: ReactNode;
  style?: CSSProperties;
}) {
  const radius = props.radius;
  return (
    <>
      {props.shadow !== false ? (
        <div
          className="card-shadow"
          style={{
            left: props.x,
            top: props.y + 10,
            width: props.w,
            height: props.h,
            borderRadius: radius,
            background: props.shadowFill,
          }}
        />
      ) : null}
      <div
        className={props.highlight ? "card-face is-highlight" : "card-face"}
        style={{
          left: props.x,
          top: props.y,
          width: props.w,
          height: props.h,
          borderRadius: radius,
          background: props.fill,
          borderColor: props.stroke,
          borderWidth: props.strokeWidth,
          ...props.style,
        }}
      />
      <div
        className="card-content"
        style={{ left: props.x, top: props.y, width: props.w, height: props.h, borderRadius: radius }}
      >
        {props.children}
      </div>
    </>
  );
}
