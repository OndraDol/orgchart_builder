interface StatusBarProps {
  nodeCount: number;
  warning: string;
  saveState: 'saved' | 'failed';
}

export function StatusBar({ nodeCount, warning, saveState }: StatusBarProps) {
  return (
    <footer className="status-bar" role="status">
      <span>{nodeCount} cards</span>
      <span>
        {saveState === 'failed'
          ? 'Changes are not saved in this browser.'
          : 'Changes are saved in this browser.'}
      </span>
      {warning ? <strong role="alert">{warning}</strong> : null}
    </footer>
  );
}
