export type JobType = "full_time" | "part_time" | "contract" | "internship";
export type JobMode = "on_site" | "remote" | "hybrid";
export type JobStatus = "opened" | "on_hold" | "closed" | "cancelled";
export type ExperienceLevel =
  | "intern_level"
  | "entry_level"
  | "mid_level"
  | "senior_level";

export interface ICreateJobDTO {
  title: string;
  jobType: JobType;
  jobMode: JobMode;
  status: JobStatus;
  departmentId: number;
  location: string;
  experienceLevel: ExperienceLevel;
  requiredExperience: string;
  jobPostDate: string;
  startDate: string;
  untilClosed: boolean;
  endDate?: string;
  currencyType: string;
  salaryMin: number;
  salaryMax: number;
  bonusAvailability: boolean;
  healthInsurance: boolean;
  paidTimeOff: boolean;
  aboutCompanyDescription: string;
  jobRequirements: string;
  jobSkills: string[];
}

export interface IJobDepartment {
  id: number;
  name: string;
  description: string;
  managerUserId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface IJobUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isActive: boolean;
  userType: string | null;
}

export interface IJob {
  id: number;
  title: string;
  jobType: JobType;
  jobMode: JobMode;
  status: JobStatus;
  department: IJobDepartment;
  departmentId: number;
  location: string;
  experienceLevel: ExperienceLevel;
  requiredExperience: string;
  jobPostDate: string;
  startDate: string;
  untilClosed: boolean;
  endDate: string | null;
  currencyType: string;
  salaryMin: string;
  salaryMax: string;
  bonusAvailability: boolean;
  healthInsurance: boolean;
  paidTimeOff: boolean;
  aboutCompanyDescription: string;
  jobRequirements: string;
  jobSkills: string[];
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdByUser: IJobUser;
  updatedByUser: IJobUser;
  totalApplied: number;
  totalInterviews: number;
}

export interface IGetJobsParams {
  page?: number;
  limit?: number;
  status?: JobStatus | "all";
}

export type JobApplicationStage =
  | "applying"
  | "screening"
  | "interview"
  | "hiring"
  | "accepted"
  | "rejected"
  | "offer"
  | "hired";

export interface IJobApplication {
  id: number;
  jobId: number;
  job?: IJob;
  fullName: string;
  gender: string;
  email: string;
  nationality: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  university: string;
  qualification: string;
  graduationDate: string;
  resumeFileName: string;
  resumeFilePath: string;
  resumeMimeType: string;
  resumeFileSize: string;
  currentStage: JobApplicationStage;
  stages: IJobApplicationStage[];
  appointment?: IJobApplicationAppointment | null;
  stageUpdatedAt: string;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface IJobApplicationStage {
  id: number;
  applicationId: number;
  stage: JobApplicationStage;
  stageAt: string;
  note: string;
  updatedBy: string | null;
  createdAt: string;
  updatedByUser?: IJobUser;
}

export interface IJobApplicationAppointment {
  id: number;
  applicationId: number;
  startAt: string;
  endAt: string;
  interviewWith: string;
  interviewLink: string;
  note: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdByUser?: IJobUser;
}

export interface IGetJobApplicationsParams {
  jobId: number;
  page?: number;
  limit?: number;
}

export interface IUpdateJobDTO extends Partial<ICreateJobDTO> { }



export interface IGetJobOverviewItem {
  count: number;
  percentageChange: number;
}
export interface IGetJobOverview {
  openJobs: IGetJobOverviewItem;
  totalApplications: IGetJobOverviewItem,
  totalInterviews: IGetJobOverviewItem;
  rejected: IGetJobOverviewItem;
  accepted: IGetJobOverviewItem;
}

export interface IInterviewCalendarEvent {
  id: number;
  applicationId: number;
  startAt: string;
  endAt: string;
  interviewWith: string;
  interviewLink: string;
  note: string;
  createdBy: number;
  createdAt: string;
}

export interface ICreateApplicationInterviewDTO {
  startAt: string;
  endAt: string;
  interviewWith: string;
  interviewLink: string;
  note: string;
}

export interface IUpdateApplicationStageDTO {
  stage: JobApplicationStage;
  stageAt: string;
  note?: string;
}

export interface IApplicationNoteAuthor {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isActive: boolean;
  userType: string | null;
}

export interface IApplicationNote {
  id: number;
  applicationId: number;
  authorUserId: string;
  authorName: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author: IApplicationNoteAuthor;
}