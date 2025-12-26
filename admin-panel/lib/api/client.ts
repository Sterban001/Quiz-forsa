const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

interface ApiError {
  message: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token)
        // Cookie is now set server-side with HttpOnly, Secure, and SameSite flags
        // This prevents XSS attacks from stealing the token via JavaScript
      } else {
        localStorage.removeItem('auth_token')
        // Cookie is cleared server-side on logout
      }
    }
  }

  getToken() {
    return this.token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    // Merge with any headers from options
    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',  // Required for cookies to be sent/received with CORS
    })

    const data: ApiResponse<T> = await response.json()

    if (!response.ok || !data.success) {
      // Include validation details if available
      const errorMessage = data.error?.message || 'An error occurred'
      const details = (data.error as any)?.details

      if (details && Array.isArray(details)) {
        const detailMessages = details.map((d: any) => `${d.field}: ${d.message}`).join('; ')
        throw new Error(`${errorMessage} - ${detailMessages}`)
      }

      throw new Error(errorMessage)
    }

    return data.data as T
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const data = await this.request<{ user: any; session: any; profile: any }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    )
    if (data.session?.access_token) {
      this.setToken(data.session.access_token)
    }
    return data
  }

  async sendOtp(email: string) {
    return this.request<{ message: string }>('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async verifyOtp(email: string, token: string) {
    const data = await this.request<{ user: any; session: any; profile: any }>(
      '/auth/otp/verify',
      {
        method: 'POST',
        body: JSON.stringify({ email, token }),
      }
    )
    if (data.session?.access_token) {
      this.setToken(data.session.access_token)
    }
    return data
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' })
    } finally {
      this.setToken(null)
    }
  }

  async getCurrentUser() {
    return this.request<{ user: any; profile: any }>('/auth/me')
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(password: string) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    })
  }

  // Test endpoints
  async getTests(filters?: { status?: string; visibility?: string; category?: string }) {
    const params = new URLSearchParams(filters as any)
    return this.request<any[]>(`/tests?${params}`)
  }

  async getTest(id: string) {
    return this.request<any>(`/tests/${id}`)
  }

  async createTest(data: any) {
    return this.request<any>('/tests', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTest(id: string, data: any) {
    return this.request<any>(`/tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteTest(id: string) {
    return this.request<{ message: string }>(`/tests/${id}`, {
      method: 'DELETE',
    })
  }

  async cloneTest(id: string) {
    return this.request<any>(`/tests/${id}/clone`, {
      method: 'POST',
    })
  }

  // Question endpoints
  async getQuestions(testId: string) {
    return this.request<any[]>(`/questions/test/${testId}`)
  }

  async createQuestion(data: any) {
    return this.request<any>('/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateQuestion(id: string, data: any) {
    return this.request<any>(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteQuestion(id: string) {
    return this.request<{ message: string }>(`/questions/${id}`, {
      method: 'DELETE',
    })
  }

  // Attempt endpoints
  async getAttempts() {
    return this.request<any[]>('/attempts')
  }

  async getAttempt(id: string) {
    return this.request<any>(`/attempts/${id}`)
  }

  async startAttempt(testId: string) {
    return this.request<any>('/attempts/start', {
      method: 'POST',
      body: JSON.stringify({ test_id: testId }),
    })
  }

  async saveAnswer(attemptId: string, questionId: string, responseJson: any, timeSpent?: number) {
    return this.request<any>(`/attempts/${attemptId}/answer`, {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        response_json: responseJson,
        time_spent: timeSpent,
      }),
    })
  }

  async submitAttempt(attemptId: string) {
    return this.request<any>(`/attempts/${attemptId}/submit`, {
      method: 'POST',
    })
  }

  // User endpoints
  async getUsers() {
    return this.request<any[]>('/users')
  }

  async getUser(id: string) {
    return this.request<any>(`/users/${id}`)
  }

  async updateUser(id: string, data: any) {
    return this.request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Analytics endpoints
  async getDashboardStats() {
    return this.request<any>('/analytics/dashboard')
  }

  async getTestStatistics() {
    return this.request<any[]>('/analytics/tests')
  }

  async getLeaderboard(testId: string) {
    return this.request<any[]>(`/analytics/leaderboard/${testId}`)
  }

  // Result release endpoints
  async releaseTestResults(testId: string) {
    return this.request<{ message: string; affected_attempts: number }>(`/tests/${testId}/release-results`, {
      method: 'POST',
    })
  }

  async releaseAttemptResult(attemptId: string) {
    return this.request<{ message: string; attempt: any }>(`/tests/attempts/${attemptId}/release-result`, {
      method: 'POST',
    })
  }
}

// Create a singleton instance
export const apiClient = new ApiClient(API_URL)

// Export the class for creating new instances if needed
export default ApiClient
