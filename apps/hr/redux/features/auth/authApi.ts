import { baseApi } from "@/redux/app/baseApi";
import { setUser } from "./authSlice";
import { SuccessResponse } from "@/types";



const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

  }),
});

export const {

} = authApi;
