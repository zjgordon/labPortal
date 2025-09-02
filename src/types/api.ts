// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Card types
export interface Card {
  id: string
  title: string
  description: string
  url: string
  healthPath: string | null
  iconPath: string | null
  order: number
  group: string
  isEnabled: boolean
  status?: CardStatus
  createdAt: string
  updatedAt: string
}

export interface CardStatus {
  id: string
  cardId: string
  isUp: boolean
  lastChecked: string
  lastHttp: number | null
  latencyMs: number | null
  message: string | null
  failCount: number
  nextCheckAt: string | null
}

// Card creation/update types
export interface CreateCardRequest {
  title: string
  description: string
  url: string
  healthPath?: string
  group?: string
  isEnabled?: boolean
}

export interface UpdateCardRequest {
  title?: string
  description?: string
  url?: string
  healthPath?: string
  iconPath?: string
  order?: number
  group?: string
  isEnabled?: boolean
}

// Reorder types
export interface ReorderRequest {
  cards: Array<{
    id: string
    order: number
    group: string
  }>
}

// Status types
export interface StatusResponse {
  isUp: boolean
  lastChecked: string
  lastHttp: number | null
  latencyMs: number | null
  message?: string
}

// Authentication types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  token: string
  user: {
    email: string
    name: string
  }
}

// Error types
export interface ApiError {
  error: string
  details?: string
  status: number
}
