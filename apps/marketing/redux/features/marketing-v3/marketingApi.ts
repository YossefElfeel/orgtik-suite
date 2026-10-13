import { baseApi } from "@/redux/app/baseApi";
import type {
  MarketingBootstrap,
  NativeTemplate,
  Sender,
  SocialThread,
  Journey,
  CampaignCandidate,
  QueuePost,
} from "@/types/marketing-v3";
const unwrap = <T>(response: { data: T }) => response.data;
export const marketingV3Api = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    marketingUtmDefaults: builder.query<
      {
        projectId: string;
        settings: {
          source: string;
          medium: string;
          campaign: string;
          recordedBy?: number;
          recordedAt?: string;
        };
      },
      void
    >({
      query: () => "/v3/utm",
      transformResponse: unwrap,
      providesTags: ["MarketingV3", "ActiveProject"],
    }),
    marketingQueue: builder.query<QueuePost[], void>({
      query: () => "/v3/queue",
      transformResponse: unwrap<QueuePost[]>,
      providesTags: ["MarketingV3", "Posts", "ActiveProject"],
    }),
    marketingCampaign: builder.query<CampaignCandidate, string>({
      query: (id) => `/v3/campaigns/${encodeURIComponent(id)}`,
      transformResponse: unwrap<CampaignCandidate>,
      providesTags: ["MarketingV3", "Campaigns"],
    }),
    marketingBootstrap: builder.query<MarketingBootstrap, void>({
      query: () => "/v3/bootstrap",
      transformResponse: unwrap<MarketingBootstrap>,
      providesTags: [
        "MarketingV3",
        "Projects",
        "ActiveProject",
        "Campaigns",
        "Posts",
        "Messaging",
      ],
    }),
    emailDesigns: builder.query<NativeTemplate[], void>({
      query: () => "/v3/email-designs",
      transformResponse: unwrap<NativeTemplate[]>,
      providesTags: ["MarketingV3", "Messaging", "ActiveProject"],
    }),
    marketingSenders: builder.query<Sender[], void>({
      query: () => "/v3/senders",
      transformResponse: unwrap<Sender[]>,
      providesTags: ["MarketingV3", "Messaging", "ActiveProject"],
    }),
    socialThreads: builder.query<SocialThread[], void>({
      query: () => "/v3/social-inbox",
      transformResponse: unwrap<SocialThread[]>,
      providesTags: ["MarketingV3", "ActiveProject"],
    }),
    marketingJourneys: builder.query<Journey[], void>({
      query: () => "/v3/journeys",
      transformResponse: unwrap<Journey[]>,
      providesTags: ["MarketingV3", "ActiveProject"],
    }),
    marketingChange: builder.mutation<
      unknown,
      { path: string; method: "POST" | "PATCH" | "DELETE"; body: unknown }
    >({
      query: ({ path, method, body }) => ({ url: path, method, body }),
      transformResponse: unwrap<unknown>,
      invalidatesTags: [
        "MarketingV3",
        "Campaigns",
        "Posts",
        "Messaging",
        "ActiveProject",
      ],
    }),
  }),
});
export const {
  useMarketingUtmDefaultsQuery,
  useMarketingQueueQuery,
  useMarketingCampaignQuery,
  useMarketingBootstrapQuery,
  useEmailDesignsQuery,
  useMarketingSendersQuery,
  useSocialThreadsQuery,
  useMarketingJourneysQuery,
  useMarketingChangeMutation,
} = marketingV3Api;
