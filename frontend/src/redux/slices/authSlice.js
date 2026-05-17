import { createSlice } from '@reduxjs/toolkit'

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('currentUser')
    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    return null
  }
}

const storedUser = getStoredUser()

const initialState = {
  user: storedUser,
  token: localStorage.getItem('accessToken'),
  isAuthenticated: Boolean(storedUser),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload

      state.user = user
      state.token = token
      state.isAuthenticated = true
    },
    clearCredentials: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
    },
  },
})

export const { setCredentials, clearCredentials } = authSlice.actions

export default authSlice.reducer
