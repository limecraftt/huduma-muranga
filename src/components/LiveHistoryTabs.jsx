/** Two-tab switch: Live (still needs work) and History (resolved), each with a count. */
export default function LiveHistoryTabs({ tab, onChange, liveCount, historyCount, label = 'List view' }) {
  const items = [
    { id: 'live', label: 'Live', count: liveCount },
    { id: 'history', label: 'History', count: historyCount },
  ]

  return (
    <div role="tablist" aria-label={label} className="grid grid-cols-2 rounded-xl bg-slate-200/70 p-1 sm:inline-grid sm:w-72">
      {items.map((t) => {
        const active = tab === t.id
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              active ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
            <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-brand-100 text-brand-800' : 'bg-white/70 text-slate-500'}`}>{t.count}</span>
          </button>
        )
      })}
    </div>
  )
}