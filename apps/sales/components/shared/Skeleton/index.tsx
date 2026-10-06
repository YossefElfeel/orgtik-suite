import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export default function Skeleton({ className }: Props) {
  return (
    <div
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.05)",
        borderColor: "rgba(0, 0, 0, 0.05)",
      }}
      className={cn(
        "h-24 animate-pulse rounded-md border border-gray-100",
        className,
      )}
    />
  );
}
