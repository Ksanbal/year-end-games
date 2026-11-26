export function Header({
  title,
  meta,
  variant = "bar",
}: {
  title: string;
  meta?: string;
  variant?: "bar" | "plain";
}) {
  const plain = variant === "plain";
  return (
    <header className={plain ? "app-header is-plain" : "app-header"}>
      {plain ? null : (
        <>
          <div className="app-header-bar" />
          <div className="app-header-line" />
        </>
      )}
      <div className="app-header-title">{title}</div>
      {!plain && meta ? <div className="app-header-meta">{meta}</div> : null}
    </header>
  );
}
