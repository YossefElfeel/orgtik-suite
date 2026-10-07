export const PERMISSION_MODULES = [
  "dashboard",
  "employee",
  "attendance",
  "projects",
  "recruitment",
  "tickets",
  "finance",
  "departments",
  "messaging",
] as const;

export type PermissionModuleKey = (typeof PERMISSION_MODULES)[number];

export type ModuleCrud = {
  enabled: boolean;
  read: boolean;
  write: boolean;
  create: boolean;
  delete: boolean;
};

export type PermissionsState = Record<PermissionModuleKey, ModuleCrud>;

export const CRUD_ACTIONS = ["read", "write", "create", "delete"] as const;
export type CrudAction = (typeof CRUD_ACTIONS)[number];

export type ContractSection = {
  id: string;
  title: string;
  content: string;
};

export type EmployeeFormValues = {
  firstName: string;
  lastName: string;
  birthDate: Date | undefined;
  nationality: string;
  phoneNumber: string;
  email: string;
  personalTaxId: string;
  gender: string;
  maritalStatus: string;
  accommodationType: string;
  addressPostal: string;
  addressState: string;
  addressCity: string;
  addressLine1: string;

  nationalId: string;
  jobTitle: string;
  department: string;
  employeeType: string;
  experienceLevel: string;
  manager: string;
  status: string;
  employeeSkills: string[];
  workType: string;
  joinDate: Date | undefined;


  bankName: string;
  accountHolder: string;
  accountNumber: string;
  iban: string;
  salaryChf: string;
  bankCode: string;

  paymentType: "bank" | "instapay" | "wallet";
  instapayNumber: string;
  instapayAccountName: string;
  instapayLinkedAccount: string;
  walletName: string;
  walletPhoneNumber: string;
  walletAccountName: string;

  attachmentItems: (File | IEmployeeAttachment)[];

  baseSalary: string;
  housingAllowance: string;
  housingAllowanceType: "fixed" | "percentage";
  transportationAllowance: string;
  transportationAllowanceType: "fixed" | "percentage";
  otherAllowances: string;
  otherAllowancesType: "fixed" | "percentage";
  totalSalary: string;
  insurance: string;
  insuranceType: "fixed" | "percentage";
  tax: string;
  taxType: "fixed" | "percentage";
  netSalary: string;

  annualLeaveDays: string;
  casualLeaveDays: string;
  sickLeaveDays: string;
  unpaidLeave: string;
  contractAddsDays: string;
  totalDaysOff: string;

  contractType: string;
  contractStartDate: Date | undefined;
  contractEndDate: Date | undefined;
  trainingPeriod: string;
  noticePeriod: string;
  contractBody: ContractSection[];

  scopes: Record<string, { enabled: boolean; roleIds: number[] }>;
};

export function buildDefaultPermissions(): PermissionsState {
  const empty: ModuleCrud = {
    enabled: false,
    read: false,
    write: false,
    create: false,
    delete: false,
  };
  return PERMISSION_MODULES.reduce((acc, key) => {
    acc[key] = { ...empty };
    return acc;
  }, {} as PermissionsState);
}

export function getDefaultEmployeeFormValues(): EmployeeFormValues {
  return {
    firstName: "",
    lastName: "",
    birthDate: undefined,
    nationality: "",
    phoneNumber: "",
    email: "",
    personalTaxId: "",
    gender: "",
    maritalStatus: "",
    accommodationType: "own",
    addressPostal: "",
    addressState: "",
    addressCity: "",
    addressLine1: "",
    nationalId: "",
    jobTitle: "",
    department: "",
    employeeType: "",
    experienceLevel: "",
    manager: "",
    status: "",
    employeeSkills: [],
    workType: "",
    joinDate: undefined,

    bankName: "",
    accountHolder: "",
    accountNumber: "",
    iban: "",
    salaryChf: "",
    bankCode: "",
    paymentType: "bank",
    instapayNumber: "",
    instapayAccountName: "",
    instapayLinkedAccount: "",
    walletName: "",
    walletPhoneNumber: "",
    walletAccountName: "",
    attachmentItems: [],
    baseSalary: "",
    housingAllowance: "",
    housingAllowanceType: "percentage",
    transportationAllowance: "",
    transportationAllowanceType: "percentage",
    otherAllowances: "",
    otherAllowancesType: "percentage",
    totalSalary: "",
    insurance: "",
    insuranceType: "percentage",
    tax: "",
    taxType: "percentage",
    netSalary: "",
    annualLeaveDays: "",
    casualLeaveDays: "",
    sickLeaveDays: "",
    unpaidLeave: "",
    contractAddsDays: "",
    totalDaysOff: "",
    contractType: "",
    contractStartDate: undefined,
    contractEndDate: undefined,
    trainingPeriod: "",
    noticePeriod: "",
    contractBody: [
      {
        id: "clause-1",
        title: "Position & duties",
        content: `
           <p>1.1 This Employment Agreement (hereinafter referred to as the "Agreement") is executed on this 1st day of May, 2026, by and between:</p>
           <p><strong>FIRST PARTY:</strong><br>[Company Name], a company incorporated under the laws of the Arab Republic of Egypt.</p>
           <p><strong>SECOND PARTY:</strong><br>Mr. Ahmed Hassan, an Egyptian national, holding National ID No. [XXXXX].</p>
         `,
      },
      {
        id: "clause-2",
        title: "TERM AND PROBATION",
        content: `
           <p>2.1 The employment shall commence on May 1, 2026 (the "Effective Date").</p>
           <p>2.2 The Employee shall be subject to a probationary period of three (3) months starting from the Effective Date.</p>
         `,
      },
      {
        id: "clause-3",
        title: "Signature",
        content: `
           <p>For The Company : ________________________________________________</p>
           <p>For The Empolyee : ________________________________________________</p>
         `,
      },
    ],
    scopes: {},
  };
}

