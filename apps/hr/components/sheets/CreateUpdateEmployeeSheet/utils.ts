import { type EmployeeFormValues, getDefaultEmployeeFormValues } from "@/types/employee";

export const WIZARD_STEP_TO_API_KEY: Record<string, string> = {
  personal: "user_base_info",
  employee: "employee_info",
  bank: "payment_method",
  salary: "salary",
  contract: "contract",
  daysOff: "days_off",
  permissions: "permissions",
  attachments: "attachments",
};

export const transformApiDataToFormValues = (
  stepKey: string,
  apiData: any
): Partial<EmployeeFormValues> => {
  if (!apiData) return {};

  switch (stepKey) {
    case "personal":
      return {
        firstName: apiData.firstName || "",
        lastName: apiData.lastName || "",
        birthDate: apiData.birthday ? new Date(apiData.birthday) : undefined,
        gender: apiData.gender || "",
        nationality: apiData.nationality || "",
        nationalId: apiData.nationalIdOrPassport || "",
        phoneNumber: apiData.phoneNumber || "",
        email: apiData.email || "",
        addressState: apiData.country || "",
        addressCity: apiData.city || "",
        addressLine1: apiData.street || "",
        addressPostal: apiData.postCode || "",
        personalTaxId: apiData.personalTaxId || "",
        accommodationType: apiData.accommodationType || "own",
        password: apiData.password || "",
      };
    case "employee":
      return {
        jobTitle: apiData.jobTitle || "",
        department: apiData.departmentId?.toString() || "",
        employeeType: apiData.employeeType || "",
        experienceLevel: apiData.experienceLevel || "",
        manager: apiData.managerId?.toString() || "",
        status: apiData.status || "",
        workType: apiData.workLocation || "",
        joinDate: apiData.joinDate ? new Date(apiData.joinDate) : undefined,
        employeeSkills: apiData.skills || [],
      };
    case "bank":
      const bankResult: any = {
        paymentType: apiData.paymentMethod || "bank",
        bankName: "",
        accountNumber: "",
        accountHolder: "",
        iban: "",
        currency: "EGP",
        paymentCycle: "monthly",
        instapayNumber: "",
        instapayAccountName: "",
        instapayLinkedAccount: "",
        walletName: "",
        walletPhoneNumber: "",
        walletAccountName: "",
      };
      if (apiData.bank) {
        bankResult.bankName = apiData.bank.bankName || "";
        bankResult.accountNumber = apiData.bank.accountNumber || "";
        bankResult.accountHolder = apiData.bank.accountHolderName || "";
        bankResult.iban = apiData.bank.iban || "";
        bankResult.currency = apiData.bank.currency || "EGP";
        bankResult.paymentCycle = apiData.bank.paymentCycle || "monthly";
      }
      if (apiData.instapay) {
        bankResult.instapayNumber = apiData.instapay.registeredNumber || "";
        bankResult.instapayAccountName = apiData.instapay.accountName || "";
        bankResult.instapayLinkedAccount = apiData.instapay.linkedAccount || "";
        bankResult.paymentCycle = apiData.instapay.paymentCycle || "monthly";
      }
      if (apiData.wallet) {
        bankResult.walletName = apiData.wallet.walletName || "";
        bankResult.walletPhoneNumber = apiData.wallet.phoneNumber || "";
        bankResult.walletAccountName = apiData.wallet.accountName || "";
        bankResult.paymentCycle = apiData.wallet.paymentCycle || "monthly";
      }
      return bankResult;
    case "salary":
      return {
        baseSalary: apiData.baseSalary?.toString() || "",
        housingAllowance: apiData.housingAllowanceValue?.toString() || "",
        housingAllowanceType: apiData.housingAllowanceType || "percentage",
        transportationAllowance: apiData.transportationAllowanceValue?.toString() || "",
        transportationAllowanceType: apiData.transportationAllowanceType || "percentage",
        otherAllowances: apiData.otherAllowancesValue?.toString() || "",
        otherAllowancesType: apiData.otherAllowancesType || "percentage",
        insurance: apiData.insuranceValue?.toString() || "",
        insuranceType: apiData.insuranceType || "percentage",
        tax: apiData.taxValue?.toString() || "",
        taxType: apiData.taxType || "percentage",
      };
    case "contract":
      const contractSections = apiData.contractSections || [];
      const contractBody = contractSections.length > 0
        ? contractSections.map((s: any, idx: number) => ({
          id: s.id || `clause-${idx + 1}`,
          title: s.title || "",
          content: s.content || "",
        }))
        : getDefaultEmployeeFormValues().contractBody;

      return {
        contractType: apiData.contractType || "",
        contractStartDate: apiData.startDate ? new Date(apiData.startDate) : undefined,
        contractEndDate: apiData.endDate ? new Date(apiData.endDate) : undefined,
        trainingPeriod: apiData.trainingPeriod || "",
        noticePeriod: apiData.noticePeriod || "",
        contractBody,
      };
    case "daysOff":
      return {
        annualLeaveDays: apiData.annualLeave?.toString() || "",
        casualLeaveDays: apiData.casualLeave?.toString() || "",
        sickLeaveDays: apiData.sickLeave?.toString() || "",
        unpaidLeave: apiData.unpaidLeavePolicy || "",
        contractAddsDays: apiData.contractAdds?.toString() || "",
        totalDaysOff: apiData.totalDaysOff?.toString() || "",
      };
    case "permissions":
      return {
        scopes: apiData.scopes || {},
      };
    default:
      return apiData;
  }
};
