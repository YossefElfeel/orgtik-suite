export interface DemoEmployee { id: string; name: string; email: string; phone: string; department: string; currency: "CHF" | "AED"; salary: number; taken: number; documentExpiry: string; }
export interface DemoPolicy { annual: number; carry: number; accrual: "annual" | "monthly"; }
export interface ProfileChange { id: string; employeeId: string; email: string; phone: string; status: "pending" | "approved" | "rejected"; }
export interface DemoOnboardingTask { id: string; titleKey: string; employeeId: string; owner: string; done: boolean; }
export interface DemoMail { id: string; employeeId: string; subjectKey: "profileApproved" | "profileRejected" | "expirySubject" | "onboardingSubject"; }
export interface PolicyFormValues { annual: string; carry: string; accrual: "annual" | "monthly"; }
export interface ProfileFormValues { email: string; phone: string; }
export interface ImportFormValues { csv: string; nameColumn: string; emailColumn: string; currencyColumn: string; }
export interface PeopleProps { employees: DemoEmployee[]; requests: ProfileChange[]; employeeId: string; canApprove: boolean; canRequest: boolean; onEmployee: (id: string) => void; onRequest: (values: ProfileFormValues) => void; onDecision: (id: string, status: "approved" | "rejected") => void; }
export interface PolicyProps { employees: DemoEmployee[]; employeeId: string; policy: DemoPolicy; canManage: boolean; onSave: (policy: DemoPolicy) => void; }
export interface ImportProps { employees: DemoEmployee[]; canManage: boolean; onImport: (employees: DemoEmployee[]) => void; }
export interface BankProps { employees: DemoEmployee[]; canManage: boolean; onDownload: () => void; }
export interface OnboardingProps { employees: DemoEmployee[]; tasks: DemoOnboardingTask[]; canManage: boolean; onToggle: (id: string) => void; onCreate: (employeeId: string) => void; }
export interface MailboxProps { employees: DemoEmployee[]; messages: DemoMail[]; canManage: boolean; onRemind: (employeeId: string) => void; }
