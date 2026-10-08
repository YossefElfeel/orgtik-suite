import { baseApi } from "@/redux/app/baseApi";
import { readClientSession } from "@orgtik/ui/auth";
import { availabilityNamespace, validateAvailability, type AvailabilityData, type AvailabilityRequest } from "@/lib/calendar-availability";

export const calendarApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCalendarAvailability: builder.query<AvailabilityData, AvailabilityRequest>({
      async queryFn(arg, _api, _options, query) {
        const current = () => availabilityNamespace(readClientSession()?.workspaceContext) === arg.namespace;
        if (!current()) return { error: { status: 409, data: { code: "workspace_changed" } } };
        const params = new URLSearchParams({ fromDate: arg.fromDate, toDate: arg.toDate });
        const result = await query({ url: `calendar/availability?${params}`, method: "GET" });
        if (!current()) return { error: { status: 409, data: { code: "workspace_changed" } } };
        if (result.error) return { error: result.error };
        const envelope = result.data as { success?: boolean; data?: unknown };
        const data = envelope?.success === true ? validateAvailability(envelope.data, arg) : null;
        return data ? { data } : { error: { status: 502, data: { code: "invalid_availability" } } };
      },
      keepUnusedDataFor: 0,
    }),
  }),
});

export const { useGetCalendarAvailabilityQuery } = calendarApi;
