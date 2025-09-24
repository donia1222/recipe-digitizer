export interface PendingRecipe {
  id: string
  title: string
  user: string
  date: string
  status: "pending" | "approved" | "rejected"
}

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "worker" | "guest"
  status: "active" | "inactive"
  lastLogin: string
}

export interface SubAdmin {
  id: string
  name: string
  email: string
  permissions: string[]
  createdDate: string
  status: "active" | "inactive"
}

export interface HistoryItem {
  id: number
  recipeId?: string
  image: string
  analysis: string
  date: string
  folderId?: string
  title?: string
  isFavorite?: boolean
  user_id?: string
}