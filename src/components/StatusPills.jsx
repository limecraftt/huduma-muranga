/**
 * Row of filter pills with counts, e.g. All 12 · Pending 3 · In Progress 4 · Resolved 5.
 * `options` is [{ id, label, count }]. On phones the row scrolls sideways inside itself.
 */
export default function StatusPills({ options, value, onChange, label = 'Filter by status' }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label={label}>
      {options.map((o) => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            aria-pressed={active}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {o.label} <span className={active ? 'text-brand-100' : 'text-slate-400'}>{o.count}</span>
          </button>
        )
      })}
    </div>
  )
}