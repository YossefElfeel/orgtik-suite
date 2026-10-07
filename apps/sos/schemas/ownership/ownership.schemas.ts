import { z } from 'zod';

export const ownershipSchema = z.object({ memberId: z.string().min(1, 'chooseMember') });
