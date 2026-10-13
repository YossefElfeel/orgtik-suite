import { ArrowsCounterClockwise as RefreshCcw, Bank as Landmark, Buildings as Building2, Code as Code2, CreditCard, DeviceMobile as Smartphone, Envelope as Mail, Phone, User, Wallet } from "@phosphor-icons/react";
import { InfoCard, InfoCardSkeleton, type InfoCardItem } from "@/components/shared/EmployeeFacts";
import type { BankInformationSectionProps } from "@/types/employee";
import { useTranslations } from "next-intl";
import { useEmployeeLabels } from "@/hooks/useEmploymentTypeLabel";
import { useEmployeeMoney } from "@/hooks/useEmployeeMoney";

export function BankInfoSectionSkeleton() {
  return <InfoCardSkeleton itemCount={6} />;
}

export function BankInfoSection({
  paymentDetails,
  salaryInformation,
  isLoading,
  onEdit,
}: BankInformationSectionProps) {
  const t = useTranslations("employees.details.sections");
  const tFields = useTranslations("createUpdateEmployee.fields");
  const labels = useEmployeeLabels();
  const money = useEmployeeMoney();

  if (isLoading) return <BankInfoSectionSkeleton />;

  const method = paymentDetails?.paymentMethod || "bank";

  const getSectionTitle = () => {
    switch (method) {
      case "instapay":
        return t("instapay");
      case "wallet":
        return t("wallet");
      case "bank":
      default:
        return t("bank");
    }
  };

  const getSectionIcon = () => {
    switch (method) {
      case "instapay":
        return Smartphone;
      case "wallet":
        return Wallet;
      case "bank":
      default:
        return Landmark;
    }
  };

  const getItems = () => {
    const items: InfoCardItem[] = [];

    if (method === "bank") {
      const bank = paymentDetails?.bank;
      items.push(
        {
          id: "bank-name",
          label: tFields("bankName"),
          value: bank?.bankName || "-",
          userContent: true,
          icon: Landmark,
        },
        {
          id: "bank-code",
          label: tFields("bankCode"),
          value: bank?.bankCode || "-",
          userContent: true,
          icon: Code2,
        },
        {
          id: "acc-no",
          label: tFields("accountNumber"),
          value: bank?.accountNumber || "-",
          userContent: true,
          icon: CreditCard,
        },
        {
          id: "iban",
          label: tFields("iban"),
          value: bank?.iban || "-",
          userContent: true,
          icon: Landmark,
        },
        {
          id: "acc-name",
          label: tFields("accountHolder"),
          value: bank?.accountHolder || "-",
          userContent: true,
          icon: User,
        }
      );
    } else if (method === "instapay") {
      const instapay = paymentDetails?.instapay;
      items.push(
        {
          id: "instapay-number",
          label: tFields("instapayNumber"),
          value: instapay?.registeredNumber || "-",
          userContent: true,
          icon: Phone,
        },
        {
          id: "instapay-name",
          label: tFields("instapayAccountName"),
          value: instapay?.accountName || "-",
          userContent: true,
          icon: User,
        },
        {
          id: "instapay-linked",
          label: tFields("instapayLinkedAccount"),
          value: instapay?.linkedAccount || "-",
          userContent: true,
          icon: Mail,
        },
        {
          id: "instapay-cycle",
          label: tFields("paymentType"), // Reusing paymentType as cycle label if appropriate
          value: labels.paymentCycle(instapay?.paymentCycle),
          icon: RefreshCcw,
        }
      );
    } else if (method === "wallet") {
      const wallet = paymentDetails?.wallet;
      items.push(
        {
          id: "wallet-name",
          label: tFields("walletName"),
          value: wallet?.walletName || "-",
          userContent: true,
          icon: Wallet,
        },
        {
          id: "wallet-phone",
          label: tFields("walletPhoneNumber"),
          value: wallet?.phoneNumber || "-",
          userContent: true,
          icon: Phone,
        },
        {
          id: "wallet-acc-name",
          label: tFields("walletAccountName"),
          value: wallet?.accountName || "-",
          userContent: true,
          icon: User,
        }
      );
    }

    // Always add salary information
    items.push({
      id: "salary",
      label: tFields("baseSalary"),
      value: <bdi className="tabular-nums">{money(salaryInformation?.baseSalary, salaryInformation?.currency)}</bdi>,
      icon: Building2,
    });

    return items;
  };

  return (
    <InfoCard
      title={getSectionTitle()}
      icon={getSectionIcon()}
      onEdit={onEdit}
      gridClassName="min-w-0 max-sm:[&>div]:grid max-sm:[&>div]:grid-cols-[1.25rem_minmax(0,1fr)] max-sm:[&>div]:gap-y-1 max-sm:[&>div>p]:w-auto max-sm:[&>div>div]:col-start-2 [&>div>div]:[overflow-wrap:anywhere]"
      items={getItems()}
    />
  );
}

