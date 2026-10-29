import { request } from './client';
import type {
  AppNotification,
  BlockedAccount,
  ReportReason,
  ReportTarget,
  Role,
  Applicant,
  Application,
  Business,
  Creator,
  CreatorAccount,
  CreatorList,
  Opportunity,
  Message,
  MyListing,
  OpportunityList,
  Post,
  PostList,
  Thread,
  UnreadCounts,
} from './types';

// ---- Auth --------------------------------------------------------------------

export const auth = {
  creatorLogin: (email: string, password: string) =>
    request<{ token: string; user: CreatorAccount }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  creatorSignup: (input: {
    email: string;
    password: string;
    username: string;
    display_name: string;
    sport?: string;
  }) =>
    request<{ token: string; user: Omit<CreatorAccount, 'creator_id'> }>('/api/auth/signup', {
      method: 'POST',
      body: input,
    }),

  creatorMe: () => request<CreatorAccount>('/api/auth/me'),

  businessLogin: (email: string, password: string) =>
    request<{ token: string; business: Business }>('/api/business/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  businessSignup: (input: { email: string; password: string; company_name: string; industry?: string }) =>
    request<{ token: string; business: Business }>('/api/business/auth/signup', {
      method: 'POST',
      body: input,
    }),

  businessMe: () => request<Business>('/api/business/auth/me'),

  updateBusiness: (input: Partial<Pick<Business, 'company_name' | 'industry' | 'website' | 'location' | 'bio' | 'logo_url'>>) =>
    request<Business>('/api/business/auth/me', { method: 'PUT', body: input }),
};

// ---- Opportunities -------------------------------------------------------------

export const opportunities = {
  list: (params: { search?: string; sport?: string; limit?: number; offset?: number } = {}) =>
    request<OpportunityList>('/api/opportunities', { query: params }),

  get: (id: number) => request<Opportunity>(`/api/opportunities/${id}`),

  create: (input: {
    title: string;
    description: string;
    sport?: string;
    location?: string;
    budget?: string;
    deadline?: string;
  }) => request<Opportunity>('/api/opportunities', { method: 'POST', body: input }),

  mine: () => request<MyListing[]>('/api/opportunities/mine'),

  setStatus: (id: number, status: 'published' | 'closed') =>
    request<Opportunity>(`/api/opportunities/${id}`, { method: 'PUT', body: { status } }),
};

// ---- Applications --------------------------------------------------------------

export const applications = {
  apply: (opportunityId: number, message?: string) =>
    request<Application>('/api/applications', {
      method: 'POST',
      body: { opportunity_id: opportunityId, message },
    }),

  mine: () => request<Application[]>('/api/applications/mine'),

  forOpportunity: (opportunityId: number) =>
    request<Applicant[]>(`/api/applications/opportunity/${opportunityId}`),

  decide: (applicationId: number, status: 'accepted' | 'rejected') =>
    request<Application>(`/api/applications/${applicationId}/status`, { method: 'PUT', body: { status } }),
};

// ---- Content & creators --------------------------------------------------------

export const content = {
  feed: (params: { search?: string; sport?: string; limit?: number; offset?: number } = {}) =>
    request<PostList>('/api/content', { query: params }),

  /** New posts go to moderation and appear in the feed once approved. */
  create: (input: { title: string; body?: string; media_url?: string; media_type?: 'image' | 'none' }) =>
    request<Post>('/api/content', { method: 'POST', body: input }),
};

export const creators = {
  list: (params: { search?: string; sport?: string; limit?: number; offset?: number } = {}) =>
    request<CreatorList>('/api/creators', { query: params }),

  update: (creatorId: number, input: Partial<Pick<Creator, 'display_name' | 'bio' | 'sport' | 'location' | 'avatar_url'>>) =>
    request<Creator>(`/api/creators/${creatorId}`, { method: 'PUT', body: input }),
};

// ---- Messages ------------------------------------------------------------------

export const messages = {
  threads: () => request<Thread[]>('/api/messages/threads'),

  /** Returns the existing conversation with this person, or starts one. */
  open: (recipientType: 'creator' | 'business', recipientId: number) =>
    request<{ id: number }>('/api/messages/threads', {
      method: 'POST',
      body: { recipient_type: recipientType, recipient_id: recipientId },
    }),

  list: (threadId: number) => request<Message[]>(`/api/messages/threads/${threadId}`),

  send: (threadId: number, body: string) =>
    request<Message>(`/api/messages/threads/${threadId}`, { method: 'POST', body: { body } }),
};

// ---- Notifications ---------------------------------------------------------------

export const notifications = {
  list: () => request<AppNotification[]>('/api/notifications', { query: { limit: 50 } }),
  unread: () => request<UnreadCounts>('/api/notifications/unread'),
  markRead: (id: number) => request<void>(`/api/notifications/${id}/read`, { method: 'PUT' }),
  readAll: () => request<void>('/api/notifications/read-all', { method: 'PUT' }),
};

// ---- Uploads ---------------------------------------------------------------------

export const uploads = {
  image: (base64: string, contentType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg') =>
    request<{ url: string }>('/api/uploads', { method: 'POST', body: { data: base64, content_type: contentType } }),
};

// ---- Safety --------------------------------------------------------------------

export const safety = {
  report: (input: { target_type: ReportTarget; target_id: number; reason: ReportReason; details?: string }) =>
    request<{ id: number }>('/api/safety/reports', { method: 'POST', body: input }),
  blocks: () => request<BlockedAccount[]>('/api/safety/blocks'),
  block: (type: Role, id: number) =>
    request<void>('/api/safety/blocks', { method: 'POST', body: { blocked_type: type, blocked_id: id } }),
  unblock: (type: Role, id: number) => request<void>(`/api/safety/blocks/${type}/${id}`, { method: 'DELETE' }),
  /** Permanently deletes the signed-in account. The password confirms it's really them. */
  deleteAccount: (password: string) =>
    request<void>('/api/safety/delete-account', { method: 'POST', body: { password } }),
};
