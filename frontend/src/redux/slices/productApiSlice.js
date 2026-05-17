import { apiSlice } from './apiSlice'

export const productApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params = {}) => {
        const queryString = new URLSearchParams(params).toString()
        return queryString ? `/products?${queryString}` : '/products'
      },
      transformResponse: (response) => response?.products || [],
      providesTags: ['Product'],
    }),
    getProduct: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    createProduct: builder.mutation({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }, 'Product'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Product', id }, 'Product'],
    }),
    uploadProductMedia: builder.mutation({
      query: ({ productId, file }) => {
        const formData = new FormData()
        formData.append('media', file)

        return {
          url: `/products/${productId}/media`,
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: (result, error, { productId }) => [{ type: 'Product', id: productId }, 'Product'],
    }),
    getVendorProducts: builder.query({
      query: (params = {}) => {
        const queryString = new URLSearchParams(params).toString()
        return queryString ? `/products/vendor/products?${queryString}` : '/products/vendor/products'
      },
      providesTags: ['Product'],
    }),
    addProductReview: builder.mutation({
      query: ({ productId, ...body }) => ({
        url: `/products/${productId}/reviews`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { productId }) => [{ type: 'Product', id: productId }],
    }),
  }),
})

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadProductMediaMutation,
  useGetVendorProductsQuery,
  useLazyGetVendorProductsQuery,
  useAddProductReviewMutation,
} = productApiSlice
