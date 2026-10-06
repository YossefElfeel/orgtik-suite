import { baseApi } from "@/redux/app/baseApi";
import type { IPaginated, PaginationOptions, SuccessResponse } from "@/types";
import type {
  Zone,
  ZoneCatalogCountry,
  ZoneCatalogLanguage,
  ZoneDTO,
  ZoneListItem,
  ZonesQueryParams,
} from "@/types/zones";

export const zonesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getZones: builder.query<
      SuccessResponse<IPaginated<Zone>>,
      ZonesQueryParams | void
    >({
      query: (params) => ({
        url: "/zones",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Zones"],
    }),
    getZonesList: builder.query<
      SuccessResponse<IPaginated<ZoneListItem>>,
      PaginationOptions | void
    >({
      query: (params) => ({
        url: "/zones/list",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Zones"],
    }),
    getZoneCountries: builder.query<
      SuccessResponse<IPaginated<ZoneCatalogCountry>>,
      PaginationOptions | void
    >({
      query: (params) => ({
        url: "/zones/catalog/countries",
        method: "GET",
        params: params ?? undefined,
      }),
    }),
    getZoneLanguages: builder.query<
      SuccessResponse<IPaginated<ZoneCatalogLanguage>>,
      PaginationOptions | void
    >({
      query: (params) => ({
        url: "/zones/catalog/languages",
        method: "GET",
        params: params ?? undefined,
      }),
    }),
    createZone: builder.mutation<SuccessResponse<Zone>, ZoneDTO>({
      query: (body) => ({
        url: "/zones",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Zones"],
    }),
    updateZone: builder.mutation<
      SuccessResponse<Zone>,
      { id: string; body: ZoneDTO }
    >({
      query: ({ id, body }) => ({
        url: `/zones/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Zones"],
    }),
    deleteZone: builder.mutation<SuccessResponse<unknown>, string>({
      query: (id) => ({
        url: `/zones/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Zones"],
    }),
  }),
});

export const {
  useGetZonesQuery,
  useGetZonesListQuery,
  useGetZoneCountriesQuery,
  useGetZoneLanguagesQuery,
  useCreateZoneMutation,
  useUpdateZoneMutation,
  useDeleteZoneMutation,
} = zonesApi;
