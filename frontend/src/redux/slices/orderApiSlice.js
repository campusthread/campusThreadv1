import { apiSlice } from './apiSlice'

export const orderApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (body) => ({
        url: '/orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order'],
    }),
    getOrderById: builder.query({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    getUserOrders: builder.query({
      query: (params = {}) => {
        const queryString = new URLSearchParams(params).toString()
        return queryString ? `/orders/user/orders?${queryString}` : '/orders/user/orders'
      },
      providesTags: ['Order'],
    }),
    getVendorOrders: builder.query({
      query: (params = {}) => {
        const queryString = new URLSearchParams(params).toString()
        return queryString ? `/orders/vendor/orders?${queryString}` : '/orders/vendor/orders'
      },
      providesTags: ['Order'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/orders/${id}/status`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Order', id }, 'Order'],
    }),
    initializePayment: builder.mutation({
      query: ({ orderId, email }) => ({
        url: `/orders/${orderId}/initialize-payment`,
        method: 'POST',
        body: { email },
      }),
    }),
    verifyPayment: builder.query({
      query: (reference) => `/orders/payment/verify?reference=${reference}`,
      providesTags: ['Order'],
    }),
  }),
})

export const {
  useCreateOrderMutation,
  useGetOrderByIdQuery,
  useGetUserOrdersQuery,
  useGetVendorOrdersQuery,
  useUpdateOrderStatusMutation,
  useInitializePaymentMutation,
  useVerifyPaymentQuery,
  useLazyVerifyPaymentQuery,
} = orderApiSlice
