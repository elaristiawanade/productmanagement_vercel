const P = {
  critical: { label: 'Critical', cls: 'bg-red-100 text-red-700',       dot: 'bg-red-500'    },
  high:     { label: 'High',     cls: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  medium:   { label: 'Medium',   cls: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  low:      { label: 'Low',      cls: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400'  },
};

export default function PriorityBadge({ priority }) {
  const p = P[priority] ?? P.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${p.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
      {p.label}
    </span>
  );
}
