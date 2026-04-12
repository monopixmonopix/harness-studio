'use client';

import { useRef, useEffect, useMemo } from 'react';
import { XCircle, CheckCircle2, Clock, AlertCircle, Loader2, Ban, AlertTriangle } from 'lucide-react';
import type { ExecutionState, NodeExecutionStatus } from '@/lib/use-execution';

interface ExecutionPanelProps {
  readonly executionState: ExecutionState;
  readonly logs: readonly string[];
  readonly onCancel: () => void;
  readonly onApproveCheckpoint: (nodeId: string) => void;
}

function statusIcon(status: NodeExecutionStatus) {
  switch (status) {
    case 'pending':
      return <Clock size={12} className="text-muted/50" />;
    case 'queued':
      return <Clock size={12} className="text-yellow-400" />;
    case 'running':
      return <Loader2 size={12} className="animate-spin text-blue-400" />;
    case 'done':
      return <CheckCircle2 size={12} className="text-green-400" />;
    case 'failed':
      return <XCircle size={12} className="text-red-400" />;
    case 'waiting-checkpoint':
      return <AlertCircle size={12} className="text-amber-400" />;
    case 'cancelled':
      return <Ban size={12} className="text-muted/50" />;
  }
}

function statusLabel(status: NodeExecutionStatus): string {
  switch (status) {
    case 'pending': return 'Pending';
    case 'queued': return 'Queued';
    case 'running': return 'Running';
    case 'done': return 'Done';
    case 'failed': return 'Failed';
    case 'waiting-checkpoint': return 'Awaiting Approval';
    case 'cancelled': return 'Cancelled';
  }
}

function overallStatusBadge(status: ExecutionState['status']) {
  const colors: Record<ExecutionState['status'], string> = {
    running: 'bg-blue-500/20 text-blue-400',
    paused: 'bg-amber-500/20 text-amber-400',
    completed: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-muted/20 text-muted',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${colors[status]}`}>
      {status}
    </span>
  );
}

function NodeStatusRow({
  nodeId,
  status,
  output,
  error,
  onApprove,
}: {
  readonly nodeId: string;
  readonly status: NodeExecutionStatus;
  readonly output?: string;
  readonly error?: string;
  readonly onApprove: () => void;
}) {
  return (
    <div className="flex items-start gap-2 border-b border-border/50 py-1.5 last:border-b-0">
      <div className="mt-0.5 shrink-0">{statusIcon(status)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">{nodeId}</span>
          <span className="text-[10px] text-muted">{statusLabel(status)}</span>
        </div>
        {output && (
          <pre className="mt-0.5 max-h-24 overflow-y-auto whitespace-pre-wrap break-all rounded bg-background/50 p-1 text-[10px] text-muted/70 leading-relaxed">{output}</pre>
        )}
        {error && (
          <pre className="mt-0.5 max-h-16 overflow-y-auto whitespace-pre-wrap break-all rounded bg-red-500/5 p-1 text-[10px] text-red-400/70 leading-relaxed">{error}</pre>
        )}
        {status === 'waiting-checkpoint' && (
          <button
            onClick={onApprove}
            className="mt-1 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400 hover:bg-amber-500/30 transition-colors"
          >
            Approve
          </button>
        )}
      </div>
    </div>
  );
}

export function ExecutionPanel({
  executionState,
  logs,
  onCancel,
  onApproveCheckpoint,
}: ExecutionPanelProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const isTerminal = useMemo(
    () => ['completed', 'failed', 'cancelled'].includes(executionState.status),
    [executionState.status]
  );

  const progressPercent = useMemo(() => {
    if (executionState.totalLevels === 0) return 0;
    const doneNodes = executionState.nodes.filter((n) => n.status === 'done').length;
    const totalNodes = executionState.nodes.length;
    return totalNodes > 0 ? Math.round((doneNodes / totalNodes) * 100) : 0;
  }, [executionState]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Execution
          </h2>
          <div className="flex items-center gap-1.5">
            {!executionState.simulate && (
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                LIVE
              </span>
            )}
            {overallStatusBadge(executionState.status)}
          </div>
        </div>
        <p className="mt-1 text-sm font-medium">{executionState.workflowName}</p>
        {!executionState.simulate && (
          <div className="mt-1.5 flex items-start gap-1.5 rounded border border-amber-500/30 bg-amber-500/5 px-2 py-1">
            <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-400" />
            <p className="text-[10px] leading-tight text-amber-400/80">
              Live mode: executing <code className="font-mono">claude -p</code> for each node. 5 min timeout per node.
            </p>
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] text-muted">
            <span>
              Level {Math.min(executionState.currentLevel + 1, executionState.totalLevels)}/{executionState.totalLevels}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Node statuses */}
      <div className="flex-1 overflow-y-auto border-b border-border p-3">
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Nodes
        </h3>
        <div>
          {executionState.nodes.map((node) => (
            <NodeStatusRow
              key={node.nodeId}
              nodeId={node.nodeId}
              status={node.status}
              output={node.output}
              error={node.error}
              onApprove={() => onApproveCheckpoint(node.nodeId)}
            />
          ))}
        </div>
      </div>

      {/* Log output */}
      <div className="h-40 shrink-0 overflow-y-auto border-b border-border bg-background p-2">
        <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Log
        </h3>
        <div className="font-mono text-[10px] text-muted/70 leading-relaxed">
          {logs.map((line, idx) => (
            <div key={idx} className="break-all">{line}</div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Cancel button */}
      {!isTerminal && (
        <div className="p-3">
          <button
            onClick={onCancel}
            className="w-full rounded border border-red-500/30 bg-red-500/10 py-1 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Cancel Execution
          </button>
        </div>
      )}
    </div>
  );
}
