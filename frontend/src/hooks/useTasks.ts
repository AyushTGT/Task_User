"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, getApiError } from "@/lib/api";
import type { Task, TaskListResponse, CreateTaskPayload, UpdateTaskPayload, TaskFilters, ActivityLog } from "@/types";

export function useTasks(filters: TaskFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.search) params.set("search", filters.search);
  if (filters.sort_by) params.set("sort_by", filters.sort_by);
  if (filters.sort_dir) params.set("sort_dir", filters.sort_dir);
  if (filters.label) params.set("label", filters.label);
  params.set("page", String(filters.page ?? 1));
  params.set("page_size", String(filters.page_size ?? 20));

  return useQuery<TaskListResponse>({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      const { data } = await api.get<TaskListResponse>(`/tasks?${params}`);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useAllTasksForKanban() {
  return useQuery<Task[]>({
    queryKey: ["tasks-kanban"],
    queryFn: async () => {
      const { data } = await api.get<TaskListResponse>("/tasks?page_size=500&sort_by=position&sort_dir=asc");
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useTask(id: string) {
  return useQuery<Task>({
    queryKey: ["task", id],
    queryFn: async () => {
      const { data } = await api.get<Task>(`/tasks/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useTaskActivities(id: string) {
  return useQuery<ActivityLog[]>({
    queryKey: ["task-activities", id],
    queryFn: async () => {
      const { data } = await api.get<ActivityLog[]>(`/tasks/:id/activities`.replace(":id", id));
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTaskPayload) => {
      const { data } = await api.post<Task>("/tasks", payload);
      return data;
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks-kanban"] });
      toast.success("Task created");
    },
    onError: (e) => toast.error(getApiError(e)),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateTaskPayload }) => {
      const { data } = await api.patch<Task>(`/tasks/${id}`, payload);
      return data;
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks-kanban"] });
      qc.invalidateQueries({ queryKey: ["task", task.id] });
      toast.success("Task updated");
    },
    onError: (e) => toast.error(getApiError(e)),
  });
}

export function useMoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, position }: { id: string; status: string; position: number }) => {
      const { data } = await api.patch<Task>(`/tasks/${id}/move`, { status, position });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks-kanban"] });
    },
    onError: (e) => toast.error(getApiError(e)),
  });
}

export function useUploadAttachment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post(`/tasks/${taskId}/attachments`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("File uploaded");
    },
    onError: (e) => toast.error(getApiError(e)),
  });
}

export function useDeleteAttachment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attachmentId: string) => {
      await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
      return attachmentId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task", taskId] });
      toast.success("Attachment removed");
    },
    onError: (e) => toast.error(getApiError(e)),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks-kanban"] });
      toast.success("Task deleted");
    },
    onError: (e) => toast.error(getApiError(e)),
  });
}
