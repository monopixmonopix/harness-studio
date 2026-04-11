'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { NodeProps } from '@xyflow/react';

export interface StickyNoteData extends Record<string, unknown> {
  readonly text: string;
  readonly nodeId: string;
}

type StickyNoteProps = NodeProps & { data: StickyNoteData };

function StickyNoteInner({ data, id }: StickyNoteProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(data.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync from external data changes
  useEffect(() => {
    if (!editing) {
      setText(data.text);
    }
  }, [data.text, editing]);

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (editing) {
      const ta = textareaRef.current;
      if (ta) {
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }
    }
  }, [editing]);

  const handleDoubleClick = useCallback(() => {
    setEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setEditing(false);
    // Dispatch a custom event so the canvas can update the node data immutably
    const event = new CustomEvent('stickyNoteUpdate', {
      detail: { nodeId: id, text },
    });
    window.dispatchEvent(event);
  }, [id, text]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditing(false);
        setText(data.text); // revert
      }
    },
    [data.text]
  );

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className="min-w-[160px] max-w-[280px] rounded-lg border border-amber-400/40 bg-amber-100/80 px-3 py-2 shadow-sm dark:bg-amber-900/30"
    >
      {editing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          rows={3}
          className="w-full resize-none rounded bg-transparent text-xs text-amber-900 placeholder:text-amber-600/50 focus:outline-none dark:text-amber-200 dark:placeholder:text-amber-400/50"
          placeholder="Type a note..."
        />
      ) : (
        <div className="whitespace-pre-wrap text-xs leading-relaxed text-amber-900 dark:text-amber-200">
          {text || (
            <span className="italic text-amber-600/50 dark:text-amber-400/50">
              Double-click to edit...
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export const StickyNote = memo(StickyNoteInner);
