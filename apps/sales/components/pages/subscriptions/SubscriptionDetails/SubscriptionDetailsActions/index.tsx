"use client";

import type { SubscriptionDetailDto } from "@/types/subscriptions";
import { Button } from "@/components/ui/button";
import CancelSubscriptionDialog from "@/components/dialogs/subscriptions/CancelSubscriptionDialog";
import ChangePlanDialog from "@/components/dialogs/subscriptions/ChangePlanDialog";
import IssueRefundDialog from "@/components/dialogs/subscriptions/IssueRefundDialog";
import PauseSubscriptionDialog from "@/components/dialogs/subscriptions/PauseSubscriptionDialog";
import PaySubscriptionDialog from "@/components/dialogs/subscriptions/PaySubscriptionDialog";
import RenewSubscriptionDialog from "@/components/dialogs/subscriptions/RenewSubscriptionDialog";
import ResumeSubscriptionDialog from "@/components/dialogs/subscriptions/ResumeSubscriptionDialog";
import { useRole } from "@/hooks/useRole";
import { useTranslations } from "next-intl";

type Props = {
  subscription: SubscriptionDetailDto;
};

export default function SubscriptionDetailsActions({ subscription }: Props) {
  const { isCustomer } = useRole();
  const tCommon = useTranslations("common");

  const status = subscription.lifecycleStatus;
  const canPause =
    status !== "paused" && status !== "cancelled" && status !== "expired";
  const canResume = status === "paused";
  const canCancel = status !== "cancelled";
  const canRefund = Number(subscription.paidAmount) > 0;
  const canPay = Number(subscription.remainingAmount) > 0;
  const canPayInstallment =
    canPay &&
    (subscription.installments ?? []).some((item) => item.status !== "paid");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-white pt-4">
      <div className="flex flex-wrap items-center gap-2">
        {canPause ? (
          <PauseSubscriptionDialog
            id={subscription.id}
            trigger={
              <Button type="button" variant="outline" icon="solar:pause-linear">
                {tCommon("pause")}
              </Button>
            }
          />
        ) : null}

        {canResume ? (
          <ResumeSubscriptionDialog
            id={subscription.id}
            trigger={
              <Button type="button" variant="outline" icon="solar:play-linear">
                {tCommon("resume")}
              </Button>
            }
          />
        ) : null}

        {canRefund ? (
          <IssueRefundDialog
            id={subscription.id}
            subscription={subscription}
            trigger={
              <Button
                type="button"
                variant="outline"
                icon="solar:undo-left-round-linear"
              >
                {tCommon("refund")}
              </Button>
            }
          />
        ) : null}

        {canCancel ? (
          <CancelSubscriptionDialog
            id={subscription.id}
            trigger={
              <Button
                type="button"
                variant="outline"
                icon="solar:close-circle-linear"
                className="border-border text-red hover:bg-red/5 hover:text-red"
              >
                {tCommon("cancel")}
              </Button>
            }
          />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* <ChangePlanDialog
          id={subscription.id}
          trigger={
            <Button
              type="button"
              variant="outline"
              icon="solar:transfer-vertical-linear"
            >
              {tCommon("changingPlan")}
            </Button>
          }
        /> */}

        <RenewSubscriptionDialog
          id={subscription.id}
          trigger={
            <Button type="button" variant="outline" icon="solar:refresh-linear">
              {tCommon("renew")}
            </Button>
          }
        />

        {canPay ? (
          <PaySubscriptionDialog
            id={subscription.id}
            subscription={subscription}
            mode="full"
            trigger={
              <Button type="button" icon="solar:card-linear">
                {tCommon("payNow")}
              </Button>
            }
          />
        ) : null}

        {canPayInstallment ? (
          <PaySubscriptionDialog
            id={subscription.id}
            subscription={subscription}
            mode="installment"
            trigger={
              <Button type="button" icon="solar:card-linear">
                {tCommon("payInstallment")}
              </Button>
            }
          />
        ) : null}
      </div>
    </div>
  );
}
