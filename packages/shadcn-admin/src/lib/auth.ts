import { createAuthClient } from 'better-auth/react'
import { ENV_KEYS } from './constants'

export const authClient = createAuthClient({
  baseURL: ENV_KEYS.REST_API_URL.concat('/auth'),
})
