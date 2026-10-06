// Where things live. local-dev sets these in .env.local; the defaults are the local mock ports.
export const ADMIN_API = `${process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "http://localhost:4008"}/v1/admin`;
export const SOS_API = `${process.env.NEXT_PUBLIC_SOS_API_URL ?? "http://localhost:4000"}/api`;
export const SOS_URL = process.env.NEXT_PUBLIC_SOS_URL ?? "http://localhost:3013";
/** ADM-27 (content) and ADM-28 (suggestions) are the Website Manager's (D-019, D-029). */
export const WM_URL = process.env.NEXT_PUBLIC_WM_URL ?? "http://localhost:3007";
