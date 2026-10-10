import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/bindings/tooltip";
import React from "react";

type Props = {
  title: string;
  children: React.ReactNode;
  duration?: number;
  onclick?: () => void;
};

function CustomizeTooltip({ children, title, duration = 100, onclick }: Props) {
  return (
    <TooltipProvider delay={duration}>
      <Tooltip>
        <TooltipTrigger render={<span />} onClick={onclick}>
          {children}
        </TooltipTrigger>
        <TooltipContent>
          <p>{title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default CustomizeTooltip;