export interface ICreateEmployeeDTO {
  firstName: string;
  lastName: string;
  birthday: string; // YYYY-MM-DD
  gender: string;
  nationality: string;
  nationalIdOrPassport: string;
  phoneNumber: string;
  email: string;
  country: string;
  city: string;
  street: string;
  postCode: string;
  personalTaxId?: string;
  accommodationType: string;
}

export interface ICreateEmployeeResult
  extends Pick<IEmployee, "id" | "authUserId" | "employeeCode" | "firstName" | "lastName" | "email" | "completedSteps"> {
  status: "invited";
  isActive: false;
  onboardingComplete: false;
  invitation: {
    id: string;
    status: "pending";
    expiresAt: string;
  };
}

export interface ICreateEmployeeRequest {
  body: ICreateEmployeeDTO;
  operationId: string;
}

export interface IOnboardingStepDTO {
  step: "user_base_info" | "employee_info" | "payment_method" | "bank_info" | "salary" | "contract" | "days_off" | "permissions" | "attachments";
  data: {
    jobTitle?: string;
    departmentId?: number;
    employeeType?: string;
    joinDate?: string; // YYYY-MM-DD
    workLocation?: string;
    managerId?: number;
    status?: string;
    experienceLevel?: string;
    skills?: string[];
    [key: string]: any;
  } | null;
}

export interface IEmployeeSelectOption {
  id: string | number;
  fullName: string;
  avatarUrl?: string;
  avatar?: string | null;
  jobTitle?: string | null;
  employeeType?: string | null;
  employeeCode?: string | null;
  departmentName?: string | null;
}

export interface IEmployee {
  id: number;
  authUserId: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  jobTitle: string;
  departmentId: number;
  departmentName: string;
  managerId: number;
  managerName: string;
  status: string;
  employeeType: string;
  workLocation: string;
  joinDate: string;
  avatarUrl: string;
  isActive: boolean;
  onboardingComplete: boolean;
  completedSteps: string[];
  createdAt: string;
  updatedAt: string;
  user?:{
    id: number;
    username:string
    email:string
    firstName:string
    lastName:string
    avatar:string| null
    isActive:boolean
    userType:string
    employeeId:number
  }
}


export interface IEmployeeAttachment {
  id: number;
  employeeId: number;
  fileName: string;
  filePath: string;
  url: string;
  mimeType: string;
  fileSize: number;
  category: string;
  uploadedAt: string;
}

export interface IAttachmentResponse {
  items: IEmployeeAttachment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface IOrgChartNode {
  id: number;
  employeeCode: string;
  fullName: string;
  jobTitle: string;
  departmentName: string;
  avatarUrl: string;
  status: string;
  children: string[];
}

export interface IPersonalInformation {
  firstName: string;
  lastName: string;
  fullName: string;
  birthday: string;
  gender: "male" | "female" | string;
  nationality: string;
  nationalIdOrPassport: string;
  phoneNumber: string;
  email: string;
  personalTaxId: string;
  accommodationType: string;
  address: {
    country: string;
    city: string;
    street: string;
    postCode: string;
  };
}

export interface IEmployeeInformation {
  jobTitle: string;
  departmentId: number;
  departmentName: string;
  employeeType: string;
  workLocation: string;
  managerId: number;
  managerName: string;
  status: string;
  experienceLevel: string;
  joinDate: string;
  skills: string[];
}

export interface IPaymentDetails {
  paymentMethod: "bank" | "instapay" | "wallet" | string;
  bank?: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    iban: string;
    accountHolder: string;
  };
  instapay?: {
    registeredNumber: string;
    accountName: string;
    linkedAccount: string;
    paymentCycle: string;
  };
  wallet?: {
    walletName: string;
    phoneNumber: string;
    accountName: string;
  };
}

