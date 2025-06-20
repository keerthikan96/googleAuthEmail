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
  id: number;
  messageId: string;
  threadId: string;
  subject: string;
  sender: string;
  senderName?: string;
  snippet: string;
  receivedDate: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  labels: string[];
  priority: 'low' | 'medium' | 'high';
  size: number;
  createdAt: string;
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
  email: EmailMetadata | PromiseLike<EmailMetadata>;
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
