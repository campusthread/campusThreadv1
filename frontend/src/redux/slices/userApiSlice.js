import { apiSlice } from './apiSlice'

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserProfile: builder.query({
      query: () => '/users/profile',
      providesTags: ['User'],
    }),
    updateUserProfile: builder.mutation({
      query: (body) => ({
        url: '/users/profile',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User', 'Users'],
    }),
    uploadUserProfilePicture: builder.mutation({
      query: (file) => {
        const formData = new FormData()
        formData.append('media', file)

        return {
          url: '/users/profile/picture',
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: ['User', 'Users'],
    }),
  }),
})

export const {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useUploadUserProfilePictureMutation,
} = userApiSlice
