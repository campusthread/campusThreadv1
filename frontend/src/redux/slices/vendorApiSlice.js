import { apiSlice } from './apiSlice'

export const vendorApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getVendorProfile: builder.query({
      query: () => '/vendors/profile',
      providesTags: ['Vendor'],
    }),
    updateVendorProfile: builder.mutation({
      query: (body) => ({
        url: '/vendors/profile',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Vendor'],
    }),
    uploadVendorProfilePicture: builder.mutation({
      query: (file) => {
        const formData = new FormData()
        formData.append('media', file)

        return {
          url: '/vendors/profile/picture',
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: ['Vendor'],
    }),
    getVendorStats: builder.query({
      query: () => '/vendors/stats',
      providesTags: ['Vendor'],
    }),
    getVendorDashboard: builder.query({
      query: () => '/vendors/dashboard',
      providesTags: ['Vendor'],
    }),
  }),
})

export const {
  useGetVendorProfileQuery,
  useLazyGetVendorProfileQuery,
  useUpdateVendorProfileMutation,
  useUploadVendorProfilePictureMutation,
  useGetVendorStatsQuery,
  useGetVendorDashboardQuery,
} = vendorApiSlice
