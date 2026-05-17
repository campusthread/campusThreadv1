import { apiSlice } from './apiSlice'

export const brandApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBrands: builder.query({
      query: () => '/brands',
      providesTags: ['Brand'],
      transformResponse: (response) => response?.brands || [],
    }),
    createBrand: builder.mutation({
      query: (body) => ({
        url: '/brands',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Brand'],
    }),
    deleteBrand: builder.mutation({
      query: (id) => ({
        url: `/brands/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Brand'],
    }),
  }),
})

export const {
  useGetBrandsQuery,
  useCreateBrandMutation,
  useDeleteBrandMutation,
} = brandApiSlice
