"use client";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState, useEffect } from "react";
import { KANBAN_COLUMNS } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { useMoveTask } from "@/hooks/useTasks";

interface KanbanBoardProps {
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
}

export function KanbanBoard({ tasks, onAddTask, onEditTask }: KanbanBoardProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const moveTask = useMoveTask();

  // Sync when server data changes (but not during drag)
  useEffect(() => {
    if (!activeTask) setLocalTasks(tasks);
  }, [tasks, activeTask]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const getTasksByStatus = (status: TaskStatus) =>
    localTasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);

  const onDragStart = ({ active }: DragStartEvent) => {
    const task = localTasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = localTasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Dropped over a column
    if (KANBAN_COLUMNS.includes(overId as TaskStatus)) {
      const newStatus = overId as TaskStatus;
      if (activeTask.status !== newStatus) {
        setLocalTasks((prev) =>
          prev.map((t) => t.id === activeId ? { ...t, status: newStatus } : t)
        );
      }
      return;
    }

    // Dropped over a card
    const overTask = localTasks.find((t) => t.id === overId);
    if (!overTask) return;

    if (activeTask.status !== overTask.status) {
      setLocalTasks((prev) =>
        prev.map((t) => t.id === activeId ? { ...t, status: overTask.status } : t)
      );
    }
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const task = localTasks.find((t) => t.id === activeId);
    if (!task) return;

    let newStatus = task.status;
    let newPosition = task.position;

    if (KANBAN_COLUMNS.includes(overId as TaskStatus)) {
      newStatus = overId as TaskStatus;
      const colTasks = localTasks.filter((t) => t.status === newStatus && t.id !== activeId).sort((a, b) => a.position - b.position);
      newPosition = colTasks.length > 0 ? colTasks[colTasks.length - 1].position + 1000 : 1000;
    } else {
      const overTask = localTasks.find((t) => t.id === overId);
      if (!overTask) return;

      newStatus = overTask.status;
      const colTasks = localTasks.filter((t) => t.status === newStatus && t.id !== activeId).sort((a, b) => a.position - b.position);
      const overIdx = colTasks.findIndex((t) => t.id === overId);

      const before = colTasks[overIdx - 1]?.position ?? 0;
      const after = colTasks[overIdx]?.position ?? before + 2000;
      newPosition = (before + after) / 2;
    }

    // Optimistic update
    setLocalTasks((prev) =>
      prev.map((t) => t.id === activeId ? { ...t, status: newStatus, position: newPosition } : t)
    );

    // Server update (with rollback on error)
    moveTask.mutate(
      { id: activeId, status: newStatus, position: newPosition },
      {
        onError: () => setLocalTasks(tasks),
      }
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-5 h-full pb-4 overflow-x-auto">
        {KANBAN_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={getTasksByStatus(status)}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="drag-overlay">
            <KanbanCard task={activeTask} onEdit={() => {}} overlay />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
