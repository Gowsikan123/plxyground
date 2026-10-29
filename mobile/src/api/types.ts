// Response shapes from the PLXYGROUND API (see backend/src/routes and docs/openapi.yaml).

export type Role = 'creator' | 'business';

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error?: string;
  errors?: { field: string; message: string }[];
}

export interface Creator {
  id: number;
  username: string;
  slug: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  sport: string | null;
  location: string | null;
  follower_count: number;
  is_verified: boolean;
}

/** A logged-in creator account (creator_accounts row joined with the public profile). */
export interface CreatorAccount extends Omit<Creator, 'id'> {
  id: number;
  creator_id: number;
  email: string;
}

export interface Business {
  id: number;
  email: string;
  company_name: string;
  slug: string;
  industry: string | null;
  website: string | null;
  location: string | null;
  logo_url: string | null;
  is_verified: boolean;
  bio?: string | null;
}

export interface Poster {
  display_name: string;
  username?: string;
  avatar_url: string | null;
}

export interface Opportunity {
  id: number;
  posted_by_type: Role;
  posted_by_id: number;
  title: string;
  description: string;
  sport: string | null;
  location: string | null;
  budget: string | null;
  deadline: string | null;
  status: 'published' | 'closed' | 'deleted';
  created_at: string;
  poster: Poster | null;
}

export interface Post {
  id: number;
  creator_id: number;
  title: string;
  body: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | 'none';
  view_count: number;
  created_at: string;
  display_name: string;
  username: string;
  creator_slug: string;
  avatar_url: string | null;
  sport: string | null;
}

export interface OpportunityList {
  opportunities: Opportunity[];
  total: number;
  limit: number;
  offset: number;
}

export interface PostList {
  posts: Post[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreatorList {
  creators: Creator[];
  total: number;
  limit: number;
  offset: number;
}

export interface MyListing extends Omit<Opportunity, 'poster'> {
  application_count: number;
  pending_count: number;
}

export interface Applicant {
  id: number;
  opportunity_id: number;
  creator_id: number;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  display_name: string;
  username: string;
  slug: string;
  avatar_url: string | null;
}

export interface Application {
  id: number;
  opportunity_id: number;
  creator_id: number;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  opp_title?: string;
  sport?: string | null;
  budget?: string | null;
}

export type Session =
  | { role: 'creator'; token: string; user: CreatorAccount }
  | { role: 'business'; token: string; user: Business };

export interface Thread {
  id: number;
  other_type: Role;
  other_id: number;
  other_name: string | null;
  other_avatar: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  unread_count: number;
}

export interface Message {
  id: number;
  thread_id: number;
  sender_type: Role;
  sender_id: number;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface AppNotification {
  id: number;
  type: 'application_received' | 'application_decided' | 'post_approved' | 'post_rejected' | string;
  title: string;
  body: string | null;
  reference_type: string | null;
  reference_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface UnreadCounts {
  notifications: number;
  messages: number;
}

export type ReportTarget = 'creator' | 'business' | 'content' | 'opportunity' | 'message';
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'impersonation' | 'other';
export interface BlockedAccount {
  blocked_type: Role;
  blocked_id: number;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
}
