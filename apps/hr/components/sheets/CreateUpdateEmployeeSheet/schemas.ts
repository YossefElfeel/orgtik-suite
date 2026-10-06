import { z } from "zod";

/**
 * The employee wizard's step schemas. Each one is built with the caller's `t` for the
 * "createUpdateEmployee" namespace, so its messages are in the reader's language:
 *   const t = useTranslations("createUpdateEmployee");
 *   const schema = useMemo(() => makePersonalSchema(t), [t]);
 */

const EGYPTIAN_PHONE = /^(\+20|0)?1[0125][0-9]{8}$/;

export const makePersonalSchema = (t: (key: string) => string) =>
  z.object({
    firstName: z.string().min(1, t("errors.firstNameRequired")),
    lastName: z.string().min(1, t("errors.lastNameRequired")),
    password: z.string().min(6, t("errors.passwordMin")).optional().or(z.literal("")),
    birthDate: z.date({ message: t("errors.birthDateRequired") }),
    phoneNumber: z
      .string()
      .min(1, t("errors.phoneRequired"))
      .regex(/^\+?[0-9\s-]{7,20}$/, t("errors.invalidPhoneNumber")),
    email: z.string().email(t("errors.invalidEmail")),
    personalTaxId: z.string().optional(),
    gender: z.string().min(1, t("errors.genderRequired")),
    nationality: z.string().min(1, t("errors.nationalityRequired")),
    accommodationType: z.string().min(1, t("errors.accommodationRequired")),
    // The format depends on the country (lib/post-codes, checked in the step): CH has 4 digits, DE 5.
    addressPostal: z.string().min(1, t("errors.postCodeRequired")),
    addressState: z.string().min(1, t("errors.countryRequired")),
    addressCity: z.string().min(1, t("errors.cityRequired")),
    addressLine1: z.string().min(1, t("errors.addressRequired")),
    nationalId: z.string().min(1, t("errors.nationalIdRequired")),
  });

export const makeEmployeeSchema = (t: (key: string) => string) =>
  z.object({
    jobTitle: z.string().min(1, t("errors.jobTitleRequired")),
    department: z.string().min(1, t("errors.departmentRequired")),
    employeeType: z.string().min(1, t("errors.employeeTypeRequired")),
    experienceLevel: z.string().min(1, t("errors.experienceLevelRequired")),
    manager: z.string().optional(),
    status: z.string().min(1, t("errors.statusRequired")),
    employeeSkills: z.array(z.string()).optional(),
    workType: z.string().min(1, t("errors.workTypeRequired")),
    joinDate: z.coerce.date({ message: t("errors.joinDateRequired") }),
  });

export const makeBankSchema = (t: (key: string) => string) =>
  z
    .object({
      paymentType: z.enum(["bank", "instapay", "wallet"]),
      bankName: z.string().optional(),
      accountHolder: z.string().optional(),
      accountNumber: z.string().optional(),
      iban: z.string().optional(),
      salaryChf: z.string().optional(),
      bankCode: z.string().optional(),
      instapayNumber: z.string().optional(),
      instapayAccountName: z.string().optional(),
      instapayLinkedAccount: z.string().optional(),
      walletName: z.string().optional(),
      walletPhoneNumber: z.string().optional(),
      walletAccountName: z.string().optional(),
      currency: z.string().optional(),
      paymentCycle: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      const issue = (path: string, key: string) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t(key), path: [path] });

      if (data.paymentType === "bank") {
        if (!data.bankName) issue("bankName", "errors.bankNameRequired");
        if (!data.accountNumber) issue("accountNumber", "errors.accountNumberRequired");
        if (!data.accountHolder) issue("accountHolder", "errors.accountHolderRequired");
        if (!data.iban) {
          issue("iban", "errors.ibanRequired");
        } else if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(data.iban)) {
          issue("iban", "errors.invalidIban");
        }
      } else if (data.paymentType === "instapay") {
        if (!data.instapayNumber) {
          issue("instapayNumber", "errors.instapayNumberRequired");
        } else if (!EGYPTIAN_PHONE.test(data.instapayNumber)) {
          issue("instapayNumber", "errors.invalidEgyptianPhone");
        }
      } else if (data.paymentType === "wallet") {
        if (!data.walletName) issue("walletName", "errors.walletNameRequired");
        if (!data.walletPhoneNumber) {
          issue("walletPhoneNumber", "errors.phoneRequired");
        } else if (!EGYPTIAN_PHONE.test(data.walletPhoneNumber)) {
          issue("walletPhoneNumber", "errors.invalidEgyptianPhone");
        }
      }
    });

