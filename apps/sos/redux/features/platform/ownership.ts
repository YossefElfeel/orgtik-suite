import { platformApi } from './platformApi';
import type { OwnershipTransferRequest, OwnershipTransferResult } from '@/types/ownership';

export const ownershipApi = platformApi.injectEndpoints({
  endpoints: builder => ({
    transferOwnership: builder.mutation<OwnershipTransferResult, OwnershipTransferRequest>({
      query: ({ memberId, operationId }) => ({
        url: '/ownership-transfer', method: 'POST', body: { memberId },
        headers: { 'Idempotency-Key': operationId },
      }),
      invalidatesTags: ['Team', 'Me'],
    }),
  }),
});

export const { useTransferOwnershipMutation } = ownershipApi;
