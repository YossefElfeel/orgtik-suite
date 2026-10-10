import { useGetMessagesByTicketIdQuery } from "@/redux/features/ticket/ticketApi";
import TicketCard from "../../TicketCard";
import AddTicket from "../../TicketCard/AddTicket";
import { useParams } from "next/navigation";
import { Button } from "@orgtik/ui";
import { useEffect, useState } from "react";
import { ITicketMessage } from "@/types/ticket";
import { useTranslations } from "next-intl";

type Props = {};

const MESSAGES_STEP = 3;

function TicketCardSkeleton() {
  return (
    <div className="border rounded-lg bg-raised p-5 flex flex-col gap-5 animate-pulse">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-full bg-line" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-28 rounded bg-line" />
            <div className="h-3 w-40 rounded bg-sunken" />
          </div>
        </div>
        <div className="h-4 w-24 rounded bg-sunken" />
      </div>
      <div className="h-px w-full bg-border" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-sunken" />
        <div className="h-4 w-11/12 rounded bg-sunken" />
        <div className="h-4 w-9/12 rounded bg-sunken" />
      </div>
    </div>
  );
}

function TicketsManagement({}: Props) {
  const t = useTranslations("ticketThread");
  const params = useParams();
  const id = params.id as string;
  const [page, setPage] = useState(1);
  const [messages, setMessages] = useState<ITicketMessage[]>([]);

  useEffect(() => {
    setPage(1);
    setMessages([]);
  }, [id]);

  const { data, isLoading, isFetching } = useGetMessagesByTicketIdQuery(
    {
      ticketId: id,
      paginationOptions: {
        page,
        limit: MESSAGES_STEP,
      },
    },
    { skip: !id },
  );

  useEffect(() => {
    const nextItems = data?.data?.items;
    if (!nextItems) return;

    setMessages((prev) => {
      if (page === 1) return nextItems;

      const prevIds = new Set(prev.map((item) => item.id));
      const uniqueNextItems = nextItems.filter((item) => !prevIds.has(item.id));
      return [...prev, ...uniqueNextItems];
    });
  }, [data, page]);

  const hasMoreMessages = data?.data?.meta?.hasNext;
  const isInitialLoading = messages.length === 0 && (isLoading || isFetching);

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  return (
    <div className=" col-span-1 md:col-span-2 h-full rounded-xl border bg-gray p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        {isInitialLoading
          ? Array.from({ length: MESSAGES_STEP }).map((_, index) => (
              <TicketCardSkeleton key={index} />
            ))
          : messages?.map((message) => (
              <TicketCard key={message.id} message={message} />
            ))}
      </div>

      {!isInitialLoading && hasMoreMessages ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mx-auto"
          onClick={handleLoadMore}
          disabled={isFetching}
        >
          {isFetching ? t("loadingMore") : t("loadMore")}
        </Button>
      ) : null}

      <AddTicket setPage={setPage} />
    </div>
  );
}

export default TicketsManagement;
