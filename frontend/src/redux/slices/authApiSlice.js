import { apiSlice } from './apiSlice'

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth', 'User'],
    }),
    login: builder.mutation({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth', 'User'],
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'User'],
    }),
    refresh: builder.mutation({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'User'],
    }),
    getCurrentUser: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
  }),
})

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useRefreshMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
} = authApiSlice
