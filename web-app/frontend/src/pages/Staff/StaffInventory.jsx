<<<<<<< HEAD
import { useState } from 'react'
import { Plus, Search, Filter, AlertTriangle, TrendingDown } from 'lucide-react'
=======
import { Package, Clock } from 'lucide-react'
>>>>>>> 463a8df4ac03684a528a77f308cc27824d2d55af
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'

export default function StaffInventory() {
<<<<<<< HEAD
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('critical')
  const [searchTerm, setSearchTerm] = useState('')

  const inventory = {
    critical: [
      {
        id: 1,
        name: 'Aspirin 100mg',
        stock: 10,
        reorder: 50,
        normal: 500,
        location: 'Med Room A, Shelf 3',
        dailyUsage: 45,
        status: 'CRITICAL'
      },
      {
        id: 2,
        name: 'Gauze Pads 4x4',
        stock: 5,
        reorder: 20,
        normal: 200,
        location: 'Med Room B, Drawer 2',
        dailyUsage: 15,
        status: 'CRITICAL'
      }
    ],
    low: [
      {
        id: 3,
        name: 'Lisinopril 10mg',
        stock: 45,
        reorder: 100,
        normal: 300,
        location: 'Med Room A, Shelf 1',
        dailyUsage: 20,
        status: 'LOW'
      },
      {
        id: 4,
        name: 'Syringes 3ml',
        stock: 150,
        reorder: 200,
        normal: 500,
        location: 'Supplies Room, Shelf 5',
        dailyUsage: 50,
        status: 'LOW'
      }
    ]
  }

  const refillQueue = [
    {
      id: 1,
      medicine: 'Aspirin 100mg',
      quantity: 1000,
      priority: 'URGENT',
      by: 'Nurse Johnson',
      time: '9:30 AM',
      status: 'Pending Approval',
      delivery: 'Today 5 PM'
    },
    {
      id: 2,
      medicine: 'Gauze Pads 4x4',
      quantity: 500,
      priority: 'STANDARD',
      by: 'Nurse Peterson',
      time: '8:45 AM',
      status: 'Approved',
      delivery: 'Tomorrow 10 AM'
    }
  ]

  const getStockPercentage = (stock, normal) => {
    return Math.min((stock / normal) * 100, 100)
  }

  const getStockColor = (stock, reorder) => {
    if (stock <= reorder / 2) return 'bg-red-500'
    if (stock <= reorder) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <StaffSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
=======
  return (
    <div className="flex h-screen bg-slate-950">
      <StaffSidebar />
>>>>>>> 463a8df4ac03684a528a77f308cc27824d2d55af

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

<<<<<<< HEAD
        <div className="flex-1 overflow-auto">
          <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
                <p className="text-slate-400 mt-1">245 Items | 18 Low | 6 Critical</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                <Plus className="w-5 h-5" />
                Refill Request
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-600"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors">
                <Filter className="w-5 h-5" />
                Filter
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-700">
              <button
                onClick={() => setActiveTab('critical')}
                className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === 'critical'
                    ? 'text-red-400 border-red-600'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                🔴 Critical Stock (6)
              </button>
              <button
                onClick={() => setActiveTab('low')}
                className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === 'low'
                    ? 'text-amber-400 border-amber-600'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                🟡 Low Stock (18)
              </button>
              <button
                onClick={() => setActiveTab('refill')}
                className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === 'refill'
                    ? 'text-blue-400 border-blue-600'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                📦 Refill Queue (12)
              </button>
            </div>

            {/* Content */}
            {activeTab === 'critical' && (
              <div className="space-y-4">
                {inventory.critical.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-5 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                        <p className="text-sm text-slate-400 mt-1">Location: {item.location}</p>
                      </div>
                      <span className="px-3 py-1 bg-red-900/30 border border-red-900/50 text-red-300 text-sm font-semibold rounded">
                        🔴 {item.status}
                      </span>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Stock: {item.stock} units</span>
                        <span className="text-xs text-slate-500">{getStockPercentage(item.stock, item.normal).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getStockColor(item.stock, item.reorder)}`}
                          style={{ width: `${getStockPercentage(item.stock, item.normal)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span>Reorder: {item.reorder}</span>
                        <span>Normal: {item.normal}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mb-4">
                      Daily usage: ~{item.dailyUsage} | Depletes in: ~{Math.ceil(item.stock / item.dailyUsage)} hours
                    </p>

                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors">
                        Request Urgent
                      </button>
                      <button className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded transition-colors">
                        View History
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'low' && (
              <div className="space-y-3">
                {inventory.low.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Stock: {item.stock} units ({getStockPercentage(item.stock, item.normal).toFixed(0)}%)
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded transition-colors">
                      Request Refill
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'refill' && (
              <div className="space-y-4">
                {refillQueue.map((request) => (
                  <div
                    key={request.id}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-5 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">📦 {request.medicine}</h3>
                        <p className="text-sm text-slate-400 mt-1">Quantity: {request.quantity} units</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded text-xs font-semibold border ${
                            request.priority === 'URGENT'
                              ? 'bg-red-900/30 border-red-900/50 text-red-300'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          {request.priority}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">Status: ⏳ {request.status}</p>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-3 mb-4 text-sm text-slate-400">
                      <p>By: {request.by} • {request.time}</p>
                      <p>Delivery: {request.delivery}</p>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded transition-colors">
                        Mark Received
                      </button>
                      <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors">
                        Track
                      </button>
                      <button className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
=======
        <div className="flex-1 overflow-auto flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800 mb-6">
              <Package className="w-10 h-10 text-slate-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Coming Soon</h1>
            <p className="text-slate-400 text-lg mb-6">
              Medical Inventory Management feature is currently under development
            </p>
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
              <Clock className="w-4 h-4" />
              <span>Expected release: Q1 2026</span>
            </div>
>>>>>>> 463a8df4ac03684a528a77f308cc27824d2d55af
          </div>
        </div>
      </div>
    </div>
  )
}
