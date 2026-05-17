import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { setCredentials, clearCredentials } from './authSlice'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token || localStorage.getItem('accessToken')

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    return headers
  },
})

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result.error && result.error.status === 401) {
    // Try to refresh the token
    const refreshResult = await baseQuery({ url: '/auth/refresh', method: 'POST' }, api, extraOptions)

    if (refreshResult.data) {
      // Store the new token
      const newToken = refreshResult.data.token
      const newUser = refreshResult.data.user

      localStorage.setItem('accessToken', newToken)
      localStorage.setItem('currentUser', JSON.stringify(newUser))

      api.dispatch(setCredentials({ user: newUser, token: newToken }))

      // Retry the original request with new token
      result = await baseQuery(args, api, extraOptions)
    } else {
      // Refresh failed, clear credentials
      api.dispatch(clearCredentials())
      localStorage.removeItem('accessToken')
      localStorage.removeItem('currentUser')
    }
  }

  return result
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'User', 'Users', 'Product', 'Products', 'Vendor', 'Vendors', 'Order', 'Orders', 'Brand', 'Brands', 'Category', 'Categories', 'Ad', 'Ads', 'Admin', 'Cart', 'Favorites'],
  endpoints: () => ({}),
})
