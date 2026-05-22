export interface User {
  id: string
  email: string
  name: string
  vpa: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt:string
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