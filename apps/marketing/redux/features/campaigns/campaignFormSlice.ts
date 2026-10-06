// What the campaign wizard holds between its steps during one visit. Every step saves to the
// server on Next and reads its data back from it, so almost nothing lives here any more. The old
// slice kept a whole campaign and its id across visits, and the stored id beat the one in the
// address: New campaign wrote into an old draft (MKT-009). Now the id comes from the address, and
// the wizard clears this slice when it opens on another campaign and when it closes.
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MessagingAudienceSelection } from "@/lib/campaigns/types";

interface CampaignFormState {
  /** The campaign these values belong to (the address's ?id=), or null before Details is saved. */
  campaignId: string | null;
  /** Messaging: the audience picked on its step, which the API only takes with the message. */
  messagingAudience: MessagingAudienceSelection | null;
}

const initialState: CampaignFormState = { campaignId: null, messagingAudience: null };

const campaignFormSlice = createSlice({
  name: "campaignForm",
  initialState,
  reducers: {
    /** The wizard is now on this campaign. Values held for another campaign are dropped. */
    enterCampaign(state, action: PayloadAction<string | null>) {
      const id = action.payload;
      if (state.campaignId === id) return;
      // A new draft just created on Details keeps what was picked before it had an id.
      if (state.campaignId === null && id !== null) {
        state.campaignId = id;
        return;
      }
      return { ...initialState, campaignId: id };
    },
    setMessagingAudience(state, action: PayloadAction<MessagingAudienceSelection | null>) {
      state.messagingAudience = action.payload;
    },
    resetForm() {
      return initialState;
    },
  },
});

export const { enterCampaign, setMessagingAudience, resetForm } = campaignFormSlice.actions;
export default campaignFormSlice;
