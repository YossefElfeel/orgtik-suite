"use client";
import { useCallback, useEffect, useMemo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import TextFormEle from "@/components/ui/form/text-form-element";
import SelectFormEle, {
  SELECT_EMPTY_VALUE,
} from "@/components/ui/form/select-form-element";
import RadioGroupFormEle from "@/components/ui/form/radio-group-form-element";
import { DateTimeFormElement } from "@/components/ui/form/date-time-form-element";

import type { ICreateEmployeeDTO, IOnboardingStepDTO } from "@/types/employee";
import { ALL_COUNTRIES } from "@/constants/countries";
import { makePersonalSchema, type PersonalFormValues } from "../schemas";
import { isValidPostCode, postCodeFormat } from "@/lib/post-codes";
import z from "zod";
import { Button } from "@/components/ui/button";
import { useEmployeeWizard } from "../EmployeeWizardContext";
import { useCreateEmployeeMutation, useUpdateOnboardingStepMutation, useGetOnboardingStepQuery } from "@/redux/features/employee/employeeApi";
import { useReqWithToaster } from "@/hooks/useReqWithToaster";
import { WIZARD_STEP_TO_API_KEY, transformApiDataToFormValues } from "../utils";
import { cn } from "@/lib/utils";
import { onFormErrorDisplay } from "@/lib/form-error-toast";


const RequiredLabel = ({ label }: { label: string }) => (
  <span>
    {label} <span className="text-destructive">*</span>
  </span>
);

type FormType = PersonalFormValues;

export function PersonalInfoStep() {
  const { data, onNext, onBack, isEdit, isLastStep, setCompletedSteps } = useEmployeeWizard();
  const [createEmployee] = useCreateEmployeeMutation();
  const [updateOnboarding] = useUpdateOnboardingStepMutation();
  const t = useTranslations("createUpdateEmployee");
  const reqWithToaster = useReqWithToaster();
  const locale = useLocale();
  // The country's name in the reader's language, for the post code message.
  const regionName = useCallback(
    (code: string) => {
      try {
        return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
      } catch {
        return code;
      }
    },
    [locale],
  );
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("employee_id");
  const schema = useMemo(() => {
    return makePersonalSchema(t).superRefine((data, ctx) => {
      if (data.addressPostal && !isValidPostCode(data.addressPostal, data.addressState)) {
        const { example } = postCodeFormat(data.addressState);
        const country = data.addressState ? regionName(data.addressState) : "";
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: example ? t("errors.postCodeFor", { country, example }) : t("errors.postCode"),
          path: ["addressPostal"],
        });
      }
      if (!isEdit && (!data.password || data.password.length < 6)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("errors.passwordRequired"),
          path: ["password"],
        });
      }
    });
  }, [isEdit, t, regionName]);

  const form = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: data as any,
    mode: "onBlur",
  });

  const { data: stepApiResponse } = useGetOnboardingStepQuery(
    { id: employeeId!, step: WIZARD_STEP_TO_API_KEY.personal },
    { skip: !employeeId }
  );

  useEffect(() => {
    if (stepApiResponse?.success && stepApiResponse.data?.data) {
      const transformed = transformApiDataToFormValues("personal", stepApiResponse.data.data);
      form.reset(transformed as any);
    }

  }, [stepApiResponse, form]);

  const genderOptions = [
    { value: "male", label: t("options.gender.male") },
    { value: "female", label: t("options.gender.female") },
    { value: "other", label: t("options.gender.other") },
  ];

  const onSubmit = async (values: FormType) => {
    const payload: ICreateEmployeeDTO = {
      firstName: values.firstName,
      lastName: values.lastName,
      password: values.password || undefined,
      birthday: values.birthDate ? new Date(values.birthDate).toISOString().split("T")[0] : "",
      gender: values.gender,
      nationality: values.nationality,
      nationalIdOrPassport: values.nationalId,
      phoneNumber: values.phoneNumber,
      email: values.email,
      country: values.addressState,
      city: values.addressCity,
      street: values.addressLine1,
      postCode: values.addressPostal,
      personalTaxId: values.personalTaxId,
      accommodationType: values.accommodationType
    };

    if (employeeId) {
      await reqWithToaster(t("toasts.updatingEmployeeInfo"), async () => {
        const onboardingPayload: IOnboardingStepDTO = {
          step: "user_base_info",
          data: payload,
        };
        const res = await updateOnboarding({
          id: employeeId,
          body: onboardingPayload,
        }).unwrap();

        if (res.data?.completedSteps) {
          setCompletedSteps(res.data.completedSteps);
        }

        onNext(values);
      });
    } else {
      await reqWithToaster(t("toasts.creatingEmployee"), async () => {
        const res = await createEmployee(payload).unwrap();
        const newEmployeeId = String(res.data.id);

        if (res.data?.completedSteps) {
          setCompletedSteps(res.data.completedSteps);
        }

        onNext(values, { "employee_id": newEmployeeId });
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onFormErrorDisplay)} className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-lg font-medium leading-6 text-foreground">
            {t("steps.personal.heading")}
          </h2>
          <p className="text-xs leading-4 text-muted-foreground">
            {t("steps.personal.description")}
          </p>
        </header>

        <div className="flex flex-col gap-4">
          <TextFormEle
            form={form}
            name="firstName"
            label={<RequiredLabel label={t("fields.firstName")} />}
            placeholder={t("placeholders.firstName")}
          />
          <TextFormEle
            form={form}
            name="lastName"
            label={<RequiredLabel label={t("fields.lastName")} />}
            placeholder={t("placeholders.lastName")}
          />
          <TextFormEle
            form={form}
            name="password"
            type="password"
            label={t("fields.password")}
            placeholder={t("placeholders.password")}
          />
          <DateTimeFormElement
            form={form}
            name="birthDate"
            label={<RequiredLabel label={t("fields.birthDate")} />}
            showTime={false}
          />
          <RadioGroupFormEle
            form={form}
            name="gender"
            label={<RequiredLabel label={t("fields.gender")} />}
            options={genderOptions}
            orientation="horizontal"
          />
          <SelectFormEle
            form={form}
            name="nationality"
            label={<RequiredLabel label={t("fields.nationality")} />}
            options={ALL_COUNTRIES}
            emptyOptionValue={SELECT_EMPTY_VALUE}
            placeholder={t("placeholders.nationality")}
          />
          <TextFormEle
            form={form}
            name="phoneNumber"
            label={<RequiredLabel label={t("fields.phoneNumber")} />}
            placeholder={t("placeholders.phone")}
          />
          <TextFormEle
            form={form}
            name="email"
            label={<RequiredLabel label={t("fields.email")} />}
            type="email"
            placeholder={t("placeholders.email")}
          />
          <TextFormEle
            form={form}
            name="personalTaxId"
            label={t("fields.personalTaxId")}
            placeholder={t("placeholders.personalTaxId")}
          />
          <TextFormEle
            form={form}
            name="nationalId"
            label={<RequiredLabel label={t("fields.nationalId")} />}
            placeholder={t("placeholders.nationalId")}
          />
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <header className="space-y-1">
            <h3 id="accommodation-heading" className="text-lg font-medium leading-6 text-foreground">
              {t("steps.personal.accommodationHeading")}
            </h3>
            <p className="text-xs leading-4 text-muted-foreground">
              {t("steps.personal.accommodationDescription")}
            </p>
          </header>

          <FormField
            control={form.control}
            name="accommodationType"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    aria-labelledby="accommodation-heading"
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    {[
                      { id: "company", value: "company_housing" },
                      { id: "allowance", value: "housing_allowance" },
                      { id: "own", value: "own_accommodation" },
                    ].map((option) => {
                      const isSelected = field.value === option.value;
                      return (
                        <label
                          key={option.value}
                          className={cn(
                            "relative flex gap-3 p-4 rounded-xl border transition-all cursor-pointer",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:border-border/80"
                          )}
                        >
                          <RadioGroupItem
                            value={option.value}
                            id={option.value}
                            aria-labelledby={`${option.value}-label`}
                            aria-describedby={`${option.value}-description`}
                            className={cn(
                              "size-5 -mt-0.5 border-[1.5px]",
                              isSelected ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                          <div className="space-y-1">
                            <p id={`${option.value}-label`} className="text-sm font-semibold text-foreground">
                              {t(`steps.personal.accommodationOptions.${option.id}.label`)}
                            </p>
                            <p id={`${option.value}-description`} className="text-xs text-muted-foreground">
                              {t(`steps.personal.accommodationOptions.${option.id}.description`)}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <header className="space-y-1">
            <h3 className="text-lg font-medium leading-6 text-foreground">
              {t("steps.personal.addressHeading")}
            </h3>
            <p className="text-xs leading-4 text-muted-foreground">
              {t("steps.personal.addressDescription")}
            </p>
          </header>
          <SelectFormEle
            form={form}
            name="addressState"
            label={<RequiredLabel label={t("fields.addressState")} />}
            options={ALL_COUNTRIES}
            emptyOptionValue={SELECT_EMPTY_VALUE}
            placeholder={t("placeholders.state")}
          />
          <TextFormEle
            form={form}
            name="addressCity"
            label={<RequiredLabel label={t("fields.addressCity")} />}
            placeholder={t("placeholders.city")}
          />
          <TextFormEle
            form={form}
            name="addressLine1"
            label={<RequiredLabel label={t("fields.addressLine1")} />}
            placeholder={t("placeholders.address")}
          />
          <TextFormEle
            form={form}
            name="addressPostal"
            label={<RequiredLabel label={t("fields.addressPostal")} />}
            placeholder={t("placeholders.postal")}
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <Button
            className="min-w-32"
            type="button"
            size="lg"
            variant="outline"
            onClick={onBack}
          >
            {t("nav.back")}
          </Button>
          <Button type="submit" className="min-w-32" size="lg">
            {isLastStep
              ? isEdit
                ? t("nav.save")
                : t("nav.submit")
              : t("nav.next")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
