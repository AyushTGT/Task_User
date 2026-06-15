export type UserRole = "user" | "admin" | "super_admin";
export type TaskStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface TaskOwner {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface Attachment {
  id: string;
  filename: string;
  original_name: string;
  file_size: number;
  content_type: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  field: string | null;
  old_value: { value: string } | null;
  new_value: { value: string } | null;
  created_at: string;
  user_name: string | null;
  user_id: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  position: number;
  labels: string[];
  owner_id: string;
  owner: TaskOwner;
  attachments?: Attachment[];
  attachment_count?: number;
  created_at: string;
  updated_at: string | null;
}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface TaskListResponse {
  data: Task[];
  pagination: Pagination;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  labels?: string[];
  position?: number;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  labels?: string[];
  position?: number;
}

export interface TaskFilters {
  status?: TaskStatus | "";
  priority?: TaskPriority | "";
  search?: string;
  sort_by?: "created_at" | "due_date" | "priority" | "title" | "position";
  sort_dir?: "asc" | "desc";
  label?: string;
  page?: number;
  page_size?: number;
}

export interface WSMessage {
  type: "task_created" | "task_updated" | "task_deleted";
  data: Task | { id: string };
}

export interface AdminStats {
  total_users: number;
  total_tasks: number;
  tasks_by_status: Record<TaskStatus, number>;
  tasks_by_priority: Record<TaskPriority, number>;
}
