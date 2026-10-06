"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { makeConfigurationSchema, ConfigurationFormValues } from "@/schemas/configuration/configuration.schema";
import CompanyLogoUpload from "../CompanyLogoUpload";
import AttendanceScheduleFields from "../AttendanceScheduleFields";
import PublicHolidaysFields from "../PublicHolidaysFields";
import ConfigurationSkeleton from "./skeleton";
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation
} from "@/redux/features/settings/settingsApi";
import { mockConfiguration } from "@/mock/configuration";
import { toast } from "sonner";
import { useReqWithToaster } from "@/hooks/useReqWithToaster";

const ConfigurationForm: React.FC = () => {
  const t = useTranslations("configuration");
  const reqWithToaster = useReqWithToaster();
  const { data: settingsData, isLoading } = useGetSettingsQuery();
  const schema = useMemo(
    () =>
      makeConfigurationSchema({
        companyNameRequired: t("validation.companyNameRequired"),
        preferredLanguageRequired: t("validation.preferredLanguageRequired"),
        phoneRequired: t("validation.phoneRequired"),
        emailInvalid: t("validation.emailInvalid"),
        locationRequired: t("validation.locationRequired"),
        effectiveDateRequired: t("validation.effectiveDateRequired"),
        workingDaysMin: t("validation.workingDaysMin"),
        startTimeRequired: t("validation.startTimeRequired"),
        endTimeRequired: t("validation.endTimeRequired"),
        gracePeriodMin: t("validation.gracePeriodMin"),
        holidayNameRequired: t("validation.holidayNameRequired"),
        dateRequired: t("validation.dateRequired"),
      }),
    [t],
  );

  const [updateSettings] = useUpdateSettingsMutation();
  const [uploadAvatar] = useUploadAvatarMutation();
  const [deleteAvatar] = useDeleteAvatarMutation();

  const form = useForm<ConfigurationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: mockConfiguration as any,
  });

  useEffect(() => {
    if (settingsData?.data) {
      form.reset(settingsData.data as any);
    }
  }, [settingsData, form]);

  const onSubmit = (values: ConfigurationFormValues) => {
    reqWithToaster(t("toasts.updating"), async () => {
      const { avatar, ...profileWithoutAvatar } = values.companyProfile;
      const payload = {
        ...values,
        companyProfile: profileWithoutAvatar,
      };

      await updateSettings(payload as any).unwrap();

    })
  };

  const handleAvatarChange = (value: File | string | null) => {
    reqWithToaster(t("toasts.uploading"), async () => {
      if (value instanceof File) {
        const response = await uploadAvatar(value).unwrap();
        form.setValue("companyProfile.avatar", response.data.url);
      } else if (value === null) {
        await deleteAvatar().unwrap();
        form.setValue("companyProfile.avatar", null);
      }
    }
    )
  };

  if (isLoading)
    return <ConfigurationSkeleton />;


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Left Column: Company Profile */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("companyProfile")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <FormField
                control={form.control}
                name="companyProfile.avatar"
                render={({ field }) => (
                  <FormItem className="mx-auto md:mx-0">
                    <FormControl>
                      <CompanyLogoUpload
                        value={field.value}
                        onChange={handleAvatarChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <FormField
                  control={form.control}
                  name="companyProfile.companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("companyName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("placeholders.companyName")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyProfile.preferredLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("preferredLanguage")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("placeholders.language")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">{t("options.languages.en")}</SelectItem>
                          <SelectItem value="de">{t("options.languages.de")}</SelectItem>
                          <SelectItem value="fr">{t("options.languages.fr")}</SelectItem>
                          <SelectItem value="it">{t("options.languages.it")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyProfile.phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("phone")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("placeholders.phone")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyProfile.emailAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("email")}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder={t("placeholders.email")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyProfile.location"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{t("location")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("placeholders.location")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Attendance Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>{t("attendanceSettings")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceScheduleFields />
          </CardContent>
        </Card>

        {/* Public Holidays */}
        <Card>
          <CardContent>
            <PublicHolidaysFields />
          </CardContent>
        </Card>


        <div className="flex justify-end gap-4">
          {/* Cancel discards changes, so it is on only when there are some (it did nothing otherwise, HR-031). */}
          <Button type="button" variant="outline" disabled={!form.formState.isDirty} onClick={() => form.reset()}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {t("saveChanges")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ConfigurationForm;
