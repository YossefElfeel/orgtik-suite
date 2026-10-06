export const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
export const WEBSOCKET_URL = (process.env.NEXT_PUBLIC_API_URL as string).replace(/\/api$/, "");

// export const SOS_URL = process.env.NEXT_PUBLIC_SOS_URL as string;
/** The platform's customer API (Phase E, USR): /v1/app on the same origin as the SOS API. */
export const PLATFORM_URL = `${(process.env.NEXT_PUBLIC_API_URL as string).replace(/\/api$/, "")}/v1/app`;
