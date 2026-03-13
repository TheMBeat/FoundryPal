import type { ReactNode } from 'react';

interface TabDef {
  key: string;
  label: string;
}

export function MobileLayout({
  title,
  content,
  tabs,
  activeTab,
  onTabChange,
  connection,
}: {
  title: string;
  content: ReactNode;
  tabs: TabDef[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  connection: string;
}): JSX.Element {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>{title}</h1>
        <span className={`badge badge-${connection}`}>{connection}</span>
      </header>
      <main className="app-content">{content}</main>
      <nav className="tab-bar" aria-label="Companion screens">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={tab.key === activeTab ? 'tab active' : 'tab'}
            onClick={() => onTabChange(tab.key)}
            aria-current={tab.key === activeTab ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export function StatusBlock({ text }: { text: string }): JSX.Element {
  return <section className="status-block">{text}</section>;
}
