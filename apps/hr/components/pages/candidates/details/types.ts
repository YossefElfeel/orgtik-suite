export type CandidateNote = {
  id: string;
  author: string;
  date: string;
  body: string;
};

export type CandidateDetail = {
  id: string;
  name: string;
  role: string;
  level: string;
  appliedDate: string;
  industry: string;
  avatarUrl?: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  nationality: string;
  dateOfBirth: string;
  university: string;
  graduationDate: string;
  qualification: string;
  jobTitle: string;
  jobIndustry: string;
  experienceLevel: string;
  experience: string;
  expectedSalary: string;
  skills: string[];
  about: string;
  notes: CandidateNote[];
};
