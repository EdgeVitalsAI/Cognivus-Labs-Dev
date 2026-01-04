import { useState } from 'react'
import { Send, Plus, Search } from 'lucide-react'
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'

export default function StaffCommunication() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedChat, setSelectedChat] = useState(null)
  const [messageText, setMessageText] = useState('')

  const conversations = [
    {
      id: 1,
      name: 'Dr. Smith - Sarah Johnson Case',
      type: 'doctor',
      lastMessage: 'Lab results are ready',
      timestamp: '10:30 AM',
      unread: 2
    },
    {
      id: 2,
      name: 'Nurse Peterson',
      type: 'staff',
      lastMessage: 'Can you check room 302A?',
      timestamp: '9:15 AM',
      unread: 0
    },
    {
      id: 3,
      name: 'Care Team Meeting',
      type: 'group',
      lastMessage: 'Tomorrow 2 PM - Conference Room',
      timestamp: 'Yesterday',
      unread: 0
    }
  ]

  const messages = [
    {
      id: 1,
      sender: 'Dr. Smith',
      text: 'Hi Jane, how is Sarah Johnson doing today?',
      time: '10:15 AM',
      isYou: false
    },
    {
      id: 2,
      sender: 'You',
      text: 'Good morning Dr. Smith. Vitals are stable. HR 125, O2 97%. She completed morning meds.',
      time: '10:20 AM',
      isYou: true
    },
    {
      id: 3,
      sender: 'Dr. Smith',
      text: 'Lab results are ready',
      time: '10:30 AM',
      isYou: false
    }
  ]

  return (
    <div className="flex h-screen bg-slate-950">
      <StaffSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r border-slate-700 bg-slate-900 flex flex-col">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">Communications</h2>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-600"
                />
              </div>
              <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors">
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedChat(conv.id)}
                  className={`w-full px-4 py-3 border-b border-slate-800 text-left transition-colors hover:bg-slate-800/50 ${
                    selectedChat === conv.id ? 'bg-slate-800 border-l-2 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-white truncate">{conv.name}</h3>
                    {conv.unread > 0 && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-1">{conv.lastMessage}</p>
                  <p className="text-xs text-slate-500 mt-1">{conv.timestamp}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          {selectedChat ? (
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-700 bg-slate-900">
                <h3 className="text-lg font-semibold text-white">
                  {conversations.find((c) => c.id === selectedChat)?.name}
                </h3>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isYou ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-3 rounded-lg ${
                        msg.isYou
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {!msg.isYou && <p className="text-xs font-semibold mb-1">{msg.sender}</p>}
                      <p className="text-sm">{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.isYou ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-700 bg-slate-900">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-600"
                  />
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-slate-400">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
