import { apiSlice } from './apiSlice'

export const cartFavoritesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query({
      query: () => '/users/cart',
      transformResponse: (response) => response?.cart || [],
      providesTags: ['Cart'],
    }),
    updateCart: builder.mutation({
      query: (cart) => ({
        url: '/users/cart',
        method: 'PUT',
        body: { cart },
      }),
      invalidatesTags: ['Cart'],
      async onQueryStarted(cart, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getCart', undefined, () => cart),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
    }),
    getFavorites: builder.query({
      query: () => '/users/favorites',
      transformResponse: (response) => response?.favorites || [],
      providesTags: ['Favorites'],
    }),
    updateFavorites: builder.mutation({
      query: (favorites) => ({
        url: '/users/favorites',
        method: 'PUT',
        body: { favorites },
      }),
      invalidatesTags: ['Favorites'],
      async onQueryStarted(favorites, { dispatch, queryFulfilled }) {
        console.log('updateFavorites optimistic payload', favorites)
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getFavorites', undefined, () => favorites),
        )
        try {
          const result = await queryFulfilled
          console.log('updateFavorites server response', result)
        } catch (error) {
          console.error('updateFavorites failed', error)
          patchResult.undo()
        }
      },
    }),
  }),
})

export const {
  useGetCartQuery,
  useUpdateCartMutation,
  useGetFavoritesQuery,
  useUpdateFavoritesMutation,
} = cartFavoritesApiSlice
