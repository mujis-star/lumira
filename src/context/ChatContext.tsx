'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Conversation, Message, UserProfile } from '@/lib/types';
import { SEED_CONVERSATIONS, SEED_MESSAGES } from '@/lib/seedData';
import { useAuth } from './AuthContext';
import { sounds, triggerConfetti } from '@/lib/utils';

interface SendMessageInput {
  conversationId?: string;
  receiverId?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  isAudioVoiceNote?: boolean;
  audioDuration?: number;
}

interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  activeConversation: Conversation | undefined;
  getConversationMessages: (convId: string) => Message[];
  sendMessage: (input: SendMessageInput) => void;
  addMessageReaction: (messageId: string, emoji: string) => void;
  startDirectMessage: (targetUserId: string) => string;
  createGroupChat: (groupName: string, memberUserIds: string[], groupAvatarUrl?: string) => string;
  updateGroupChat: (convId: string, updates: { groupName?: string; groupAvatarUrl?: string; addMemberIds?: string[]; removeMemberIds?: string[] }) => void;
  leaveGroupChat: (convId: string) => void;
  markAsRead: (convId: string) => void;
  totalUnreadCount: number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const CONVERSATIONS_STORAGE_KEY = 'lumira-v2-conversations';
const MESSAGES_STORAGE_KEY = 'lumira-v2-messages';

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, getUserById, allUsers } = useAuth();

  // Initialize with seed data for 100% server-client hydration consistency
  const [conversations, setConversations] = useState<Conversation[]>(SEED_CONVERSATIONS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(SEED_MESSAGES);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    SEED_CONVERSATIONS[0]?.id || null
  );

  // Hydrate from localStorage asynchronously after initial hydration
  useEffect(() => {
    try {
      const savedConvs = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      const savedMsgs = localStorage.getItem(MESSAGES_STORAGE_KEY);
      if (savedConvs || savedMsgs) {
        setTimeout(() => {
          if (savedConvs) {
            try { setConversations(JSON.parse(savedConvs)); } catch {}
          }
          if (savedMsgs) {
            try { setMessages(JSON.parse(savedMsgs)); } catch {}
          }
        }, 0);
      }
    } catch {
      // fallback
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CONVERSATIONS_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setConversations(parsed);
        } catch {}
      }
      if (e.key === MESSAGES_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') setMessages(parsed);
        } catch {}
      }
    };

    // Live cross-client sync polling every 2 seconds
    const syncInterval = setInterval(() => {
      fetch('/api/sync')
        .then((res) => res.json())
        .then((data) => {
          if (data?.messages && typeof data.messages === 'object') {
            setMessages((prevMsgs) => {
              let hasChanges = false;
              const merged = { ...prevMsgs };
              for (const [convId, serverMsgList] of Object.entries(data.messages)) {
                const currentList = merged[convId] || [];
                const currentIds = new Set(currentList.map((m: Message) => m.id));
                const newItems = (serverMsgList as Message[]).filter((m: Message) => !currentIds.has(m.id));
                if (newItems.length > 0) {
                  merged[convId] = [...currentList, ...newItems];
                  hasChanges = true;
                }
              }
              if (hasChanges) {
                try { localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(merged)); } catch {}
                return merged;
              }
              return prevMsgs;
            });
          }

          if (data?.conversations && Array.isArray(data.conversations)) {
            setConversations((prevConvs) => {
              const currentIds = new Set(prevConvs.map((c) => c.id));
              const missingConvs = data.conversations.filter((c: Conversation) => !currentIds.has(c.id));
              if (missingConvs.length > 0) {
                const merged = [...missingConvs, ...prevConvs];
                try { localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(merged)); } catch {}
                return merged;
              }
              return prevConvs;
            });
          }
        })
        .catch(() => {});
    }, 2000);

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(syncInterval);
    };
  }, []);

  const persistConversations = useCallback((updated: Conversation[]) => {
    setConversations(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage limit for conversations:', err);
      }
    }
  }, []);

  const persistMessages = useCallback((updated: Record<string, Message[]>) => {
    setMessages(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage limit for messages:', err);
      }
    }
  }, []);

  const getConversationMessages = useCallback((convId: string): Message[] => {
    return messages[convId] || [];
  }, [messages]);

  const startDirectMessage = useCallback((targetUserId: string): string => {
    if (!currentUser) return '';

    const existing = conversations.find(
      (c) =>
        !c.isGroup &&
        c.participantIds.includes(currentUser.id) &&
        c.participantIds.includes(targetUserId)
    );

    if (existing) {
      setActiveConversationId(existing.id);
      return existing.id;
    }

    const targetUser = getUserById(targetUserId);
    if (!targetUser) return '';

    const newConvId = `conv-${currentUser.id}-${targetUserId}`;
    const newConv: Conversation = {
      id: newConvId,
      isGroup: false,
      participantIds: [currentUser.id, targetUserId],
      participants: [currentUser, targetUser],
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    };

    const updatedConvs = [newConv, ...conversations];
    persistConversations(updatedConvs);
    setActiveConversationId(newConvId);
    return newConvId;
  }, [currentUser, conversations, getUserById, persistConversations]);

  const createGroupChat = useCallback((groupName: string, memberUserIds: string[], groupAvatarUrl?: string): string => {
    if (!currentUser) return '';

    const uniqueMemberIds = Array.from(new Set([currentUser.id, ...memberUserIds]));
    const memberProfiles = uniqueMemberIds
      .map((id) => (id === currentUser.id ? currentUser : getUserById(id) || allUsers.find((u) => u.id === id)))
      .filter((u): u is UserProfile => !!u);

    const newGroupId = `group-${Date.now()}`;
    const defaultGroupAvatar =
      groupAvatarUrl ||
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80';

    const newGroupConv: Conversation = {
      id: newGroupId,
      isGroup: true,
      groupName: groupName.trim() || 'Lumira Group',
      groupAvatarUrl: defaultGroupAvatar,
      adminIds: [currentUser.id],
      participantIds: uniqueMemberIds,
      participants: memberProfiles,
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    };

    const welcomeMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: newGroupId,
      senderId: currentUser.id,
      receiverId: newGroupId,
      content: `🎉 Created the group "${newGroupConv.groupName}" with ${memberProfiles.length} members.`,
      isRead: true,
      createdAt: new Date().toISOString(),
    };

    const updatedConvs = [
      {
        ...newGroupConv,
        lastMessage: welcomeMessage,
      },
      ...conversations,
    ];

    const updatedMessages = {
      ...messages,
      [newGroupId]: [welcomeMessage],
    };

    persistConversations(updatedConvs);
    persistMessages(updatedMessages);
    setActiveConversationId(newGroupId);
    sounds.playSend();
    triggerConfetti(0.5, 0.5);

    return newGroupId;
  }, [currentUser, allUsers, conversations, messages, getUserById, persistConversations, persistMessages]);

  const updateGroupChat = useCallback((convId: string, updates: { groupName?: string; groupAvatarUrl?: string; addMemberIds?: string[]; removeMemberIds?: string[] }) => {
    setConversations((prevConvs) => {
      const updated = prevConvs.map((c) => {
        if (c.id === convId && c.isGroup) {
          let updatedParticipantIds = [...c.participantIds];
          if (updates.addMemberIds) {
            updatedParticipantIds = Array.from(new Set([...updatedParticipantIds, ...updates.addMemberIds]));
          }
          if (updates.removeMemberIds) {
            updatedParticipantIds = updatedParticipantIds.filter((id) => !updates.removeMemberIds?.includes(id));
          }

          const updatedParticipants = updatedParticipantIds
            .map((id) => allUsers.find((u) => u.id === id) || (id === currentUser?.id ? currentUser : null))
            .filter((u): u is UserProfile => !!u);

          return {
            ...c,
            groupName: updates.groupName !== undefined ? updates.groupName.trim() || c.groupName : c.groupName,
            groupAvatarUrl: updates.groupAvatarUrl || c.groupAvatarUrl,
            participantIds: updatedParticipantIds,
            participants: updatedParticipants,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      });

      persistConversations(updated);
      return updated;
    });
  }, [allUsers, currentUser, persistConversations]);

  const leaveGroupChat = useCallback((convId: string) => {
    if (!currentUser) return;

    setConversations((prevConvs) => {
      const updated = prevConvs
        .map((c) => {
          if (c.id === convId && c.isGroup) {
            const updatedIds = c.participantIds.filter((id) => id !== currentUser.id);
            const updatedParticipants = c.participants.filter((p) => p.id !== currentUser.id);
            return {
              ...c,
              participantIds: updatedIds,
              participants: updatedParticipants,
            };
          }
          return c;
        })
        .filter((c) => c.participantIds.length > 0);

      persistConversations(updated);
      if (activeConversationId === convId) {
        setActiveConversationId(updated[0]?.id || null);
      }
      return updated;
    });
  }, [currentUser, activeConversationId, persistConversations]);

  const sendMessage = useCallback((input: SendMessageInput) => {
    if (!currentUser) return;

    let convId = input.conversationId;
    let targetReceiverId = input.receiverId;

    if (!convId && targetReceiverId) {
      convId = startDirectMessage(targetReceiverId);
    }

    if (!convId) return;

    const currentConv = conversations.find((c) => c.id === convId);
    if (!targetReceiverId) {
      targetReceiverId = currentConv?.isGroup
        ? convId
        : currentConv?.participantIds.find((id) => id !== currentUser.id) || convId;
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: convId,
      senderId: currentUser.id,
      receiverId: targetReceiverId,
      content: input.content,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      isAudioVoiceNote: input.isAudioVoiceNote,
      audioDuration: input.audioDuration,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((prevMsgs) => {
      const currentConvMessages = prevMsgs[convId!] || [];
      const updatedMessages = {
        ...prevMsgs,
        [convId!]: [...currentConvMessages, newMessage],
      };
      persistMessages(updatedMessages);
      return updatedMessages;
    });

    setConversations((prevConvs) => {
      const updatedConvs = prevConvs.map((c) =>
        c.id === convId
          ? {
              ...c,
              lastMessage: newMessage,
              updatedAt: new Date().toISOString(),
            }
          : c
      );
      persistConversations(updatedConvs);
      return updatedConvs;
    });

    sounds.playSend();

    // Broadcast to server for real-time multi-window sync
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_message',
        payload: {
          convId,
          message: newMessage,
          receiverId: targetReceiverId,
          sender: currentUser,
        },
      }),
    }).catch(() => {});
  }, [currentUser, conversations, startDirectMessage, persistMessages, persistConversations]);

  const addMessageReaction = useCallback((messageId: string, emoji: string) => {
    if (!currentUser || !activeConversationId) return;

    setMessages((prevMsgs) => {
      const convMsgs = prevMsgs[activeConversationId] || [];
      const updatedConvMsgs = convMsgs.map((m) => {
        if (m.id === messageId) {
          const currentReactions = m.reactions || [];
          const existingIdx = currentReactions.findIndex((r) => r.userId === currentUser.id);

          let updatedReactions;
          if (existingIdx >= 0) {
            if (currentReactions[existingIdx].emoji === emoji) {
              updatedReactions = currentReactions.filter((_, i) => i !== existingIdx);
            } else {
              updatedReactions = currentReactions.map((r, i) =>
                i === existingIdx ? { ...r, emoji } : r
              );
            }
          } else {
            updatedReactions = [...currentReactions, { userId: currentUser.id, emoji }];
          }

          return { ...m, reactions: updatedReactions };
        }
        return m;
      });

      const updated = {
        ...prevMsgs,
        [activeConversationId]: updatedConvMsgs,
      };

      persistMessages(updated);
      return updated;
    });

    sounds.playPop();
  }, [currentUser, activeConversationId, persistMessages]);

  const markAsRead = useCallback((convId: string) => {
    setConversations((prevConvs) => {
      const conv = prevConvs.find((c) => c.id === convId);
      if (!conv || conv.unreadCount === 0) return prevConvs;

      const updatedConvs = prevConvs.map((c) =>
        c.id === convId ? { ...c, unreadCount: 0 } : c
      );
      persistConversations(updatedConvs);
      return updatedConvs;
    });
  }, [persistConversations]);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId);
  }, [conversations, activeConversationId]);

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [conversations]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        setActiveConversationId,
        activeConversation,
        getConversationMessages,
        sendMessage,
        addMessageReaction,
        startDirectMessage,
        createGroupChat,
        updateGroupChat,
        leaveGroupChat,
        markAsRead,
        totalUnreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
