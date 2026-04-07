export type SplitMethod = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES' | 'ITEMIZED'
export type ExpenseCategory =
  | 'FOOD'
  | 'TRANSPORT'
  | 'ACCOMMODATION'
  | 'SHOPPING'
  | 'ENTERTAINMENT'
  | 'UTILITIES'
  | 'OTHER'

export interface ExpenseSplit {
  userId: string
  name: string
  avatarUrl: string | null
  amount: number
}

export interface Expense {
  id: string
  title: string
  amount: number
  paidBy: { id: string; name: string; avatarUrl: string | null }
  splitMethod: SplitMethod
  category: ExpenseCategory
  receiptUrl: string | null
  notes: string | null
  date: string
  createdAt: string
  splits: ExpenseSplit[]
}