const ActivityFeed = ({ items }) => (
  <div className="rounded-xl bg-slate-900 border border-slate-700 text-slate-200">
    <div className="px-5 py-4 border-b border-slate-700">
      <h3 className="text-sm font-semibold">Recent Activity Feed</h3>
    </div>
    <ul className="divide-y divide-slate-800">
      {items.map((it, i) => (
        <li key={i} className="px-5 py-3 hover:bg-slate-800/50 transition-colors cursor-pointer">
          <p className="text-sm text-slate-200">{it.title}</p>
          <p className="text-xs text-slate-400">{it.author}</p>
          <p className="text-[11px] text-slate-500 mt-1">{it.time}</p>
        </li>
      ))}
    </ul>
  </div>
)

export default ActivityFeed
