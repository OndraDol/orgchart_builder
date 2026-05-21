interface StatusBarProps {
  nodeCount: number;
  warning: string;
}

export function StatusBar({ nodeCount, warning }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span>{nodeCount} cards</span>
      <span>Changes are saved in this browser.</span>
      {warning ? <strong>{warning}</strong> : null}
    </footer>
  );
}
