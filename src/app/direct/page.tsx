'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AppShell } from '@/components/layout/AppShell';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { NotesTray } from '@/components/notes/NotesTray';
import { formatTimeAgo } from '@/lib/utils';
import {
  Send,
  Image as ImageIcon,
  Mic,
  Search,
  Play,
  Pause,
  Edit,
  Heart,
  Info,
  Users,
  LogOut,
  Check,
  ArrowLeft,
  Smile,
  Plus,
} from 'lucide-react';
import { EmojiPickerModal } from '@/components/ui/EmojiPicker';

export default function DirectMessagePage() {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    activeConversation,
    getConversationMessages,
    sendMessage,
    addMessageReaction,
    startDirectMessage,
    createGroupChat,
    leaveGroupChat,
    markAsRead,
  } = useChat();

  const { currentUser, allUsers } = useAuth();

  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [chatCreationTab, setChatCreationTab] = useState<'direct' | 'group'>('direct');
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [selectedMsgIdForReaction, setSelectedMsgIdForReaction] = useState<string | null>(null);
  const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMessages = useMemo(() => {
    return activeConversationId ? getConversationMessages(activeConversationId) : [];
  }, [activeConversationId, getConversationMessages]);

  const recipient = activeConversation?.isGroup
    ? null
    : activeConversation?.participants.find((p) => p.id !== currentUser?.id);

  // Auto mark active conversation as read
  useEffect(() => {
    if (activeConversationId) {
      markAsRead(activeConversationId);
    }
  }, [activeConversationId, markAsRead]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !selectedMediaUrl) return;

    sendMessage({
      conversationId: activeConversationId || undefined,
      receiverId: recipient ? recipient.id : activeConversationId || undefined,
      content: messageText.trim() || 'Shared an image',
      mediaUrl: selectedMediaUrl || undefined,
      mediaType: selectedMediaUrl ? 'image' : undefined,
    });

    setMessageText('');
    setSelectedMediaUrl(null);
  };

  const handleQuickHeartSend = () => {
    sendMessage({
      conversationId: activeConversationId || undefined,
      receiverId: recipient ? recipient.id : activeConversationId || undefined,
      content: '❤️',
    });
  };

  const handleSendVoiceNote = () => {
    sendMessage({
      conversationId: activeConversationId || undefined,
      receiverId: recipient ? recipient.id : activeConversationId || undefined,
      content: 'Voice note (0:18)',
      isAudioVoiceNote: true,
      audioDuration: 18,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedMediaUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMemberIds.length === 0) return;

    createGroupChat(newGroupName.trim() || 'Lumira Group', selectedMemberIds);
    setIsNewChatOpen(false);
    setNewGroupName('');
    setSelectedMemberIds([]);
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      u.id !== currentUser?.id &&
      (u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppShell title="Direct">
      <div className="max-w-[975px] mx-auto py-2 sm:py-6 px-0 sm:px-4 h-[calc(100vh-80px)]">
        <div className="w-full h-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl overflow-hidden flex select-none">
          {/* Left Column: Conversations List */}
          <div
            className={`w-full md:w-[350px] border-r border-[var(--border-color)] flex flex-col ${
              activeConversationId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-[var(--border-color)] flex items-center justify-between">
              <span className="text-base font-bold text-[var(--text-primary)] truncate">
                {currentUser?.username || 'Messages'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setIsNewChatOpen(true);
                    setChatCreationTab('direct');
                  }}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[var(--text-primary)] transition-colors cursor-pointer"
                  aria-label="New Message or Group"
                  title="New message or group"
                >
                  <Edit className="w-5 h-5 stroke-[1.75]" />
                </button>
              </div>
            </div>

            {/* Instagram Notes & Search Tray */}
            <NotesTray onSearchChange={(q) => setSearchQuery(q)} />

            {/* Subheader */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--text-primary)]">Messages & Groups</span>
              <button
                onClick={() => {
                  setIsNewChatOpen(true);
                  setChatCreationTab('group');
                }}
                className="text-[#0095f6] hover:text-[#1877f2] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>New Group</span>
              </button>
            </div>

            {/* Conversation Threads */}
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
              {conversations.map((conv) => {
                const isSelected = conv.id === activeConversationId;
                const other = conv.isGroup
                  ? null
                  : conv.participants.find((p) => p.id !== currentUser?.id);

                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-neutral-100 dark:bg-neutral-800/60'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30'
                    }`}
                  >
                    {conv.isGroup ? (
                      <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                        <Users className="w-6 h-6" />
                      </div>
                    ) : other ? (
                      <div className="relative shrink-0">
                        <Avatar src={other.avatarUrl} alt={other.displayName} size="md" isVerified={other.isVerified} />
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#10b981] ring-2 ring-[var(--bg-primary)]" />
                      </div>
                    ) : null}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {conv.isGroup ? conv.groupName : other?.username}
                        </p>
                        {conv.isGroup && (
                          <span className="text-[10px] text-blue-500 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">
                            Group
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-[11px] truncate ${
                          conv.unreadCount > 0
                            ? 'font-bold text-[var(--text-primary)]'
                            : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {conv.lastMessage?.content || 'Started a conversation'} • {formatTimeAgo(conv.updatedAt)}
                      </p>
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#0095f6]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Conversation */}
          {activeConversation ? (
            <div
              className={`flex-1 flex flex-col h-full bg-[var(--bg-primary)] ${
                activeConversationId ? 'flex' : 'hidden md:flex'
              }`}
            >
              {/* Active Conversation Top Bar */}
              <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-primary)]">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setActiveConversationId(null)}
                    className="md:hidden p-1 text-[var(--text-primary)] hover:opacity-75 cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {activeConversation.isGroup ? (
                    <div
                      onClick={() => setIsGroupDetailsOpen(true)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:underline">
                          {activeConversation.groupName}
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)]">
                          {activeConversation.participants.length} members • Click for details
                        </p>
                      </div>
                    </div>
                  ) : recipient ? (
                    <Link
                      href={`/profile/${recipient.username}`}
                      className="flex items-center gap-3 group min-w-0"
                    >
                      <div className="relative shrink-0">
                        <Avatar src={recipient.avatarUrl} alt={recipient.displayName} size="sm" isVerified={recipient.isVerified} />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10b981] ring-2 ring-[var(--bg-primary)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--text-primary)] group-hover:underline truncate">
                          {recipient.displayName}
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)] truncate">
                          @{recipient.username} • Active now
                        </p>
                      </div>
                    </Link>
                  ) : null}
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-3 text-[var(--text-primary)]">
                  <button
                    onClick={() => {
                      if (activeConversation.isGroup) setIsGroupDetailsOpen(true);
                    }}
                    className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    title={activeConversation.isGroup ? 'Group Info' : 'Details'}
                  >
                    <Info className="w-5 h-5 stroke-[1.75]" />
                  </button>
                </div>
              </div>

              {/* Messages Thread View */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-primary)]">
                {activeMessages.map((msg) => {
                  const isOwn = msg.senderId === currentUser?.id;
                  const senderUser = allUsers.find((u) => u.id === msg.senderId) || (isOwn ? currentUser : null);

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                    >
                      {/* In Group Chats: Display Sender Username */}
                      {activeConversation.isGroup && !isOwn && senderUser && (
                        <div className="flex items-center gap-1.5 mb-1 ml-1 text-[11px] text-[var(--text-secondary)] font-semibold">
                          <Avatar src={senderUser.avatarUrl} alt={senderUser.displayName} size="xs" />
                          <span>{senderUser.username}</span>
                        </div>
                      )}

                      <div className={`flex items-end gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Media image message */}
                        {msg.mediaUrl ? (
                          <div className="rounded-2xl overflow-hidden shadow-md max-w-[280px]">
                            <Image
                              src={msg.mediaUrl}
                              alt="Media"
                              width={280}
                              height={280}
                              className="object-cover"
                              unoptimized
                            />
                            {msg.content && msg.content !== 'Shared an image' && (
                              <p className={`p-2.5 text-xs ${isOwn ? 'bg-[#0095f6] text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-[var(--text-primary)]'}`}>
                                {msg.content}
                              </p>
                            )}
                          </div>
                        ) : msg.isAudioVoiceNote ? (
                          /* Voice note message */
                          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl ${
                            isOwn ? 'bg-[#0095f6] text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-[var(--text-primary)]'
                          }`}>
                            <button
                              type="button"
                              onClick={() => setPlayingVoiceId(playingVoiceId === msg.id ? null : msg.id)}
                              className="p-1 rounded-full bg-white/20 hover:bg-white/30 cursor-pointer"
                            >
                              {playingVoiceId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                            </button>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1">
                                {[40, 70, 90, 60, 30, 80, 50, 65, 40].map((h, i) => (
                                  <span key={i} style={{ height: `${h}%` }} className="w-1 bg-current rounded-full h-3 inline-block" />
                                ))}
                              </div>
                              <span className="text-[10px] opacity-80">0:18</span>
                            </div>
                          </div>
                        ) : (
                          /* Regular text message */
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-xs ${
                              isOwn
                                ? 'bg-[#0095f6] text-white rounded-br-xs'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-[var(--text-primary)] rounded-bl-xs'
                            }`}
                          >
                            <p>{msg.content}</p>
                          </div>
                        )}

                        {/* Quick Emoji Reaction Buttons */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
                          <button
                            type="button"
                            onClick={() => addMessageReaction(msg.id, '❤️')}
                            className="hover:scale-125 p-1 text-[var(--text-secondary)] hover:text-rose-500 transition-all cursor-pointer"
                            title="React ❤️"
                          >
                            <Heart className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMsgIdForReaction(msg.id);
                              setIsEmojiPickerOpen(true);
                            }}
                            className="hover:scale-125 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                            title="React with any emoji"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Emoji Reactions Tray */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 px-1">
                          {msg.reactions.map((r, i) => (
                            <span
                              key={i}
                              onClick={() => {
                                setSelectedMsgIdForReaction(msg.id);
                                setIsEmojiPickerOpen(true);
                              }}
                              className="text-xs px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-[var(--border-color)] shadow-xs cursor-pointer hover:scale-110 transition-transform"
                            >
                              {r.emoji}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Message Input Bar */}
              <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
                {selectedMediaUrl && (
                  <div className="relative w-16 h-16 mb-2 rounded-xl overflow-hidden border border-[var(--border-color)]">
                    <Image src={selectedMediaUrl} alt="Selected attachment" fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => setSelectedMediaUrl(null)}
                      className="absolute top-1 right-1 p-0.5 bg-black/70 text-white rounded-full text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    title="Send image"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSendVoiceNote}
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    title="Send voice note"
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMsgIdForReaction(null);
                      setIsEmojiPickerOpen(true);
                    }}
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    title="Emoji picker"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={activeConversation.isGroup ? `Message ${activeConversation.groupName}...` : `Message @${recipient?.username}...`}
                    className="flex-1 px-4 py-2.5 rounded-full bg-[var(--input-bg)] text-xs text-[var(--text-primary)] focus:outline-none border border-[var(--border-color)] placeholder-[var(--text-secondary)]"
                  />

                  {messageText.trim() || selectedMediaUrl ? (
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-full bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Send
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleQuickHeartSend}
                      className="p-2 text-rose-500 hover:scale-125 transition-transform cursor-pointer"
                      title="Send Heart"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  )}
                </form>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-24 h-24 rounded-full border-2 border-[var(--text-primary)] flex items-center justify-center">
                <Send className="w-12 h-12 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Your messages</h2>
                <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
                  Send private messages and media to friends or create group chats.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsNewChatOpen(true);
                    setChatCreationTab('direct');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  Send message
                </button>
                <button
                  onClick={() => {
                    setIsNewChatOpen(true);
                    setChatCreationTab('group');
                  }}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[var(--text-primary)] text-xs font-bold transition-colors cursor-pointer"
                >
                  New Group
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Message / New Group Chat Modal */}
      <Modal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} title="New Chat" size="md">
        <div className="p-4 space-y-4">
          {/* Tab Switcher: Direct vs Group */}
          <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            <button
              type="button"
              onClick={() => setChatCreationTab('direct')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                chatCreationTab === 'direct'
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Direct Message
            </button>
            <button
              type="button"
              onClick={() => setChatCreationTab('group')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                chatCreationTab === 'group'
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Create Group</span>
            </button>
          </div>

          {/* Group Name input (if Group tab) */}
          {chatCreationTab === 'group' && (
            <div>
              <label className="text-xs font-bold text-[var(--text-primary)] block mb-1">Group Name</label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. Lumira Creators 🚀, Design Team"
                maxLength={40}
                className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] text-xs text-[var(--text-primary)] border border-[var(--border-color)] focus:outline-none"
              />
            </div>
          )}

          {/* Search Contacts */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--input-bg)] text-xs text-[var(--text-primary)] focus:outline-none border border-[var(--border-color)]"
            />
          </div>

          {/* User List */}
          <div className="max-h-60 overflow-y-auto space-y-1">
            {filteredUsers.map((user) => {
              const isSelected = selectedMemberIds.includes(user.id);

              return (
                <div
                  key={user.id}
                  onClick={() => {
                    if (chatCreationTab === 'direct') {
                      startDirectMessage(user.id);
                      setIsNewChatOpen(false);
                    } else {
                      toggleMemberSelection(user.id);
                    }
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" isVerified={user.isVerified} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.username}</p>
                      <p className="text-[11px] text-[var(--text-secondary)] truncate">{user.displayName}</p>
                    </div>
                  </div>

                  {chatCreationTab === 'direct' ? (
                    <span className="text-xs font-bold text-[#0095f6]">Chat</span>
                  ) : (
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#0095f6] border-[#0095f6] text-white'
                          : 'border-[var(--border-color)]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Create Group Submit button */}
          {chatCreationTab === 'group' && (
            <div className="pt-2 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={selectedMemberIds.length === 0}
                className="w-full py-2.5 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <Users className="w-4 h-4" />
                <span>Create Group Chat ({selectedMemberIds.length} members)</span>
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Group Details & Members Modal */}
      {activeConversation && activeConversation.isGroup && (
        <Modal
          isOpen={isGroupDetailsOpen}
          onClose={() => setIsGroupDetailsOpen(false)}
          title="Group Details"
          size="md"
        >
          <div className="p-4 space-y-4">
            {/* Group Header */}
            <div className="flex flex-col items-center text-center gap-2 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{activeConversation.groupName}</h3>
                <p className="text-[11px] text-[var(--text-secondary)]">{activeConversation.participants.length} group members</p>
              </div>
            </div>

            {/* Member List */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-[var(--text-primary)]">Members</p>
              <div className="max-h-52 overflow-y-auto space-y-1">
                {activeConversation.participants.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <Link
                      href={`/profile/${member.username}`}
                      onClick={() => setIsGroupDetailsOpen(false)}
                      className="flex items-center gap-3 min-w-0"
                    >
                      <Avatar src={member.avatarUrl} alt={member.displayName} size="sm" isVerified={member.isVerified} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{member.username}</p>
                        <p className="text-[11px] text-[var(--text-secondary)] truncate">{member.displayName}</p>
                      </div>
                    </Link>

                    {member.id === currentUser?.id && (
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Leave Group Button */}
            <div className="pt-2 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => {
                  leaveGroupChat(activeConversation.id);
                  setIsGroupDetailsOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Leave Group Chat</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Full Every Emoji Picker Modal */}
      <EmojiPickerModal
        isOpen={isEmojiPickerOpen}
        onClose={() => {
          setIsEmojiPickerOpen(false);
          setSelectedMsgIdForReaction(null);
        }}
        onSelectEmoji={(emoji) => {
          if (selectedMsgIdForReaction) {
            addMessageReaction(selectedMsgIdForReaction, emoji);
            setSelectedMsgIdForReaction(null);
          } else {
            setMessageText((prev) => prev + emoji);
          }
        }}
        title={selectedMsgIdForReaction ? 'React with Emoji' : 'Pick an Emoji'}
      />
    </AppShell>
  );
}
