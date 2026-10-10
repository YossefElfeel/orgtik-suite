"use client";

import LogoUploadField from "@/components/ui/form/logo-upload-field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TextEditor } from "@/components/shared/HrRichTextEditor";
import { useAddMessageToTicketMutation } from "@/redux/features/ticket/ticketApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import {
  makeTicketMessageSchema,
  type TicketMessageFormInputValues,
  type TicketMessageFormValues,
} from "@/schemas/tickets/ticket.schemas";
import { Button } from "@orgtik/ui";
import { useAppSelector } from "@/redux/app/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/bindings/avatar";

type Props = {};

function AddTicket({ setPage }: { setPage: (page: number) => void }) {
  const storedProfile = useAppSelector((state) => state.auth.user);
  // The signed-in person is only known in the browser: show them after mount, so the server HTML
  // and the first client render match (the name used to break hydration on every ticket page).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const profileData = mounted ? storedProfile : null;

  const t = useTranslations("addTicketDialog");
  const tDetails = useTranslations("ticketDetails.labels");
  const addTicketFormSchema = useMemo(
    () => makeTicketMessageSchema({ descriptionRequired: t("validation.descriptionRequired") }),
    [t],
  );
  const { id } = useParams<{ id: string }>();
  const [addMessageToTicket, { isLoading }] = useAddMessageToTicketMutation();
  const form = useForm<TicketMessageFormInputValues, unknown, TicketMessageFormValues>({
    resolver: zodResolver(addTicketFormSchema),
    defaultValues: {
      description: "",
      attachment: [],
    },
  });

  const onSubmit = async (values: TicketMessageFormValues) => {
    if (!id) {
      return;
    }

    const formData = new FormData();
    formData.append("content", values.description);
    (values.attachment ?? []).forEach((file) => {
      formData.append("attachments", file);
    });

    await addMessageToTicket({ ticketId: id, body: formData }).unwrap();
    form.reset({
      description: "",
      attachment: [],
    });
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-5 rounded-lg border bg-raised p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={profileData?.avatar as string} />
            <AvatarFallback>
              {profileData?.firstName?.charAt(0)}{" "}
              {profileData?.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex h-full flex-col">
            <h5 className="text-body-lg font-medium">
              <bdi>
                {profileData?.firstName} {profileData?.lastName}
              </bdi>
            </h5>
            <p className="text-caption text-secondary">
              {tDetails("ticketCreator")}
            </p>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-border" />

      <Form {...form}>
        <form
          className="flex flex-col gap-5"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("descriptionLabel")}</FormLabel>
                <FormControl>
                  <TextEditor
                    aria-label={t("descriptionLabel")}
                    initialHtml={field.value}
                    onHtmlChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <LogoUploadField
            name="attachment"
            label={t("attachmentLabel")}
            multiple
          />
          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full h-10"
          >
            {isLoading ? t("sendingMessage") : t("sendMessage")}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default AddTicket;
