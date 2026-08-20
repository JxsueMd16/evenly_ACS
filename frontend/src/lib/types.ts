import type { CategoryId } from "./categories"

export interface User {
  id: string
  name: string
  email: string
  avatarColor: string
}

export type SplitType = "equal" | "itemized"

export interface ExpenseParticipant {
  userId: string
  amount: number
}

export interface Expense {
  id: string
  groupId: string
  description: string
  amount: number
  paidById: string
  splitType: SplitType
  participants: ExpenseParticipant[]
  category: CategoryId
  createdAt: string
}

export interface Group {
  id: string
  name: string
  category: CategoryId
  theme: "ice" | "sky" | "pink"
  memberIds: string[]
  createdAt: string
}

export interface MemberBalance {
  userId: string
  /** positive: this member is owed money; negative: this member owes money */
  net: number
}
