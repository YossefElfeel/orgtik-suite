import React from "react";

type Props = {
  title: string;
  subTitle?: string;
  children?: React.ReactNode;
};

function MainTitle({ title, subTitle, children }: Props) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2.5">
      <div className="flex flex-col gap-1">
        <h1 className="text-24 text-4xl font-semibold text-black">{title}</h1>
        {subTitle && <h2 className="text-black text-16">{subTitle}</h2>}
      </div>
      {children && children}
    </div>
  );
}

export default MainTitle;
