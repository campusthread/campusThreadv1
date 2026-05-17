import { apiSlice } from './apiSlice'

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Analytics endpoints
    getAnalytics: builder.query({
      query: () => '/admin/analytics',
      providesTags: ['Admin'],
    }),

    // User management endpoints
    getAllUsers: builder.query({
      query: ({ role, search, page = 1, limit = 10 } = {}) => {
        const params = new URLSearchParams()
        if (role) params.append('role', role)
        if (search) params.append('search', search)
        params.append('page', page)
        params.append('limit', limit)
        return `/admin/users?${params}`
      },
      providesTags: ['Users'],
    }),

    getUserById: builder.query({
      query: (id) => `/admin/users/${id}`,
      providesTags: ['Users'],
    }),

    updateUserRole: builder.mutation({
      query: ({ userId, role }) => ({
        url: `/admin/users/${userId}/role`,
        method: 'PUT',
        body: { role },
      }),
      invalidatesTags: ['Users'],
    }),

    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `/admin/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),

    // Vendor approval endpoints
    getPendingVendors: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => `/admin/vendors/pending?page=${page}&limit=${limit}`,
      providesTags: ['Vendors'],
    }),

    approveVendor: builder.mutation({
      query: (vendorId) => ({
        url: `/admin/vendors/${vendorId}/approve`,
        method: 'PUT',
      }),
      invalidatesTags: ['Vendors', 'Users'],
    }),

    rejectVendor: builder.mutation({
      query: ({ vendorId, reason }) => ({
        url: `/admin/vendors/${vendorId}/reject`,
        method: 'PUT',
        body: { reason },
      }),
      invalidatesTags: ['Vendors', 'Users'],
    }),

    getAllVendors: builder.query({
      query: ({ status, search, page = 1, limit = 10 } = {}) => {
        const params = new URLSearchParams()
        if (status) params.append('status', status)
        if (search) params.append('search', search)
        params.append('page', page)
        params.append('limit', limit)
        return `/admin/vendors?${params}`
      },
      providesTags: ['Vendors'],
    }),

    // Dashboard stats
    getDashboardStats: builder.query({
      query: () => '/admin/stats',
      providesTags: ['Admin'],
    }),
    getAllOrders: builder.query({
      query: ({ page = 1, limit = 50 } = {}) => {
        const params = new URLSearchParams()
        params.append('page', page)
        params.append('limit', limit)
        return `/admin/orders?${params}`
      },
      transformResponse: (response) => ({
        orders: response?.orders || [],
        total: response?.total || 0,
        page: response?.page || 1,
        pages: response?.pages || 1,
      }),
      providesTags: ['Order'],
    }),
  }),
})

export const {
  useGetAnalyticsQuery,
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  useGetPendingVendorsQuery,
  useApproveVendorMutation,
  useRejectVendorMutation,
  useGetAllVendorsQuery,
  useGetDashboardStatsQuery,
  useGetAllOrdersQuery,
} = adminApiSlice