export interface ISalaryUpgradeHistory {
  id: number;
  currency?: string | null;
  baseSalary: number;
  paymentMethod: string;
  housingAllowanceValue: number;
  housingAllowanceType: string;
  transportationAllowanceValue: number;
  transportationAllowanceType: string;
  otherAllowancesValue: number;
  otherAllowancesType: string;
  insuranceValue: number;
  insuranceType: string;
  taxValue: number;
  taxType: string;
  totalSalary: number;
  netSalary: number;
  changedByUserId: number;
  recordedAt: string;
}

export interface ISalaryInformation {
  baseSalary: number;
  currency?: string | null;
  paymentMethod: string;
  housingAllowanceValue: number;
  housingAllowanceType: "percentage" | "fixed" | string;
  transportationAllowanceValue: number;
  transportationAllowanceType: "percentage" | "fixed" | string;
  otherAllowancesValue: number;
  otherAllowancesType: "percentage" | "fixed" | string;
  insuranceValue: number;
  insuranceType: "percentage" | "fixed" | string;
  taxValue: number;
  taxType: "percentage" | "fixed" | string;
  totalSalary: number;
  netSalary: number;
  salaryUpgradeHistory?: ISalaryUpgradeHistory[];
}

export interface SalaryInformationSectionProps {
  salaryInformation?: ISalaryInformation;
  isLoading?: boolean;
}

export interface BankInformationSectionProps {
  paymentDetails?: IPaymentDetails;
  salaryInformation?: ISalaryInformation;
  isLoading?: boolean;
}

export interface SalaryHistoryColumnsOptions {
  translate: (key: "columns.date" | "columns.baseSalary" | "columns.totalSalary" | "columns.netSalary") => string;
  money: (amount: number | null | undefined, currency?: string | null) => string;
  currency?: string | null;
}

export interface IDaysOffInformation {
  annualLeave: number;
  casualLeave: number;
  sickLeave: number;
  unpaidLeavePolicy: string;
  contractAdds: number;
  totalDaysOff: number;
}

export interface IContractDetails {
  contractType: string;
  startDate: string;
  endDate: string;
  trainingPeriod: string;
  noticePeriod: string;
  companyLogoFileId: string;
  sendForSignature: boolean;
}

export interface IPermissions {
  roleIds: string[];
  scopeDepartmentIds: string[];
  scopeEntityIds: string[];
  customPermissions: string[];
}

export interface IEmployeeDetail {
  id: number;
  authUserId: number;
  employeeCode: string;
  avatarUrl?: string;
  isActive: boolean;
  lastClockedIn: Date | string | null;
  lastMessaged: Date | string | null;
  onboardingComplete: boolean;
  completedSteps: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: any;
  personalInformation: IPersonalInformation;
  employeeInformation: IEmployeeInformation;
  paymentDetails: IPaymentDetails;
  salaryInformation: ISalaryInformation;
  daysOffInformation: IDaysOffInformation;
  contract: IContractDetails;
  permissions: IPermissions;
  attachmentCount: number;
}

export interface IEmployeeAttendanceItem {
  dateFrom: string;
  startWork: string;
  endWork: string;
  status: string;
  logHours: string;
  overtime: number;
  late: number;
}

export interface IEmployeeLeaveSummary {
  paidTimeOffDays: number;
  pendingApprovalDays: number;
  bookedDays: number;
  availableToBookDays: number;
  awaitingApprovalDays: number;
  usedDays: number;
  contractDaysPerYear: number;
  nationalHolidaysDays: number;
  inContractDays: number;
}

export interface IEmployeeLeaveItem {
  leaveType: string;
  dateFrom: string;
  duration: string;
  dateTo: string;
  status: string;
  note: string;
}

export interface IEmployeeLeavesResponse {
  summary: IEmployeeLeaveSummary;
  items: IEmployeeLeaveItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/** The employee wizard (FS-HR-9): "create" from Add employee, "edit" from a row's edit action. */
export interface CreateUpdateEmployeeSheetProps {
  /** The trigger (Add employee); the edit sheet opens from the address instead. */
  children?: React.ReactNode;
  mode: "create" | "edit";
}
