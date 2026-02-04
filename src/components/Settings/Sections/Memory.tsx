'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Memory {
  id: string;
  type: 'preference' | 'fact' | 'instruction';
  content: string;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

const memoryTypeLabels = {
  preference: { label: 'Preference', color: 'bg-blue-500/20 text-blue-400' },
  fact: { label: 'Fact', color: 'bg-green-500/20 text-green-400' },
  instruction: { label: 'Instruction', color: 'bg-purple-500/20 text-purple-400' },
};

const MemorySection = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMemory, setNewMemory] = useState({
    type: 'preference' as Memory['type'],
    content: '',
  });
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const res = await fetch('/api/memories?activeOnly=false');
      const data = await res.json();
      setMemories(data.memories || []);
    } catch (error) {
      console.error('Error fetching memories:', error);
      toast.error('Failed to load memories.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newMemory.content.trim()) {
      toast.error('Please enter content for the memory.');
      return;
    }

    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemory),
      });

      if (!res.ok) throw new Error('Failed to create memory');

      const data = await res.json();
      setMemories([data.memory, ...memories]);
      setNewMemory({ type: 'preference', content: '' });
      setIsAdding(false);
      toast.success('Memory added successfully.');
    } catch (error) {
      console.error('Error creating memory:', error);
      toast.error('Failed to create memory.');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) {
      toast.error('Content cannot be empty.');
      return;
    }

    try {
      const res = await fetch(`/api/memories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });

      if (!res.ok) throw new Error('Failed to update memory');

      const data = await res.json();
      setMemories(memories.map((m) => (m.id === id ? data.memory : m)));
      setEditingId(null);
      toast.success('Memory updated successfully.');
    } catch (error) {
      console.error('Error updating memory:', error);
      toast.error('Failed to update memory.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/memories/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete memory');

      setMemories(memories.filter((m) => m.id !== id));
      toast.success('Memory deleted successfully.');
    } catch (error) {
      console.error('Error deleting memory:', error);
      toast.error('Failed to delete memory.');
    }
  };

  const handleToggleActive = async (memory: Memory) => {
    try {
      const res = await fetch(`/api/memories/${memory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !memory.isActive }),
      });

      if (!res.ok) throw new Error('Failed to toggle memory');

      const data = await res.json();
      setMemories(memories.map((m) => (m.id === memory.id ? data.memory : m)));
    } catch (error) {
      console.error('Error toggling memory:', error);
      toast.error('Failed to toggle memory.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
      <div className="space-y-2">
        <p className="text-xs text-black/60 dark:text-white/60">
          Add memories to personalize your search experience. These will be used
          to tailor responses to your preferences and context.
        </p>
      </div>

      {/* Add Memory Button/Form */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-2 text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors"
        >
          <Plus size={16} />
          <span>Add Memory</span>
        </button>
      ) : (
        <div className="space-y-3 p-4 bg-light-200/50 dark:bg-dark-200/50 rounded-lg">
          <select
            value={newMemory.type}
            onChange={(e) =>
              setNewMemory({ ...newMemory, type: e.target.value as Memory['type'] })
            }
            className="w-full px-3 py-2 text-sm rounded-lg bg-light-primary dark:bg-dark-primary border border-light-200 dark:border-dark-200 focus:outline-none"
          >
            <option value="preference">Preference</option>
            <option value="fact">Fact</option>
            <option value="instruction">Instruction</option>
          </select>
          <textarea
            value={newMemory.content}
            onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
            placeholder="Enter memory content..."
            className="w-full px-3 py-2 text-sm rounded-lg bg-light-primary dark:bg-dark-primary border border-light-200 dark:border-dark-200 focus:outline-none resize-none"
            rows={3}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleAdd}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Check size={14} />
              <span>Save</span>
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewMemory({ type: 'preference', content: '' });
              }}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-light-200 dark:bg-dark-200 rounded-lg hover:bg-light-300 dark:hover:bg-dark-300 transition-colors"
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Memory List */}
      <div className="space-y-3">
        {memories.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50 text-center py-8">
            No memories yet. Add one to personalize your experience.
          </p>
        ) : (
          memories.map((memory) => (
            <div
              key={memory.id}
              className={cn(
                'p-4 rounded-lg border transition-all',
                memory.isActive
                  ? 'bg-light-200/30 dark:bg-dark-200/30 border-light-200 dark:border-dark-200'
                  : 'bg-light-200/10 dark:bg-dark-200/10 border-light-200/50 dark:border-dark-200/50 opacity-60',
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs rounded-full',
                        memoryTypeLabels[memory.type].color,
                      )}
                    >
                      {memoryTypeLabels[memory.type].label}
                    </span>
                    {!memory.isActive && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-400">
                        Disabled
                      </span>
                    )}
                  </div>

                  {editingId === memory.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg bg-light-primary dark:bg-dark-primary border border-light-200 dark:border-dark-200 focus:outline-none resize-none"
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdate(memory.id)}
                          className="p-1.5 text-green-500 hover:bg-green-500/10 rounded transition-colors"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-gray-500 hover:bg-gray-500/10 rounded transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-black/80 dark:text-white/80">
                      {memory.content}
                    </p>
                  )}
                </div>

                {editingId !== memory.id && (
                  <div className="flex items-center space-x-1 ml-4">
                    <button
                      onClick={() => handleToggleActive(memory)}
                      className={cn(
                        'p-1.5 rounded transition-colors',
                        memory.isActive
                          ? 'text-green-500 hover:bg-green-500/10'
                          : 'text-gray-500 hover:bg-gray-500/10',
                      )}
                      title={memory.isActive ? 'Disable' : 'Enable'}
                    >
                      {memory.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(memory.id);
                        setEditContent(memory.content);
                      }}
                      className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(memory.id)}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MemorySection;
