import { AlertTriangle } from 'lucide-react'

export default function LowStock({ items }) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-700 text-slate-200">
      <div className="px-6 py-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white">Low Stock Items</h3>
        <p className="text-xs text-slate-400 mt-1">{items.length} items need attention</p>
      </div>

      <div className="p-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-white">{item.name}</p>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    item.level === 'high'
                      ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-900/50'
                      : item.level === 'medium'
                      ? 'bg-amber-900/30 text-amber-300 border border-amber-900/50'
                      : 'bg-red-900/30 text-red-300 border border-red-900/50'
                  }`}
                >
                  {item.level.toUpperCase()}
                </span>
              </div>

              <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
                <div
                  className={`h-1.5 rounded-full ${
                    item.level === 'high' ? 'bg-emerald-500' : item.level === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${item.stock}%` }}
                />
              </div>

              <p className="text-xs text-slate-400 mb-3">Stock: {item.stock} units</p>

              <button className="w-full px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors">
                Request Refill
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-slate-400 py-6">All items in stock</p>
        )}
      </div>
    </div>
  )
}
