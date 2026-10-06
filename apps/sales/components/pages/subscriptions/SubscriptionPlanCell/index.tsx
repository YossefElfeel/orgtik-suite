type Props = {
  plan: string;
};

export default function SubscriptionPlanCell({ plan }: Props) {
  return (
    <span className="truncate font-semibold text-foreground">{plan}</span>
  );
}
