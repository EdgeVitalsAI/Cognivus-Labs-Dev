const colorMap = {
  blue: {
    border: 'border-[#6E80E7]/25',
    glow: 'hover:shadow-[0_0_28px_rgba(110,128,231,0.18)]',
    iconBg: 'bg-[#6E80E7]/10',
    iconText: 'text-[#6E80E7]',
    bar: 'from-[#6E80E7] to-[#576FF1]',
    subText: 'text-[#6E80E7]',
  },
  red: {
    border: 'border-red-500/25',
    glow: 'hover:shadow-[0_0_28px_rgba(239,68,68,0.15)]',
    iconBg: 'bg-red-500/10',
    iconText: 'text-red-400',
    bar: 'from-red-500 to-red-600',
    subText: 'text-red-400',
  },
  emerald: {
    border: 'border-emerald-500/25',
    glow: 'hover:shadow-[0_0_28px_rgba(34,197,94,0.15)]',
    iconBg: 'bg-emerald-500/10',
    iconText: 'text-emerald-400',
    bar: 'from-emerald-500 to-emerald-600',
    subText: 'text-emerald-400',
  },
  amber: {
    border: 'border-amber-500/25',
    glow: 'hover:shadow-[0_0_28px_rgba(245,158,11,0.15)]',
    iconBg: 'bg-amber-500/10',
    iconText: 'text-amber-400',
    bar: 'from-amber-500 to-amber-600',
    subText: 'text-amber-400',
  },
}

const StatCard = ({ icon: Icon, label, value, sub, color = 'blue' }) => {
  const c = colorMap[color] || colorMap.blue
  return (
    <div className={`relative rounded-xl p-5 bg-slate-900 border ${c.border} ${c.glow} transition-all duration-300 overflow-hidden group`}>
      {/* Watermark icon */}
      <div className="absolute right-2 bottom-1 opacity-[0.04] pointer-events-none select-none">
        <Icon className="w-24 h-24" />
      </div>

      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${c.iconBg}`}>
          <Icon className={`w-5 h-5 ${c.iconText}`} />
        </div>
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="text-[2rem] font-bold text-white leading-none mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {value}
      </p>
      {sub && <p className={`text-xs font-medium ${c.subText}`}>{sub}</p>}

      {/* Bottom gradient bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r ${c.bar} opacity-60`} />
    </div>
  )
}

export default StatCard