export const makeSalarySchema = (t: (key: string) => string) =>
  z.object({
    baseSalary: z
      .union([z.string(), z.number()])
      .refine((val) => val !== "" && val !== null, t("errors.baseSalaryRequired")),
    housingAllowance: z.union([z.string(), z.number()]).optional(),
    housingAllowanceType: z.enum(["fixed", "percentage"]),
    transportationAllowance: z.union([z.string(), z.number()]).optional(),
    transportationAllowanceType: z.enum(["fixed", "percentage"]),
    otherAllowances: z.union([z.string(), z.number()]).optional(),
    otherAllowancesType: z.enum(["fixed", "percentage"]),
    totalSalary: z.string().optional(),
    insurance: z.union([z.string(), z.number()]).optional(),
    insuranceType: z.enum(["fixed", "percentage"]),
    tax: z.union([z.string(), z.number()]).optional(),
    taxType: z.enum(["fixed", "percentage"]),
    netSalary: z.string().optional(),
  });

export const makeContractSchema = (t: (key: string) => string) =>
  z.object({
    contractType: z.string().min(1, t("errors.contractTypeRequired")),
    contractStartDate: z.coerce.date({ message: t("errors.startDateRequired") }),
    contractEndDate: z.coerce.date().optional().nullable(),
    trainingPeriod: z.string().optional(),
    noticePeriod: z.string().min(1, t("errors.noticePeriodRequired")),
    contractBody: z
      .array(
        z.object({
          id: z.string(),
          title: z.string().min(1, t("errors.sectionTitleRequired")),
          content: z.string().min(1, t("errors.sectionContentRequired")),
        })
      )
      .min(1, t("errors.contractSectionsRequired")),
  });

export const makeDaysOffSchema = (t: (key: string) => string) =>
  z.object({
    annualLeaveDays: z
      .union([z.string(), z.number()])
      .refine((val) => val !== "" && val !== null, t("errors.annualLeaveRequired")),
    casualLeaveDays: z
      .union([z.string(), z.number()])
      .refine((val) => val !== "" && val !== null, t("errors.casualLeaveRequired")),
    sickLeaveDays: z
      .union([z.string(), z.number()])
      .refine((val) => val !== "" && val !== null, t("errors.sickLeaveRequired")),
    unpaidLeave: z.string().min(1, t("errors.unpaidLeaveRequired")),
    contractAddsDays: z.union([z.string(), z.number()]).optional(),
    totalDaysOff: z.union([z.string(), z.number()]).optional(),
  });

export const permissionsSchema = z.object({
  scopes: z.record(
    z.string(),
    z.object({
      enabled: z.boolean(),
      roleIds: z.array(z.number()),
    })
  ),
});

export const attachmentsSchema = z.object({
  attachmentItems: z.array(z.any()),
});

export type PersonalFormValues = z.infer<ReturnType<typeof makePersonalSchema>>;
export type EmployeeInfoFormValues = z.infer<ReturnType<typeof makeEmployeeSchema>>;
export type BankFormValues = z.infer<ReturnType<typeof makeBankSchema>>;
export type SalaryFormValues = z.infer<ReturnType<typeof makeSalarySchema>>;
export type ContractFormValues = z.infer<ReturnType<typeof makeContractSchema>>;
export type DaysOffFormValues = z.infer<ReturnType<typeof makeDaysOffSchema>>;
export type PermissionsFormValues = z.infer<typeof permissionsSchema>;
export type AttachmentsFormValues = z.infer<typeof attachmentsSchema>;
