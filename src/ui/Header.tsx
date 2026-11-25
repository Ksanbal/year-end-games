export function Header({ title, meta }: { title: string; meta?: string }) {
  return (
    <header className="app-header">
      <div className="app-header-bar" />
      <div className="app-header-line" />
      <div className="app-header-title">{title}</div>
      {meta ? <div className="app-header-meta">{meta}</div> : null}
    </header>
  );
}
