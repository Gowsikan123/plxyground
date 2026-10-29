import { request } from './client';
import type {
  Applicant,
  Application,
  Business,
  Creator,
  CreatorAccount,
  CreatorList,
  Opportunity,
  MyListing,
  OpportunityList,
  PostList,
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

  updateBusiness: (input: Partial<Pick<Business, 'company_name' | 'industry' | 'website' | 'location' | 'bio'>>) =>
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
};

export const creators = {
  list: (params: { search?: string; sport?: string; limit?: number; offset?: number } = {}) =>
    request<CreatorList>('/api/creators', { query: params }),

  update: (creatorId: number, input: Partial<Pick<Creator, 'display_name' | 'bio' | 'sport' | 'location'>>) =>
    request<Creator>(`/api/creators/${creatorId}`, { method: 'PUT', body: input }),
};
