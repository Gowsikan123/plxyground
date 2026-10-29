import { request } from './client';
import type {
  Application,
  Business,
  CreatorAccount,
  CreatorList,
  Opportunity,
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
};

// ---- Applications --------------------------------------------------------------

export const applications = {
  apply: (opportunityId: number, message?: string) =>
    request<Application>('/api/applications', {
      method: 'POST',
      body: { opportunity_id: opportunityId, message },
    }),

  mine: () => request<Application[]>('/api/applications/mine'),
};

// ---- Content & creators --------------------------------------------------------

export const content = {
  feed: (params: { search?: string; sport?: string; limit?: number; offset?: number } = {}) =>
    request<PostList>('/api/content', { query: params }),
};

export const creators = {
  list: (params: { search?: string; sport?: string; limit?: number; offset?: number } = {}) =>
    request<CreatorList>('/api/creators', { query: params }),
};
