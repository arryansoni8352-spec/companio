export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Derive WebSocket base URL from API_URL (strip /api suffix)
export function getWsUrl(namespace: string): string {
  const base = API_URL.replace(/\/api\/?$/, '');
  return `${base}${namespace}`;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('companio_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('companio_token', token);
      else localStorage.removeItem('companio_token');
    }
  }

  setRefreshToken(token: string | null) {
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('companio_refresh_token', token);
      else localStorage.removeItem('companio_refresh_token');
    }
  }

  getToken() { return this.token; }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: any = { 'Content-Type': 'application/json', ...options.headers };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    if (res.status === 401) {
      // Try refresh
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.token}`;
        const retry = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        if (!retry.ok) throw new Error(await retry.text());
        return retry.json();
      }
      // Redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('companio_token');
        localStorage.removeItem('companio_refresh_token');
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(err.message || 'Request failed');
    }

    return res.json();
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('companio_refresh_token') : null;
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;

      const data = await res.json();
      this.setToken(data.accessToken);
      this.setRefreshToken(data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  // Auth
  async signup(data: { username: string; password: string; email?: string; displayName?: string }) {
    const res = await this.request<any>('/auth/signup', { method: 'POST', body: JSON.stringify(data) });
    this.setToken(res.accessToken);
    this.setRefreshToken(res.refreshToken);
    return res;
  }

  async login(data: { login: string; password: string }) {
    const res = await this.request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) });
    if (res.accessToken) {
      this.setToken(res.accessToken);
      this.setRefreshToken(res.refreshToken);
    }
    return res;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' }).catch(() => {});
    this.setToken(null);
    this.setRefreshToken(null);
  }

  async getMe() { return this.request<any>('/auth/me'); }

  // Users
  async getProfile(username: string) { return this.request<any>(`/users/${username}`); }
  async updateProfile(data: any) { return this.request<any>('/users/profile', { method: 'PUT', body: JSON.stringify(data) }); }
  async followUser(username: string) { return this.request<any>(`/users/${username}/follow`, { method: 'POST' }); }
  async getFollowers(username: string) { return this.request<any[]>(`/users/${username}/followers`); }
  async getFollowing(username: string) { return this.request<any[]>(`/users/${username}/following`); }
  async searchUsers(q: string) { return this.request<any[]>(`/users/search?q=${encodeURIComponent(q)}`); }
  async getSuggested() { return this.request<any[]>('/users/suggested'); }

  // Posts
  async createPost(data: any) { return this.request<any>('/posts', { method: 'POST', body: JSON.stringify(data) }); }
  async getFeed(type = 'following', skip = 0) { return this.request<any[]>(`/posts/feed?type=${type}&skip=${skip}`); }
  async getPost(id: string) { return this.request<any>(`/posts/${id}`); }
  async likePost(id: string) { return this.request<any>(`/posts/${id}/like`, { method: 'POST' }); }
  async savePost(id: string) { return this.request<any>(`/posts/${id}/save`, { method: 'POST' }); }
  async commentPost(id: string, content: string) { return this.request<any>(`/posts/${id}/comment`, { method: 'POST', body: JSON.stringify({ content }) }); }
  async deletePost(id: string) { return this.request<any>(`/posts/${id}`, { method: 'DELETE' }); }
  async getUserPosts(username: string) { return this.request<any[]>(`/posts/user/${username}`); }
  async getStories() { return this.request<any[]>('/posts/stories'); }
  async getSaved() { return this.request<any[]>('/posts/saved'); }

  // Messaging
  async getConversations() { return this.request<any[]>('/messaging/conversations'); }
  async getMessages(conversationId: string, skip = 0) { return this.request<any[]>(`/messaging/conversations/${conversationId}/messages?skip=${skip}`); }
  async sendMessage(conversationId: string, data: any) { return this.request<any>(`/messaging/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify(data) }); }
  async createPrivateChat(username: string) { return this.request<any>('/messaging/conversations/private', { method: 'POST', body: JSON.stringify({ username }) }); }
  async createGroupChat(data: any) { return this.request<any>('/messaging/conversations/group', { method: 'POST', body: JSON.stringify(data) }); }

  // Companio
  async getCompanioProfile() { return this.request<any>('/companio/profile'); }
  async updateCompanioProfile(data: any) { return this.request<any>('/companio/profile', { method: 'PUT', body: JSON.stringify(data) }); }
  async discoverCompanions(filters: any = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request<any[]>(`/companio/discover?${params}`);
  }
  async getMatches() { return this.request<any[]>('/companio/matches'); }
  async getCategories() { return this.request<any[]>('/companio/categories'); }

  // Marketplace Bookings
  async bookCompanion(data: { companionId: string; startTime: string; endTime: string; notes?: string }) {
    return this.request<any>('/marketplace/book', { method: 'POST', body: JSON.stringify(data) });
  }
  async getBookings() {
    return this.request<any[]>('/marketplace/bookings');
  }
  async updateBookingStatus(id: string, status: string) {
    return this.request<any>(`/marketplace/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // AI Companions
  async getAICompanions() {
    return this.request<any[]>('/ai/companions');
  }
  async getAICompanion(id: string) {
    return this.request<any>(`/ai/companions/${id}`);
  }
  async getAIConversations() {
    return this.request<any[]>('/ai/conversations');
  }
  async getAIConversation(aiId: string) {
    return this.request<any>(`/ai/conversations/${aiId}`);
  }
  async sendAIMessage(aiId: string, content: string) {
    return this.request<any>(`/ai/conversations/${aiId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }
  async createAICompanion(data: { name: string; avatar: string; shortDesc: string; personality: string; systemPrompt: string; category: string; voiceModel?: string }) {
    return this.request<any>('/ai/companions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Communities
  async getCommunities(params: any = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request<any[]>(`/communities?${qs}`);
  }
  async getCommunity(id: string) { return this.request<any>(`/communities/${id}`); }
  async createCommunity(data: any) { return this.request<any>('/communities', { method: 'POST', body: JSON.stringify(data) }); }
  async joinCommunity(id: string) { return this.request<any>(`/communities/${id}/join`, { method: 'POST' }); }
  async getMyCommunities() { return this.request<any[]>('/communities/mine'); }

  // Events
  async getEvents(params: any = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request<any[]>(`/events?${qs}`);
  }
  async createEvent(data: any) { return this.request<any>('/events', { method: 'POST', body: JSON.stringify(data) }); }
  async rsvpEvent(id: string, status: string) { return this.request<any>(`/events/${id}/rsvp`, { method: 'POST', body: JSON.stringify({ status }) }); }

  // Trust
  async reportUser(data: any) { return this.request<any>('/trust/report', { method: 'POST', body: JSON.stringify(data) }); }
  async blockUser(username: string) { return this.request<any>(`/trust/block/${username}`, { method: 'POST' }); }
  async getBlocked() { return this.request<any[]>('/trust/blocked'); }

  // Privacy
  async getPrivacySettings() { return this.request<any[]>('/privacy/settings'); }
  async updatePrivacySetting(key: string, value: string) { return this.request<any>('/privacy/settings', { method: 'PUT', body: JSON.stringify({ key, value }) }); }

  // Notifications
  async getNotifications() { return this.request<any[]>('/notifications'); }
  async markNotificationRead(id: string) { return this.request<any>(`/notifications/${id}/read`, { method: 'POST' }); }
  async getUnreadCount() { return this.request<{ count: number }>('/notifications/unread-count'); }

  // Admin
  async getAdminDashboard() { return this.request<any>('/admin/dashboard'); }
  async getAdminUsers(params: any = {}) { return this.request<any>(`/admin/users?${new URLSearchParams(params)}`); }
  async getAdminReports(params: any = {}) { return this.request<any>(`/admin/reports?${new URLSearchParams(params)}`); }

  // Storage
  async uploadFile(file: File, folder: string) {
    const formData = new FormData();
    formData.append('file', file);
    const headers: any = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(`${API_URL}/storage/upload/${folder}`, {
      method: 'POST', headers, body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  }
}

export const api = new ApiClient();
export default api;
