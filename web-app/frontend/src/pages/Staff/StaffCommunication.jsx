import { useState } from 'react'
import { Send, Plus, Search, Users, MessageSquare, CheckCheck, User, Stethoscope, UserCircle } from 'lucide-react'
import StaffSidebar from '../../components/staff/StaffSidebar'
import TopBar from '../../components/TopBar'

export default function StaffCommunication() {
  const [selectedChat, setSelectedChat] = useState(1)
  const [messageText, setMessageText] = useState('')

  const conversations = [
    {
      id: 1,
      name: 'Dr. Smith',
      subtitle: 'Sarah Johnson Case',
      type: 'doctor',
      lastMessage: 'Lab results are ready for review',
      timestamp: '10:30 AM',
      unread: 2,
      online: true
    },
    {
      id: 2,
      name: 'Nurse Peterson',
      subtitle: 'General Ward',
      type: 'staff',
      lastMessage: 'Can you check on room 302A?',
      timestamp: '9:15 AM',
      unread: 0,
      online: true
    },
    {
      id: 3,
      name: 'Dr. Williams',
      subtitle: 'Emma Davis Case',
      type: 'doctor',
      lastMessage: 'Patient discharge tomorrow',
      timestamp: 'Yesterday',
      unread: 0,
      online: false
    },
    {
      id: 4,
      name: 'Care Team Meeting',
      subtitle: '12 participants',
      type: 'group',
      lastMessage: 'Tomorrow 2 PM - Conference Room',
      timestamp: 'Yesterday',
      unread: 0,
      online: false
    }
  ]

  const messagesByChat = {
    1: [
      {
        id: 1,
        sender: 'Dr. Smith',
        text: 'Hi Jane, how is Sarah Johnson doing today?',
        time: '10:15 AM',
        isYou: false,
        read: true
      },
      {
        id: 2,
        sender: 'You',
        text: 'Good morning Dr. Smith. Vitals are stable. HR 125, O2 97%. She completed morning meds.',
        time: '10:20 AM',
        isYou: true,
        read: true
      },
      {
        id: 3,
        sender: 'Dr. Smith',
        text: 'Excellent. I reviewed the overnight notes. Any complaints from the patient?',
        time: '10:25 AM',
        isYou: false,
        read: true
      },
      {
        id: 4,
        sender: 'You',
        text: 'She mentioned mild chest discomfort around 8 AM, but it resolved after medication.',
        time: '10:27 AM',
        isYou: true,
        read: true
      },
      {
        id: 5,
        sender: 'Dr. Smith',
        text: 'Lab results are ready for review',
        time: '10:30 AM',
        isYou: false,
        read: false
      }
    ]
  }

  const selectedConversation = conversations.find((c) => c.id === selectedChat)
  const currentMessages = messagesByChat[selectedChat] || []

  const getIcon = (type) => {
    if (type === 'doctor') return Stethoscope
    if (type === 'group') return Users
    return UserCircle
  }

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread, 0)
  const activeChats = conversations.filter(c => c.unread > 0).length

  return (
    <div className="flex h-screen bg-slate-950">
      <StaffSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r border-slate-800 bg-slate-900 flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-800">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white mb-1">Messages</h2>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{activeChats} active</span>
                  </div>
                  {totalUnread > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>{totalUnread} unread</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
                />
              </div>

              <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700">
                <Plus className="w-4 h-4" />
                New Message
              </button>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => {
                const Icon = getIcon(conv.type)
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedChat(conv.id)}
                    className={`w-full px-4 py-3 border-b border-slate-800 text-left transition-colors hover:bg-slate-800/50 ${
                      selectedChat === conv.id ? 'bg-slate-800/70 border-l-2 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          conv.type === 'doctor' ? 'bg-blue-500/10' :
                          conv.type === 'group' ? 'bg-purple-500/10' : 'bg-emerald-500/10'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            conv.type === 'doctor' ? 'text-blue-400' :
                            conv.type === 'group' ? 'text-purple-400' : 'text-emerald-400'
                          }`} />
                        </div>
                        {conv.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-0.5">
                          <h3 className="text-sm font-semibold text-white truncate">{conv.name}</h3>
                          {conv.unread > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full min-w-[20px] text-center">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mb-1">{conv.subtitle}</p>
                        <p className="text-xs text-slate-400 truncate">{conv.lastMessage}</p>
                        <p className="text-xs text-slate-600 mt-1">{conv.timestamp}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Chat Area */}
          {selectedChat && selectedConversation ? (
            <div className="flex-1 flex flex-col bg-slate-950">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedConversation.type === 'doctor' ? 'bg-blue-500/10' :
                      selectedConversation.type === 'group' ? 'bg-purple-500/10' : 'bg-emerald-500/10'
                    }`}>
                      {(() => {
                        const Icon = getIcon(selectedConversation.type)
                        return <Icon className={`w-5 h-5 ${
                          selectedConversation.type === 'doctor' ? 'text-blue-400' :
                          selectedConversation.type === 'group' ? 'text-purple-400' : 'text-emerald-400'
                        }`} />
                      })()}
                    </div>
                    {selectedConversation.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{selectedConversation.name}</h3>
                    <p className="text-xs text-slate-400">
                      {selectedConversation.online ? 'Active now' : selectedConversation.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isYou ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-lg ${msg.isYou ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!msg.isYou && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-400" />
                          </div>
                        </div>
                      )}
                      <div className={`flex flex-col ${msg.isYou ? 'items-end' : 'items-start'}`}>
                        {!msg.isYou && (
                          <span className="text-xs font-medium text-slate-400 mb-1 px-1">{msg.sender}</span>
                        )}
                        <div
                          className={`px-4 py-2.5 rounded-2xl ${
                            msg.isYou
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 px-1 ${msg.isYou ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-xs text-slate-500">{msg.time}</span>
                          {msg.isYou && msg.read && (
                            <CheckCheck className="w-3 h-3 text-blue-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && messageText.trim()) {
                        setMessageText('')
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
                  />
                  <button
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    onClick={() => {
                      if (messageText.trim()) {
                        setMessageText('')
                      }
                    }}
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-950">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">No conversation selected</h3>
                <p className="text-sm text-slate-400">Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
