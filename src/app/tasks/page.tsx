'use client';

import { useEffect, useState } from 'react';
import { Clock, Play, Pause, Trash2, Plus, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import { formatScheduleDescription } from '@/lib/tasks/scheduler';
import type { TaskScheduleType } from '@/lib/db/schema';

interface Task {
  id: string;
  name: string;
  query: string;
  scheduleType: TaskScheduleType;
  cronExpression: string | null;
  spaceId: string | null;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data.tasks);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleActive = async (task: Task) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !task.isActive }),
      });

      if (!res.ok) throw new Error('Failed to update task');

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, isActive: !t.isActive } : t,
        ),
      );

      toast.success(task.isActive ? 'Task paused' : 'Task activated');
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleRunNow = async (taskId: string) => {
    setRunningTaskId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/run`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to run task');

      const data = await res.json();
      toast.success('Task executed successfully');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to run task');
    } finally {
      setRunningTaskId(null);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete task');

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <RefreshCw className="animate-spin text-black/50 dark:text-white/50" size={24} />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-black dark:text-white">
            Scheduled Tasks
          </h1>
          <p className="text-sm text-black/60 dark:text-white/60 mt-1">
            Automate your searches with scheduled tasks
          </p>
        </div>
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#24A0ED] text-white rounded-lg hover:bg-[#1a8cd8] transition duration-200"
        >
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock size={48} className="text-black/30 dark:text-white/30 mb-4" />
          <h2 className="text-lg font-medium text-black/70 dark:text-white/70 mb-2">
            No scheduled tasks yet
          </h2>
          <p className="text-sm text-black/50 dark:text-white/50 mb-4 max-w-md">
            Create a task to automatically run searches on a schedule. Great for
            monitoring topics, tracking news, or recurring research.
          </p>
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 rounded-lg hover:scale-105 transition duration-200"
          >
            <Plus size={18} />
            <span>Create your first task</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 rounded-xl ${
                !task.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-black dark:text-white">
                      {task.name}
                    </h3>
                    {!task.isActive && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded">
                        Paused
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                    {task.query}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-black/50 dark:text-white/50">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatScheduleDescription(
                        task.scheduleType,
                        task.cronExpression || undefined,
                      )}
                    </span>
                    {task.nextRunAt && task.isActive && (
                      <span>Next: {formatDate(task.nextRunAt)}</span>
                    )}
                    {task.lastRunAt && (
                      <span>Last: {formatDate(task.lastRunAt)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRunNow(task.id)}
                    disabled={runningTaskId === task.id}
                    className="p-2 hover:bg-light-200 dark:hover:bg-dark-200 rounded-lg transition duration-200 disabled:opacity-50"
                    title="Run now"
                  >
                    {runningTaskId === task.id ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <Play size={18} />
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleActive(task)}
                    className="p-2 hover:bg-light-200 dark:hover:bg-dark-200 rounded-lg transition duration-200"
                    title={task.isActive ? 'Pause' : 'Activate'}
                  >
                    {task.isActive ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition duration-200"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateTaskDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={(task) => {
          setTasks((prev) => [task, ...prev]);
          setCreateDialogOpen(false);
        }}
      />
    </div>
  );
};

export default TasksPage;
