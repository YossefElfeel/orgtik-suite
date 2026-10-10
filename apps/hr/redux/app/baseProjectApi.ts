import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/redux/app/store";
import { API_URL } from "@/constants";

const baseTaskQuery = fetchBaseQuery({
  baseUrl: (API_URL || "").replace(/\/api\/?$/, ""),

  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth?.token;

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

export const baseProjectApi = createApi({
  reducerPath: "baseProjectApi",
  baseQuery: baseTaskQuery,
  tagTypes: ["Project", "Projects", "Task"],
  endpoints: (builder) => ({}),
});
