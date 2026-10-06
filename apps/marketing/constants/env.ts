// The SOS API: identity and the suite launcher's app list. Same defaults as @somion/sos-bar,
// whose launcher this app now draws itself; local-dev sets NEXT_PUBLIC_SOS_API_URL.
export const SOS_API_URL = process.env.NEXT_PUBLIC_SOS_API_URL
  ? `${process.env.NEXT_PUBLIC_SOS_API_URL}/api`
  : process.env.NODE_ENV === "production"
    ? "https://sosback.orgtik.org/api"
    : "https://sosback.orgtik.xyz/api";
