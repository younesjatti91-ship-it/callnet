'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  User,
  Shield,
  ShieldCheck,
  Headphones,
  UserCheck,
  Clock,
  CheckCheck,
  Check,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';

interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
}

interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  isSelf: boolean;
}

export default function InternalMessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchContact, setSearchContact] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchMeAndContacts = async () => {
      try {
        setLoadingContacts(true);
        const me = await api.getMe();
        setCurrentUser(me);

        const res = await api.listInternalContacts();
        const contactList: Contact[] = res.data || [];
        setContacts(contactList);

        if (contactList.length > 0) {
          setSelectedContact(contactList[0]);
        }
      } catch (err) {
        console.error('Failed to load contacts', err);
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchMeAndContacts();
  }, []);

  const loadConversation = async (contactId: string) => {
    try {
      setLoadingMessages(true);
      const res = await api.getInternalConversation(contactId);
      setMessages(res.data?.messages || []);
      // Reset unread count locally for this contact
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to load conversation', err);
    } finally {
      setLoadingMessages(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  useEffect(() => {
    if (selectedContact) {
      loadConversation(selectedContact.id);
    }
  }, [selectedContact?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const res = await api.sendInternalMessage(selectedContact.id, content);
      const sentMsg: MessageItem = res.data;
      setMessages((prev) => [...prev, sentMsg]);

      // Update last message in contact list
      setContacts((prev) =>
        prev.map((c) =>
          c.id === selectedContact.id
            ? {
                ...c,
                lastMessage: content,
                lastMessageAt: new Date().toISOString(),
              }
            : c
        )
      );

      setTimeout(scrollToBottom, 50);
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SuperAdmin':
        return {
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          icon: <ShieldCheck className="w-3 h-3" />,
          label: 'Super Admin',
        };
      case 'Admin':
        return {
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          icon: <Shield className="w-3 h-3" />,
          label: 'Admin',
        };
      case 'Manager':
        return {
          bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          icon: <UserCheck className="w-3 h-3" />,
          label: 'Manager',
        };
      case 'Agent':
        return {
          bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          icon: <Headphones className="w-3 h-3" />,
          label: 'Calling Agent',
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: <User className="w-3 h-3" />,
          label: role,
        };
    }
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchContact.toLowerCase()) ||
      c.role.toLowerCase().includes(searchContact.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-hidden p-4 md:p-6 flex flex-col">
          {/* Header Title */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Internal Team Communications
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
                Staff & Support Chat
              </h1>
              <p className="text-xs text-slate-400">
                Direct messaging with platform managers, call center agents, and administrative staff
              </p>
            </div>

            {currentUser?.role === 'Seller' && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted Staff Direct Channel</span>
              </div>
            )}
          </div>

          {/* 2-Pane Chat Box */}
          <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-0">
            {/* Left Pane: Contacts List */}
            <div
              className={`w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col ${
                selectedContact ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Search contacts */}
              <div className="p-3 border-b border-slate-800">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={searchContact}
                    onChange={(e) => setSearchContact(e.target.value)}
                    placeholder="Search agents & staff..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Contacts scroll list */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
                {loadingContacts ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                    Loading team directory...
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No matching staff members found.
                  </div>
                ) : (
                  filteredContacts.map((contact) => {
                    const isSelected = selectedContact?.id === contact.id;
                    const badge = getRoleBadge(contact.role);

                    return (
                      <div
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800/80 border-l-2 border-emerald-500'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-slate-200 border border-slate-700 uppercase">
                            {contact.name.slice(0, 2)}
                          </div>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-slate-200 truncate">{contact.name}</h4>
                            {contact.lastMessageAt && (
                              <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                                {formatDate(contact.lastMessageAt)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${badge.bg}`}
                            >
                              {badge.icon}
                              {badge.label}
                            </span>

                            {contact.unreadCount > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 ml-auto">
                                {contact.unreadCount}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 truncate mt-1">
                            {contact.lastMessage || 'No messages yet. Click to chat.'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Pane: Active Conversation */}
            <div
              className={`flex-1 flex flex-col bg-slate-950/40 ${
                !selectedContact ? 'hidden md:flex' : 'flex'
              }`}
            >
              {selectedContact ? (
                <>
                  {/* Chat Top Bar */}
                  <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedContact(null)}
                        className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>

                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-xs uppercase">
                          {selectedContact.name.slice(0, 2)}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{selectedContact.name}</h3>
                          <span
                            className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              getRoleBadge(selectedContact.role).bg
                            }`}
                          >
                            {getRoleBadge(selectedContact.role).icon}
                            {getRoleBadge(selectedContact.role).label}
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Online & Ready
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => loadConversation(selectedContact.id)}
                      className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Refresh messages"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingMessages ? 'animate-spin text-emerald-400' : ''}`} />
                    </button>
                  </div>

                  {/* Messages Bubble Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingMessages ? (
                      <div className="py-20 text-center text-xs text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                        Loading conversation history...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="py-20 text-center">
                        <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-slate-300">No messages in this chat</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                          Say hello to start the conversation with {selectedContact.name}.
                        </p>
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isMine = m.isSelf;

                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs ${
                                isMine
                                  ? 'bg-emerald-600 text-white rounded-br-xs shadow-md shadow-emerald-950/30'
                                  : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/80'
                              }`}
                            >
                              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                              <div
                                className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                                  isMine ? 'text-emerald-200' : 'text-slate-400'
                                }`}
                              >
                                <span>{formatDate(m.createdAt)}</span>
                                {isMine && (
                                  <span>
                                    {m.isRead ? (
                                      <CheckCheck className="w-3 h-3 text-emerald-200" />
                                    ) : (
                                      <Check className="w-3 h-3 text-emerald-300/70" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Composer Bar */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Message ${selectedContact.name}...`}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <MessageSquare className="w-12 h-12 text-slate-700 mb-3" />
                  <h3 className="text-sm font-bold text-slate-300">Select a team member to start chatting</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Pick a calling agent or admin from the directory on the left to coordinate order confirmations and fulfillment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
