export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  lastSyncedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailMetadata {
  id: string;
  userId: string;
  gmailMessageId: string;
  threadId: string;
  subject: string;
  fromEmail: string;
  fromName?: string;
  toEmails: string[];
  ccEmails?: string[];
  bccEmails?: string[];
  bodySnippet: string;
  bodyText?: string;
  bodyHtml?: string;
  hasAttachments: boolean;
  attachmentCount: number;
  labels: string[];
  isRead: boolean;
  isImportant: boolean;
  isStarred: boolean;
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailSearchParams {
  query?: string;
  page?: number;
  limit?: number;
  isRead?: boolean;
  isImportant?: boolean;
  isStarred?: boolean;
  hasAttachments?: boolean;
  fromDate?: string;
  toDate?: string;
  labels?: string[];
  sortBy?: 'receivedAt' | 'subject' | 'fromEmail';
  sortOrder?: 'ASC' | 'DESC';
}

export interface EmailsResponse {
  emails: EmailMetadata[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
