import React from "react";

export function PageHeader({
  breadcrumbs,
  actions,
}: {
  breadcrumbs: string[];
  actions?: React.ReactNode;
}) {
  return (
    <header className="h-16 bg-white border-b border-border px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            <span className={i === breadcrumbs.length - 1 ? "text-text-primary" : ""}>
              {crumb}
            </span>
            {i < breadcrumbs.length - 1 && <span>/</span>}
          </React.Fragment>
        ))}
      </div>
      {actions && <div className="flex items-center gap-4">{actions}</div>}
    </header>
  );
}
