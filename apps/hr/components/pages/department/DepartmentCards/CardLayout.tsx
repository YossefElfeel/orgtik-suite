import React from "react";

type Props = {
  /** A Phosphor icon element (decorative). */
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
};

function CardLayout({ icon, title, children, className }: Props) {
  return (
    <div className="border rounded-lg flex flex-col h-full relative">
      <div className="p-3 flex items-center gap-2">
        {/* A decorative badge, not a control: nothing happens on click (FS-HR-4). */}
        <span aria-hidden="true" className="inline-flex size-8 items-center justify-center rounded-md border bg-background">
          {icon}
        </span>

        <h3 className="text-body font-medium text-secondary">{title}</h3>
      </div>
      <div className={`p-2 flex flex-col ${className}`}>{children}</div>
    </div>
  );
}

export default CardLayout;
