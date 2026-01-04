import { useState } from 'react'
import { Plus, Search, Filter, AlertTriangle, TrendingDown, Package, Clock, MapPin, Pill } from 'lucide-react'
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'

export default function StaffInventory() {
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

  const tabCounts = {
    critical: inventory.critical.length,
    low: inventory.low.length,
    refill: refillQueue.length
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <StaffSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Inventory Management</h1>
                <p className="text-sm text-slate-400">245 Items • 18 Low • 6 Critical</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Refill Request
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-[#2b3a66] to-[#18233f] border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Critical Stock</p>
                    <p className="text-3xl font-bold text-white mt-1">{tabCounts.critical}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#2b3a66] to-[#18233f] border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Low Stock</p>
                    <p className="text-3xl font-bold text-white mt-1">{tabCounts.low}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#2b3a66] to-[#18233f] border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Refill Queue</p>
                    <p className="text-3xl font-bold text-white mt-1">{tabCounts.refill}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search medicines and supplies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-sm font-medium transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>

            {/* Tabs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex gap-1 p-1 bg-slate-800/50">
                {[
                  { id: 'critical', label: 'Critical Stock', count: tabCounts.critical },
                  { id: 'low', label: 'Low Stock', count: tabCounts.low },
                  { id: 'refill', label: 'Refill Queue', count: tabCounts.refill }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="divide-y divide-slate-800">
                {activeTab === 'critical' && (
                  <div className="p-4 space-y-4">
                    {inventory.critical.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Pill className="w-4 h-4 text-red-400" />
                              <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <MapPin className="w-3 h-3" />
                              <span>{item.location}</span>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs font-medium rounded border border-red-500/20">
                            {item.status}
                          </span>
                        </div>

                        <div className="bg-slate-900/50 rounded p-3 mb-3">
                          <div className="flex items-center justify-between mb-2 text-xs">
                            <span className="text-slate-400">Stock: {item.stock} units</span>
                            <span className="text-slate-500">{getStockPercentage(item.stock, item.normal).toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${getStockColor(item.stock, item.reorder)}`}
                              style={{ width: `${getStockPercentage(item.stock, item.normal)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-slate-500 mt-1.5">
                            <span>Reorder: {item.reorder}</span>
                            <span>Normal: {item.normal}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                          <Clock className="w-3 h-3" />
                          <span>Daily usage: ~{item.dailyUsage} • Depletes in: ~{Math.ceil(item.stock / item.dailyUsage)} hours</span>
                        </div>

                        <div className="flex gap-2">
                          <button className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors">
                            Request Urgent
                          </button>
                          <button className="flex-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors border border-slate-700">
                            View History
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'low' && (
                  <div className="p-4 space-y-3">
                    {inventory.low.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Pill className="w-4 h-4 text-amber-400" />
                              <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span>Stock: {item.stock} units</span>
                              <span className="text-slate-500">•</span>
                              <span>{getStockPercentage(item.stock, item.normal).toFixed(0)}% remaining</span>
                            </div>
                          </div>
                          <button className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors">
                            Request Refill
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'refill' && (
                  <div className="p-4 space-y-4">
                    {refillQueue.map((request) => (
                      <div
                        key={request.id}
                        className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Package className="w-4 h-4 text-blue-400" />
                              <h3 className="text-sm font-semibold text-white">{request.medicine}</h3>
                            </div>
                            <p className="text-xs text-slate-400">Quantity: {request.quantity} units</p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium border ${
                              request.priority === 'URGENT'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-slate-700 text-slate-300 border-slate-600'
                            }`}
                          >
                            {request.priority}
                          </span>
                        </div>

                        <div className="bg-slate-900/50 rounded p-3 mb-3 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                            <span>By: {request.by} • {request.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Clock className="w-3 h-3 text-blue-400" />
                            <span>Delivery: {request.delivery}</span>
                          </div>
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>{request.status}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors">
                            Received
                          </button>
                          <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
                            Track
                          </button>
                          <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors border border-slate-700">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>
    </div>
  )
}
