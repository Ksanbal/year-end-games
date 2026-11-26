export function Header({ title }: { title: string }) {
  return (
    <header className="app-header">
      <div className="app-header-title">{title}</div>
    </header>
  );
}
