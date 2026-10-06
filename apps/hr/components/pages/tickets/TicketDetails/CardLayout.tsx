import React from "react";

type Props = {
  title: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
};

function CardLayout({ title, children, headerAction }: Props) {
  return (
    <div className="border rounded-xl bg-raised p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-title-sm font-semibold">{title}</h2>
        {headerAction}
      </div>
      <div className="h-px w-full bg-border"></div>

      {children}
    </div>
  );
}

export default CardLayout;
