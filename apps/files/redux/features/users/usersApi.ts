import { baseApi } from "@/redux/app/baseApi";

// User type
export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
}

// API Response type
export interface UsersResponse {
    success: boolean;
    message: string;
    data: User[];
}

export const usersApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getUsers: builder.query<
            UsersResponse,
            void
        >({
            query: () => ({
                url: "/users",
                method: "GET",
            }),
            providesTags: ["Users"],
        }),
    })
})

export const { useGetUsersQuery } = usersApi;