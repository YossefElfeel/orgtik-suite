"use client";

// Whether the customer can sign in, as the API says it (no account, invited, can sign in).
import { SalesStatus } from "@/components/shared/SalesStatus";
import type { CustomerAccess } from "@/types/customers";

type Props = {
  access?: CustomerAccess | null;
};

export default function CustomerAccessCell({ access }: Props) {
  return <SalesStatus kind="access" value={access ?? "no_account"} size="sm" />;
}
