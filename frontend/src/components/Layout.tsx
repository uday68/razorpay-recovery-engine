import React from 'react';

export type PageId =
  | 'overview'
  | 'live-recovery'
  | 'payments'
  | 'experiments'
  | 'ai-decisions'
  | 'policies'
  | 'system-health'
  | 'audit-log';

interface LayoutProps {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  setCurrentPage,
  children,
}) => {
  const getNavClass = (page: PageId) => {
    if (currentPage === page) {
      return 'flex items-center justify-between px-space-sm py-space-xs rounded-lg transition-colors bg-surface-container-high text-on-surface border-l-2 border-primary font-body-md text-body-md cursor-pointer';
    }
    return 'flex items-center justify-between px-space-sm py-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-body-md text-body-md cursor-pointer';
  };

  return (
    <div className="bg-background font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo Header */}
          <div className="h-14 px-space-base flex items-center gap-space-sm bg-surface-container-low">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">security</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-caps text-label-caps tracking-widest text-on-surface truncate uppercase">
                Recovery Control
              </span>
              <span className="font-badge-label text-badge-label text-secondary truncate">
                TOWER CORE
              </span>
            </div>
          </div>

          {/* Navigation Groups */}
          <div className="p-space-base flex flex-col gap-space-lg">
            {/* Group 1: Recovery */}
            <div className="flex flex-col gap-space-xs">
              <span className="px-space-xs font-label-caps text-label-caps uppercase text-outline">
                Recovery
              </span>
              <nav className="flex flex-col gap-space-2xs">
                <div
                  className={getNavClass('overview')}
                  onClick={() => setCurrentPage('overview')}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[16px]">grid_view</span>
                    <span>Overview</span>
                  </div>
                </div>
                <div
                  className={getNavClass('live-recovery')}
                  onClick={() => setCurrentPage('live-recovery')}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[16px]">monitoring</span>
                    <span>Live Recovery</span>
                  </div>
                  <span className="px-space-xs py-space-2xs rounded-lg bg-secondary-container text-on-secondary-container font-badge-label text-badge-label">
                    127/s
                  </span>
                </div>
                <div
                  className={getNavClass('payments')}
                  onClick={() => setCurrentPage('payments')}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[16px]">credit_card</span>
                    <span>Payments</span>
                  </div>
                </div>
                <div
                  className={getNavClass('experiments')}
                  onClick={() => setCurrentPage('experiments')}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[16px]">science</span>
                    <span>Experiments</span>
                  </div>
                  <span className="px-space-xs py-space-2xs rounded-lg bg-surface-container-high text-on-surface-variant font-badge-label text-badge-label">
                    5 Seeds
                  </span>
                </div>
              </nav>
            </div>

            {/* Group 2: Intelligence */}
            <div className="flex flex-col gap-space-xs">
              <span className="px-space-xs font-label-caps text-label-caps uppercase text-outline">
                Intelligence
              </span>
              <nav className="flex flex-col gap-space-2xs">
                <div
                  className={getNavClass('ai-decisions')}
                  onClick={() => setCurrentPage('ai-decisions')}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[16px]">psychology</span>
                    <span>AI Decisions</span>
                  </div>
                </div>
                <div
                  className={getNavClass('payments')}
                  onClick={() => setCurrentPage('payments')}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[16px]">query_stats</span>
                    <span>Failure Analysis</span>
                  </div>
                </div>
              </nav>
            </div>

            {/* Group 3: Operations */}
            <div className="flex flex-col gap-space-xs">
              <span className="px-space-xs font-label-caps text-label-caps uppercase text-outline">
                Operations
              </span>
              <nav className="flex flex-col gap-space-2xs">
                <div
                  className={getNavClass('policies')}
                  onClick={() => setCurrentPage('policies')}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[16px]">policy</span>
                    <span>Policies</span>
                  </div>
                  <span className="px-space-xs py-space-2xs rounded-lg bg-tertiary-container text-on-tertiary-container font-badge-label text-badge-label">
                    Deterministic
                  </span>
                </div>
                <div
                  className={getNavClass('system-health')}
                  onClick={() => setCurrentPage('system-health')}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[16px]">dns</span>
                    <span>System Health</span>
                  </div>
                  <span className="px-space-xs py-space-2xs rounded-lg bg-surface-container-high text-secondary font-badge-label text-badge-label">
                    99.98%
                  </span>
                </div>
              </nav>
            </div>

            {/* Group 4: Developer */}
            <div className="flex flex-col gap-space-xs">
              <span className="px-space-xs font-label-caps text-label-caps uppercase text-outline">
                Developer
              </span>
              <nav className="flex flex-col gap-space-2xs">
                <div
                  className={getNavClass('audit-log')}
                  onClick={() => setCurrentPage('audit-log')}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                    <span>Audit Log</span>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-space-base flex flex-col gap-space-sm bg-surface-container-lowest">
          <div className="flex items-center justify-between px-space-sm py-space-xs rounded-lg bg-surface-container-low">
            <div className="flex items-center gap-space-xs">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="font-badge-label text-badge-label text-on-surface">6/6 Pods Active</span>
            </div>
            <span className="font-mono-code text-mono-code text-secondary-fixed-dim">OK</span>
          </div>
          <div className="flex items-center justify-between px-space-sm py-space-xs rounded-lg bg-surface-container cursor-pointer">
            <div className="flex items-center gap-space-xs min-w-0">
              <span className="material-symbols-outlined text-[14px] text-tertiary">sync_alt</span>
              <span className="font-mono-code text-mono-code text-on-surface truncate">v2.4.0-rc3</span>
            </div>
            <span className="font-badge-label text-badge-label text-on-tertiary-fixed-variant uppercase">Sim</span>
          </div>
          <div className="flex items-center gap-space-sm pt-space-xs">
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">badge</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-body-sm text-body-sm text-on-surface truncate">Ops Engineer</span>
              <span className="font-label-caps text-label-caps text-outline truncate">HDFC Cluster</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-64">
        {/* Top Header */}
        <header className="fixed top-0 left-64 right-0 h-14 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.5)] z-40 flex items-center justify-between px-layout-margin-desktop">
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-xs font-mono-code text-mono-code text-on-surface-variant">
              <span className="text-primary">cluster</span>
              <span>/</span>
              <span>recovery</span>
            </div>
            <div className="px-space-xs py-space-2xs rounded-lg bg-surface-container-high text-tertiary font-label-caps text-label-caps uppercase tracking-wider">
              Simulator Environment
            </div>
          </div>
          <div className="flex items-center gap-space-lg">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-space-sm text-outline text-[16px]">
                search
              </span>
              <input
                className="w-80 h-8 pl-8 pr-4 rounded-lg bg-surface-container-low text-on-surface placeholder-outline font-mono-code text-mono-code focus:outline-none focus:bg-surface-container-high"
                placeholder="Search payments, hashes, events (Cmd+K)..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-space-sm px-space-sm py-space-2xs rounded-lg bg-surface-container-low">
              <div className="flex items-center gap-space-2xs">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span className="font-badge-label text-badge-label text-secondary">SSE LIVE</span>
              </div>
              <span className="text-outline text-[10px]">|</span>
              <span className="font-badge-label text-badge-label text-on-surface-variant">Lag: 14ms</span>
              <span className="text-outline text-[10px]">|</span>
              <span className="font-badge-label text-badge-label text-outline">v2.4.1</span>
            </div>
            <div className="flex items-center gap-space-md">
              <div className="relative flex items-center cursor-pointer">
                <span className="material-symbols-outlined text-on-surface-variant hover:text-on-surface text-[20px]">
                  notifications
                </span>
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary-container"></span>
              </div>
              <div className="flex items-center gap-space-xs pl-space-sm">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
                </div>
                <div className="hidden xl:flex flex-col">
                  <span className="font-body-sm text-body-sm text-on-surface">FinOps Lead</span>
                  <span className="font-label-caps text-label-caps text-outline">HDFC Gateway</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="w-full pt-14 px-layout-margin-desktop bg-background min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

