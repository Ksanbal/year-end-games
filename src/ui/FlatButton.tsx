import type { CSSProperties } from "react";

export function FlatButton(props: {
  label: string;
  onClick: () => void;
  width: number;
  height: number;
  fontSize: number;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      className="btn-flat"
      onClick={props.onClick}
      style={{
        width: props.width,
        height: props.height,
        borderRadius: props.height / 2,
        fontSize: props.fontSize,
        ...props.style,
      }}
    >
      {props.label}
    </button>
  );
}
