export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  isEmailVerified: boolean
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}