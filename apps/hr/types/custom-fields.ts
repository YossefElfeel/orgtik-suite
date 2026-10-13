export type EmployeeField = { id: string; name: string; type: "text" | "number" | "date" | "select"; options: string[] };
export type EmployeeFields = { definitions: EmployeeField[]; employees: { id: number; name: string; values: Record<string, string>; canEdit: boolean }[] };
export type EmployeeFieldForm = { definitions: { id: string; name: string; type: "text" | "number" | "date" | "select"; choices: string }[] };
