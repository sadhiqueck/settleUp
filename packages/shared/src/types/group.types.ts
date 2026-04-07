export type GroupCategory = 'TRIP' | 'HOME' | 'OFFICE' | 'FOOD' | 'ROOMMATES' | 'OTHER'
export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export interface GroupMember {
  id: string
  userId: string
  name: string
  avatarUrl: string | null
  role: GroupRole
  isActive: boolean
}

export interface Group {
  id: string
  name: string
  description: string | null
  category: GroupCategory
  coverImage: string | null
  inviteCode: string
  memberCount: number
  myRole: GroupRole
  myBalance: number
  createdAt: string
}
