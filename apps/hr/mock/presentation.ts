import type { DemoEmployee, DemoOnboardingTask, DemoPolicy } from "@/types/presentation";
export const HR_DEMO_TODAY = "2026-10-08";
export const HR_DEMO_POLICY: DemoPolicy = { annual: 24, carry: 3, accrual: "monthly" };
export const HR_DEMO_IMPORT = "name,email,currency\nLayla Hassan,layla@presentation.test,CHF\nZiad Sami,ziad@presentation.test,AED";
export const HR_DEMO_PERSONAS: Record<string, string> = { current: "Nour Khaled", nour: "Nour Khaled", rana: "Rana Saad", omar: "Omar Farouk", salma: "Salma Nabil", mona: "Mona Adel", hoda: "Hoda Ashraf", hany: "Hany Samir" };
export function seedHrEmployees(workspace: string): DemoEmployee[] {
  if (workspace === "new") return [];
  const names = workspace === "spree" ? ["Hoda Ashraf", "Hany Samir", "Salma Nabil"] : workspace === "orgtik" ? ["Mona Adel", "Rana Saad", "Nour Khaled"] : ["Nour Khaled", "Rana Saad", "Salma Nabil"];
  return names.map((name, i) => ({ id: `person-${i}`, name, email: `${name.toLowerCase().replaceAll(" ", ".")}@presentation.test`, phone: `+41 00 000 00 0${i}`, department: ["design", "people", "operations"][i], currency: i === 2 ? "AED" : "CHF", salary: i === 2 ? 8200 : 4500 + i * 500, taken: [8, 5, 2][i], documentExpiry: ["2026-10-22", "2027-04-01", "2026-10-15"][i] }));
}
export function onboardingTasks(employeeId: string): DemoOnboardingTask[] { return ["welcomeTask", "equipmentTask", "policyTask"].map((titleKey, i) => ({ id: `${employeeId}-${titleKey}`, titleKey, employeeId, owner: i === 1 ? "Hany Samir" : "Rana Saad", done: false })); }
export function accruedLeave(policy: DemoPolicy) { return policy.accrual === "monthly" ? Math.round(policy.annual * 9 / 12 * 100) / 100 : policy.annual; }
export function parseHrCsv(text: string): string[][] {
  const rows: string[][] = [], row: string[] = []; let value = "", quoted = false;
  for (let i = 0; i < text.length; i++) { const char = text[i]; if (char === '"') { if (quoted && text[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; } else if (!quoted && [",", "\n", "\r"].includes(char)) { row.push(value); value = ""; if (char !== ",") { if (char === "\r" && text[i + 1] === "\n") i++; if (row.some(cell => cell.trim())) rows.push([...row]); row.length = 0; } } else value += char; }
  if (quoted) throw new Error("csv"); row.push(value); if (row.some(cell => cell.trim())) rows.push(row); return rows;
}
export function demoBankFile(employees: DemoEmployee[], region: "CH" | "UAE"): string {
  const currency = region === "CH" ? "CHF" : "AED", rows = employees.filter(person => person.currency === currency);
  return ["ORGTIK PRESENTATION SAMPLE — NOT FOR BANK SUBMISSION", `region=${region};currency=${currency};period=2026-10;status=SIMULATED`, "name,currency,amount", ...rows.map(person => `"${person.name.replaceAll('"', '""')}",${person.currency},${person.salary.toFixed(2)}`)].join("\r\n");
}
