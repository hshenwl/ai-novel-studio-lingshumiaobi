import { create } from 'zustand';
import { Task } from '../api/types';

interface TaskState {
  tasks: Task[];
  runningTasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setTasks: (tasks: Task[]) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  runningTasks: [],
  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
      runningTasks: task.status === 'running' ? [...state.runningTasks, task] : state.runningTasks,
    })),
  updateTask: (id, updates) =>
    set((state) => {
      const tasks = state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
      const runningTasks = tasks.filter((t) => t.status === 'running');
      return { tasks, runningTasks };
    }),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      runningTasks: state.runningTasks.filter((t) => t.id !== id),
    })),
  setTasks: (tasks) =>
    set({
      tasks,
      runningTasks: tasks.filter((t) => t.status === 'running'),
    }),
}));