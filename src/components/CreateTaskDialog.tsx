'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import type { TaskScheduleType } from '@/lib/db/schema';

interface Space {
  id: string;
  name: string;
}

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

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (task: Task) => void;
}

const scheduleOptions: { value: TaskScheduleType; label: string; description: string }[] = [
  { value: 'once', label: 'Once', description: 'Run immediately, one time only' },
  { value: 'daily', label: 'Daily', description: 'Every day at 9:00 AM' },
  { value: 'weekly', label: 'Weekly', description: 'Every Monday at 9:00 AM' },
  { value: 'monthly', label: 'Monthly', description: 'First day of each month at 9:00 AM' },
  { value: 'cron', label: 'Custom', description: 'Specify a cron expression' },
];

const CreateTaskDialog = ({ open, onClose, onCreated }: CreateTaskDialogProps) => {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [scheduleType, setScheduleType] = useState<TaskScheduleType>('daily');
  const [cronExpression, setCronExpression] = useState('');
  const [spaceId, setSpaceId] = useState<string>('');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const res = await fetch('/api/spaces');
        if (res.ok) {
          const data = await res.json();
          setSpaces(data.spaces || []);
        }
      } catch {
        // Spaces are optional
      }
    };

    if (open) {
      fetchSpaces();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a task name');
      return;
    }

    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    if (scheduleType === 'cron' && !cronExpression.trim()) {
      toast.error('Please enter a cron expression');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          query: query.trim(),
          scheduleType,
          cronExpression: scheduleType === 'cron' ? cronExpression.trim() : undefined,
          spaceId: spaceId || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create task');
      }

      const data = await res.json();
      toast.success('Task created successfully');
      onCreated(data.task);

      // Reset form
      setName('');
      setQuery('');
      setScheduleType('daily');
      setCronExpression('');
      setSpaceId('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          static
          open={open}
          onClose={onClose}
          className="relative z-50"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <DialogPanel className="w-full max-w-lg bg-light-primary dark:bg-dark-primary border border-light-200 dark:border-dark-200 rounded-xl shadow-xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-light-200 dark:border-dark-200">
                  <h2 className="text-lg font-medium text-black dark:text-white">
                    Create Scheduled Task
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-light-200 dark:hover:bg-dark-200 rounded-lg transition duration-200"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1.5">
                      Task Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Daily AI News"
                      className="w-full px-3 py-2 bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#24A0ED]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1.5">
                      Search Query
                    </label>
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g., Latest developments in AI and machine learning"
                      rows={3}
                      className="w-full px-3 py-2 bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#24A0ED]/50 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1.5">
                      Schedule
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {scheduleOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setScheduleType(option.value)}
                          className={`p-3 text-left border rounded-lg transition duration-200 ${
                            scheduleType === option.value
                              ? 'border-[#24A0ED] bg-[#24A0ED]/10'
                              : 'border-light-200 dark:border-dark-200 hover:border-light-300 dark:hover:border-dark-300'
                          }`}
                        >
                          <div className="font-medium text-sm text-black dark:text-white">
                            {option.label}
                          </div>
                          <div className="text-xs text-black/50 dark:text-white/50 mt-0.5">
                            {option.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {scheduleType === 'cron' && (
                    <div>
                      <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1.5">
                        Cron Expression
                      </label>
                      <input
                        type="text"
                        value={cronExpression}
                        onChange={(e) => setCronExpression(e.target.value)}
                        placeholder="e.g., 0 9 * * 1-5 (weekdays at 9 AM)"
                        className="w-full px-3 py-2 bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#24A0ED]/50 font-mono text-sm"
                      />
                      <p className="text-xs text-black/50 dark:text-white/50 mt-1">
                        Format: minute hour day month weekday
                      </p>
                    </div>
                  )}

                  {spaces.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1.5">
                        Save to Space (optional)
                      </label>
                      <select
                        value={spaceId}
                        onChange={(e) => setSpaceId(e.target.value)}
                        className="w-full px-3 py-2 bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#24A0ED]/50"
                      >
                        <option value="">No space</option>
                        {spaces.map((space) => (
                          <option key={space.id} value={space.id}>
                            {space.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-black/70 dark:text-white/70 hover:bg-light-200 dark:hover:bg-dark-200 rounded-lg transition duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-[#24A0ED] text-white rounded-lg hover:bg-[#1a8cd8] transition duration-200 disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Task'}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default CreateTaskDialog;
