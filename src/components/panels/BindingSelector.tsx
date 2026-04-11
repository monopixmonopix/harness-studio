'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface BindingSelectorProps {
  readonly label: string;
  readonly count?: number;
  readonly bound: readonly string[];
  readonly available: readonly string[];
  readonly onAdd: (item: string) => void;
  readonly onRemove: (item: string) => void;
  readonly badgeClassName: string;
  readonly addButtonClassName?: string;
}

export function BindingSelector({
  label,
  count,
  bound,
  available,
  onAdd,
  onRemove,
  badgeClassName,
  addButtonClassName,
}: BindingSelectorProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = filter
    ? available.filter((item) => item.toLowerCase().includes(filter.toLowerCase()))
    : available;

  const handleSelect = useCallback(
    (item: string) => {
      onAdd(item);
      setFilter('');
      setOpen(false);
    },
    [onAdd]
  );

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as HTMLElement)) {
        setOpen(false);
        setFilter('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted">
          {label}
        </label>
        {count != null && count > 0 && (
          <span className="rounded-full bg-surface-hover px-1.5 py-0.5 text-[10px] text-muted">
            {count}
          </span>
        )}
      </div>

      {/* Bound items as removable tags */}
      {bound.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {bound.map((item) => (
            <span
              key={item}
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] ${badgeClassName}`}
            >
              {item}
              <button
                onClick={() => onRemove(item)}
                className="ml-0.5 opacity-60 hover:opacity-100 leading-none"
                aria-label={`Remove ${item}`}
              >
                <X size={8} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add dropdown */}
      {available.length > 0 && (
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setOpen((prev) => !prev)}
            className={`rounded border px-2 py-1 text-[10px] font-medium transition-colors ${
              addButtonClassName ?? 'border-border text-accent/70 hover:bg-surface-hover hover:text-accent'
            }`}
          >
            <span className="flex items-center gap-0.5"><Plus size={10} /> Add {label.replace(/s$/i, '')}</span>
          </button>

          {open && (
            <div className="absolute left-0 z-20 mt-0.5 w-48 rounded border border-border bg-surface shadow-lg">
              {available.length > 5 && (
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter..."
                  className="w-full border-b border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted/50 focus:outline-none"
                  autoFocus
                />
              )}
              <ul className="max-h-32 overflow-y-auto">
                {filtered.length === 0 ? (
                  <li className="px-2 py-1 text-[10px] text-muted/50">No matches</li>
                ) : (
                  filtered.map((item) => (
                    <li key={item}>
                      <button
                        onClick={() => handleSelect(item)}
                        className="w-full px-2 py-1 text-left text-xs text-foreground/70 hover:bg-surface-hover"
                      >
                        {item}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {bound.length === 0 && available.length === 0 && (
        <p className="text-[10px] text-muted/40">None available</p>
      )}
    </div>
  );
}
