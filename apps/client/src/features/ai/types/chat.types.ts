export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatError {
  id: string;
  type: "rate_limit" | "network" | "api_error" | "authentication" | "quota_exceeded" | "invalid_request" | "server_error" | "timeout" | "unknown";
  message: string;
  details?: string;
  errorCode?: string;
  timestamp: Date;
  retryable?: boolean;
}
