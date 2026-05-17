import { apiSlice } from './apiSlice'

export const adApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAds: builder.query({
      query: () => '/ads',
      transformResponse: (response) => response?.ads || [],
      providesTags: ['Ad'],
    }),
    createAd: builder.mutation({
      query: (formData) => ({
        url: '/ads',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Ad'],
    }),
    deleteAd: builder.mutation({
      query: (id) => ({
        url: `/ads/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Ad'],
    }),
  }),
})

export const {
  useGetAdsQuery,
  useCreateAdMutation,
  useDeleteAdMutation,
} = adApiSlice
