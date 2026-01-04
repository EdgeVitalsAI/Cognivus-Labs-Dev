import { Activity, Thermometer, Wind, Heart } from 'lucide-react'

export default function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl p-5 bg-gradient-to-br from-[#2b3a66] to-[#18233f] border border-slate-700 text-slate-200 hover:border-slate-600 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-blue-600/20 border border-blue-600/30">
          <Icon className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
      </div>
    </div>
  )
}
