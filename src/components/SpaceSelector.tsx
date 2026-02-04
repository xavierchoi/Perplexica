'use client';

import { Folder, ChevronDown, X } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Space } from '@/app/spaces/page';

interface SpaceSelectorProps {
  selectedSpaceId: string | null;
  onSelectSpace: (spaceId: string | null) => void;
  className?: string;
}

const SpaceSelector = ({
  selectedSpaceId,
  onSelectSpace,
  className = '',
}: SpaceSelectorProps) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const res = await fetch('/api/spaces', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        setSpaces(data.spaces || []);
      } catch (error) {
        console.error('Error fetching spaces:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId);

  if (loading) {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-black/50 dark:text-white/50 ${className}`}>
        <Folder size={14} />
        <span>Loading...</span>
      </div>
    );
  }

  if (spaces.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border border-light-200 dark:border-dark-200 text-black/70 dark:text-white/70 hover:bg-light-200 dark:hover:bg-dark-200 transition duration-200"
      >
        <Folder size={14} />
        <span className="max-w-[100px] truncate">
          {selectedSpace ? selectedSpace.name : 'No Space'}
        </span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-48 rounded-lg border border-light-200 dark:border-dark-200 bg-light-primary dark:bg-dark-primary shadow-lg z-50 overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onSelectSpace(null);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-light-200 dark:hover:bg-dark-200 transition duration-200 ${
                !selectedSpaceId ? 'bg-light-200/50 dark:bg-dark-200/50' : ''
              }`}
            >
              <X size={14} className="text-black/50 dark:text-white/50" />
              <span>No Space</span>
            </button>
            {spaces.map((space) => (
              <button
                key={space.id}
                type="button"
                onClick={() => {
                  onSelectSpace(space.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-light-200 dark:hover:bg-dark-200 transition duration-200 ${
                  selectedSpaceId === space.id ? 'bg-light-200/50 dark:bg-dark-200/50' : ''
                }`}
              >
                <Folder size={14} className="text-black/50 dark:text-white/50" />
                <span className="truncate">{space.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceSelector;
