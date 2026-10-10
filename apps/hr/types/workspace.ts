export type HrMail = { id:string;subject:string;body:string;to:string;createdAt:string;simulated:true;readAt:string|null };
export type HrGoal = { id:string;title:string;dueDate:string;progress:number };
export type HrReview = { id:string;summary:string;rating:number;createdAt:string };
export type HrProfileRequest = { id:string;email:string;phoneNumber:string;status:'pending'|'approved'|'rejected' };
export type HrCorrection = { id:string;date:string;reason:string;checkInAt:string;checkOutAt:string;status:'pending'|'approved'|'rejected' };
export type HrChecklistItem = { id:string;title:string;done:boolean;taskId:string|null };
export type HrEmployee = { id:number;fullName:string;firstName:string;lastName:string;email:string;phoneNumber:string;jobTitle:string;departmentName:string|null;managerId:number|null;joinDate:string;status:string;onboardingComplete:boolean;profileRequests:HrProfileRequest[];goals:HrGoal[];reviews:HrReview[];documents:{id:string;title:string;expiresAt:string}[];mailbox:HrMail[];corrections:HrCorrection[];checklist:HrChecklistItem[];letters:{id:string;kind:string;createdAt:string}[];address?:{country:string;city:string;street:string;postCode:string} };
export type HrBalance = {employeeId:number;name:string;earned:number;carry:number;used:number;available:number;asOf:string};
export type HrCandidate = { id:number;fullName:string;email:string;coverLetter?:string;currentStage:string;job?:{title:string};workspaceFeatures:{scorecards:{id:string;summary:string;score:number}[];offer:{title:string;startDate:string;salary:number;currency:string;status:string}|null;employeeId:number|null} };
export type HrWorkspace = {now:string;canManage:boolean;canReview:boolean;self:HrEmployee|null;employees:HrEmployee[];directory:{id:number;name:string;jobTitle:string;department:string|null;email:string;avatarUrl:string}[];careersEnabled:boolean;policyConfigured:boolean;policy:{annual:number;carry:number;accrual:'annual'|'monthly'};balances:HrBalance[];holidays:{name:string;date:string;country?:string}[];jobs:{id:number;title:string;status:string}[];applications:HrCandidate[];clock:{id:number;checkInAt:string}|null};
export type HrFieldSpec = {key:string;label:string;type?:'text'|'email'|'number'|'date'|'datetime-local'|'textarea'|'select';options?:{value:string;label:string}[];optional?:boolean};
export type HrActionSpec = {title:string;path:string;description?:string;submitLabel?:string;operationId?:string;method?:string;fields:HrFieldSpec[];defaults?:Record<string,string>;body?:(values:Record<string,string>)=>unknown};
export type HrReport = {asOf:string;headcount:number;joinedThisMonth:number;departedThisMonth:number;turnoverRate:number;byDepartment:{name:string;count:number}[]};
export type HrWorkspaceView = 'profile'|'directory'|'team'|'policies'|'onboarding'|'documents'|'mailbox'|'attendance'|'performance'|'recruiting'|'holidays'|'reports'|'import';

export type PublicCareerJob={id:number;title:string;jobType:string;jobMode:string;location:string;experienceLevel:string;requiredExperience:string;aboutCompanyDescription:string;jobRequirements:string;jobSkills:string[]};
export type PublicCareers={workspaceId:string;companyName:string;acceptingApplications:boolean;jobs:PublicCareerJob[]};
export type PublicApplication={applicationId:number;jobId:number;status:'received';submittedAt:string};

export type HrCareerOpening={id:number;title:string;description?:string;location:string};

export type HrImportOutcome={email:string;status:string;employeeId?:number};
export type HrImportResponse={outcomes:HrImportOutcome[]};
export type HrTaskReference={id:number;title:string;status:string;path:string};
export type HrTaskProject={id:string|number;title:string;sections?:{id:string|number;title:string}[]};
export type HrTaskCreated={task:{id:string|number}};
export type HrToolPlan={id:string;trialDays:number};

export type HrEffectiveChecklistStep=HrChecklistItem&{complete:boolean;task?:HrTaskReference};
