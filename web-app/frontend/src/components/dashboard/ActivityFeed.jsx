import { FileText, Pill, ClipboardList, UserPlus, Stethoscope } from 'lucide-react'

const TYPE_ICONS = {
  note:         { icon: FileText,     color: 'text-[#6E80E7]', bg: 'bg-[#6E80E7]/10' },
  prescription: { icon: Pill,         color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  task:         { icon: ClipboardList,color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
  admission:    { icon: UserPlus,     color: 'text-cyan-400',   bg: 'bg-cyan-500/10'   },
  default:      { icon: Stethoscope,  color: 'text-slate-400',  bg: 'bg-slate-700/50'  },
}

const getTypeConfig = (title = '') => {
  const t = title.toLowerCase()
  if (t.includes('note') || t.includes('report'))    return TYPE_ICONS.note
  if (t.includes('prescription') || t.includes('medication')) return TYPE_ICONS.prescription
  if (t.includes('task'))        return TYPE_ICONS.task
  if (t.includes('admit') || t.includes('patient'))  return TYPE_ICONS.admission
  return TYPE_ICONS.default
}

const ActivityFeed = ({ items }) => (
  <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col">
    <div className="px-5 py-4 border-b border-slate-800 flex-shrink-0">
      <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
      <p className="text-[11px] text-slate-500 mt-0.5">Latest clinical actions</p>
    </div>

    {items.length === 0 ? (
      <div className="p-8 flex flex-col items-center gap-2">
        <ClipboardList className="w-8 h-8 text-slate-700" />
        <p className="text-sm text-slate-500">No recent activity</p>
      </div>
    ) : (
      <ul className="divide-y divide-slate-800/70">
        {items.map((it, i) => {
          const cfg = getTypeConfig(it.title)
          const IconComp = cfg.icon
          return (
            <li key={i} className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-slate-800/40 transition-colors cursor-pointer">
              {/* Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${cfg.bg} mt-0.5`}>
                <IconComp className={`w-4 h-4 ${cfg.color}`} />
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 leading-snug line-clamp-1">{it.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{it.author}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{it.time}</p>
              </div>
            </li>
          )
        })}
      </ul>
    )}
  </div>
)

export default ActivityFeed
