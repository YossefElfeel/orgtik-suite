"use client";
import { Eye } from "@phosphor-icons/react";
import { useMemo, type ReactNode } from "react";
import CardLayout from "../CardLayout";
import { useGetTicketActivityLogsQuery } from "@/redux/features/ticket/ticketApi";
import { ITicketActivity } from "@/types/ticket";
import { Button } from "@orgtik/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@orgtik/ui";
import { useFormatter, useTranslations } from "next-intl";
type ActivityEntry = {
    id: number;
    body: ReactNode;
    timestamp: string;
};
type Props = {
    ticketId: string;
};
const MAX_PREVIEW_ITEMS = 5;
const SKELETON_ITEMS_COUNT = 3;
/** ticketStatusCard.statusOptions key for each ticket status code. */
const STATUS_LABEL_KEYS: Record<string, string> = {
    open: "open",
    "in-progress": "inProgress",
    closed: "closed",
};
const toTitleCase = (value: string) => value
    .replace(/-/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
const getDisplayName = (activity: ITicketActivity, unknownUser: string) => {
    const firstName = activity.performedByUser?.firstName ?? "";
    const lastName = activity.performedByUser?.lastName ?? "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || activity.performedByUser?.username || unknownUser;
};
const getActivityBody = (activity: ITicketActivity, t: ReturnType<typeof useTranslations>, statusLabel: (status: string) => string): ReactNode => {
    const name = getDisplayName(activity, t("unknownUser"));
    switch (activity.action) {
        case "TICKET_CREATED":
            return (<>
          <span className="font-semibold">{name}</span>
          <span className="font-normal text-fg-subtle">
            {" "}
            {t("actions.created")}
          </span>
        </>);
        case "TICKET_USERS_ASSIGNED": {
            const count = activity.metadata?.assignedUserIds?.length ?? 0;
            return (<>
          <span className="font-semibold">{name}</span>
          <span className="font-normal text-fg-subtle"> {t("actions.assigned")} </span>
          <span className="font-semibold">{count}</span>
          <span className="font-normal text-fg-subtle">
            {" "}
            {t("actions.assignedUsers", { count })}
          </span>
        </>);
        }
        case "TICKET_STATUS_UPDATED":
            return (<>
          <span className="font-semibold">{name}</span>
          <span className="font-normal text-fg-subtle">
            {" "}
            {t("actions.updatedStatusFrom")}{" "}
          </span>
          <span className="font-semibold">
            {statusLabel(activity.metadata?.previousStatus ?? "-")}
          </span>
          <span className="font-normal text-fg-subtle"> {t("actions.to")} </span>
          <span className="font-semibold">
            {statusLabel(activity.metadata?.newStatus ?? "-")}
          </span>
          <span className="font-normal text-fg-subtle">.</span>
        </>);
        case "TICKET_MESSAGE_ADDED":
            return (<>
          <span className="font-semibold">{name}</span>
          <span className="font-normal text-fg-subtle">
            {" "}
            {t("actions.addedMessage")}
          </span>
        </>);
        default:
            return (<>
          <span className="font-semibold">{name}</span>
          <span className="font-normal text-fg-subtle">
            {" "}
            {t("actions.performedAction")}{" "}
          </span>
          <span className="font-semibold">{activity.action}</span>
          <span className="font-normal text-fg-subtle">.</span>
        </>);
    }
};
const ActivitySkeleton = () => (<ul className="divide-y divide-border animate-pulse">
    {Array.from({ length: SKELETON_ITEMS_COUNT }).map((_, index) => (<li key={index} className="py-3 first:pt-0 last:pb-0">
        <div className="space-y-2">
          <div className="h-4 w-11/12 rounded bg-line"/>
          <div className="h-3 w-40 rounded bg-sunken"/>
        </div>
      </li>))}
  </ul>);
function TicketActivity({ ticketId }: Props) {
    const t = useTranslations("ticketActivity");
    const tStatus = useTranslations("ticketStatusCard.statusOptions");
    const format = useFormatter();
    const { data, isLoading } = useGetTicketActivityLogsQuery(ticketId, {
        skip: !ticketId,
    });
    const activities: ActivityEntry[] = useMemo(() => {
        const statusLabel = (status: string) => {
            const key = STATUS_LABEL_KEYS[status];
            return key ? tStatus(key) : toTitleCase(status);
        };
        const formatTimestamp = (value: string) => {
            const date = new Date(value);
            if (Number.isNaN(date.getTime()))
                return "-";
            return format.dateTime(date, { dateStyle: "short", timeStyle: "short" });
        };
        return (data?.data ?? []).map((activity) => ({
            id: activity.id,
            body: getActivityBody(activity, t, statusLabel),
            timestamp: formatTimestamp(activity.createdAt),
        }));
    }, [data, t, tStatus, format]);
    const previewActivities = activities.slice(0, MAX_PREVIEW_ITEMS);
    const hasMore = activities.length > MAX_PREVIEW_ITEMS;
    const renderActivitiesList = (items: ActivityEntry[]) => (<ul className="divide-y divide-border">
      {items.map((entry) => (<li key={entry.id} className="py-3 first:pt-0 last:pb-0">
          <div className="space-y-2">
            <p className="text-body leading-snug">{entry.body}</p>
            <p className="text-caption text-secondary">{entry.timestamp}</p>
          </div>
        </li>))}
    </ul>);
    return (<Dialog>
      <CardLayout title={t("title")} headerAction={hasMore ? (<DialogTrigger render={<Button variant="secondary" size="xs"/>} aria-label={t("viewAll")} title={t("viewAll")}>
              <Eye />
            </DialogTrigger>) : null}>
        {isLoading ? (<ActivitySkeleton />) : activities.length ? (<div className="space-y-4">{renderActivitiesList(previewActivities)}</div>) : (<p className="text-body text-secondary">{t("noActivity")}</p>)}
      </CardLayout>

      {hasMore ? (<DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("allTitle")}</DialogTitle>
          </DialogHeader>
          {renderActivitiesList(activities)}
        </DialogContent>) : null}
    </Dialog>);
}
export default TicketActivity;
