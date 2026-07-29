export function PageLayout({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="wm-container" style={style}>
      {children}
    </div>
  );
}
