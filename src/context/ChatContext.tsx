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

// Generate a deterministic, canonical conversation ID for any 2 users
export function getCanonicalDirectConvId(userId1: string, userId2: string): string {
  const sorted = [userId1.trim(), userId2.trim()].sort();
  return `dm_${sorted[0]}_${sorted[1]}`;
}

// Function to strictly merge and deduplicate conversations by participant pair
export function mergeAndDeduplicateConversations(
  rawConvs: Conversation[],
  rawMsgs: Record<string, Message[]>,
  currentUserId?: string,
  allUsersList?: UserProfile[]
): { conversations: Conversation[]; messages: Record<string, Message[]> } {
  const unifiedMessages: Record<string, Message[]> = {};
  const unifiedConvsMap = new Map<string, Conversation>();

  // Helper to find full user profile
  const findProfile = (id: string): UserProfile | undefined => {
    return allUsersList?.find((u) => u.id === id || u.username.toLowerCase() === id.toLowerCase());
  };

  // 1. Process all raw conversations and group by canonical ID
  for (const conv of rawConvs) {
    if (!conv || !conv.id) continue;

    if (conv.isGroup) {
      // Group chats have unique IDs
      const groupId = conv.id;
      const existingGroup = unifiedConvsMap.get(groupId);

      // Collect messages
      const convMsgs = rawMsgs[groupId] || (conv.lastMessage ? [conv.lastMessage] : []);
      const existingMsgs = unifiedMessages[groupId] || [];
      const combined = [...existingMsgs, ...convMsgs];

      // Deduplicate messages by ID
      const msgMap = new Map<string, Message>();
      for (const m of combined) {
        if (m && m.id) msgMap.set(m.id, m);
      }
      const sortedMsgs = Array.from(msgMap.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      unifiedMessages[groupId] = sortedMsgs;

      const latestMsg = sortedMsgs[sortedMsgs.length - 1] || conv.lastMessage;
      const latestTime = latestMsg?.createdAt || conv.updatedAt || new Date().toISOString();

      if (!existingGroup) {
        unifiedConvsMap.set(groupId, {
          ...conv,
          lastMessage: latestMsg,
          updatedAt: latestTime,
        });
      } else {
        unifiedConvsMap.set(groupId, {
          ...existingGroup,
          lastMessage: latestMsg,
          updatedAt: new Date(latestTime) > new Date(existingGroup.updatedAt) ? latestTime : existingGroup.updatedAt,
        });
      }
    } else {
      // Direct 1-to-1 Conversation
      const pIds = (conv.participantIds || []).filter(Boolean);
      if (pIds.length === 0) continue;

      let canonicalKey = conv.id;
      if (pIds.length >= 2) {
        canonicalKey = getCanonicalDirectConvId(pIds[0], pIds[1]);
      } else if (pIds.length === 1 && currentUserId) {
        canonicalKey = getCanonicalDirectConvId(currentUserId, pIds[0]);
      }

      // Collect all messages associated with both this conversation ID and canonicalKey
      const oldMsgs = rawMsgs[conv.id] || [];
      const canonicalMsgs = rawMsgs[canonicalKey] || [];
      const fallbackMsgs = conv.lastMessage ? [conv.lastMessage] : [];
      const currentStored = unifiedMessages[canonicalKey] || [];

      const combined = [...currentStored, ...oldMsgs, ...canonicalMsgs, ...fallbackMsgs];
      const msgMap = new Map<string, Message>();
      for (const m of combined) {
        if (m && m.id) {
          msgMap.set(m.id, {
            ...m,
            conversationId: canonicalKey,
          });
        }
      }
      const sortedMsgs = Array.from(msgMap.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      unifiedMessages[canonicalKey] = sortedMsgs;

      const latestMsg = sortedMsgs[sortedMsgs.length - 1] || conv.lastMessage;
      const latestTime = latestMsg?.createdAt || conv.updatedAt || new Date().toISOString();

      // Resolve participants cleanly
      const participantProfiles: UserProfile[] = [];
      const canonicalParticipantIds = pIds.length >= 2 ? [pIds[0], pIds[1]] : [currentUserId || pIds[0], pIds[0]];
      
      for (const id of canonicalParticipantIds) {
        const found = findProfile(id) || (conv.participants || []).find((p) => p.id === id);
        if (found && !participantProfiles.some((p) => p.id === found.id)) {
          participantProfiles.push(found);
        }
      }

      const existingConv = unifiedConvsMap.get(canonicalKey);
      if (!existingConv) {
        unifiedConvsMap.set(canonicalKey, {
          ...conv,
          id: canonicalKey,
          participantIds: canonicalParticipantIds,
          participants: participantProfiles.length > 0 ? participantProfiles : conv.participants,
          lastMessage: latestMsg,
          updatedAt: latestTime,
        });
      } else {
        unifiedConvsMap.set(canonicalKey, {
          ...existingConv,
          participants: participantProfiles.length >= existingConv.participants.length ? participantProfiles : existingConv.participants,
          lastMessage: latestMsg,
          updatedAt: new Date(latestTime) > new Date(existingConv.updatedAt) ? latestTime : existingConv.updatedAt,
        });
      }
    }
  }

  // 2. Also check any orphan message keys in rawMsgs not yet processed
  for (const [key, msgs] of Object.entries(rawMsgs)) {
    if (!unifiedMessages[key] && msgs.length > 0) {
      unifiedMessages[key] = [...msgs].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
  }

  // 3. Convert map to list and sort strictly by latest updated timestamp
  const finalConvs = Array.from(unifiedConvsMap.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return { conversations: finalConvs, messages: unifiedMessages };
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, getUserById, allUsers } = useAuth();

  // Initialize with seed data, merged and deduplicated
  const initialMerged = useMemo(() => {
    return mergeAndDeduplicateConversations(SEED_CONVERSATIONS, SEED_MESSAGES, currentUser?.id, allUsers);
  }, [currentUser?.id, allUsers]);

  const [conversations, setConversations] = useState<Conversation[]>(initialMerged.conversations);
  const [messages, setMessages] = useState<Record<string, Message[]>>(initialMerged.messages);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialMerged.conversations[0]?.id || null
  );

  // Hydrate from localStorage asynchronously after initial hydration
  useEffect(() => {
    try {
      const savedConvs = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      const savedMsgs = localStorage.getItem(MESSAGES_STORAGE_KEY);
      if (savedConvs || savedMsgs) {
        setTimeout(() => {
          let parsedConvs: Conversation[] = SEED_CONVERSATIONS;
          let parsedMsgs: Record<string, Message[]> = SEED_MESSAGES;

          if (savedConvs) {
            try {
              const c = JSON.parse(savedConvs);
              if (Array.isArray(c)) parsedConvs = c;
            } catch {}
          }
          if (savedMsgs) {
            try {
              const m = JSON.parse(savedMsgs);
              if (m && typeof m === 'object') parsedMsgs = m;
            } catch {}
          }

          const merged = mergeAndDeduplicateConversations(parsedConvs, parsedMsgs, currentUser?.id, allUsers);
          setConversations(merged.conversations);
          setMessages(merged.messages);
          if (merged.conversations.length > 0 && !activeConversationId) {
            setActiveConversationId(merged.conversations[0].id);
          }
        }, 0);
      }
    } catch {
      // fallback
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CONVERSATIONS_STORAGE_KEY || e.key === MESSAGES_STORAGE_KEY) {
        try {
          const convsStr = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
          const msgsStr = localStorage.getItem(MESSAGES_STORAGE_KEY);
          const c = convsStr ? JSON.parse(convsStr) : SEED_CONVERSATIONS;
          const m = msgsStr ? JSON.parse(msgsStr) : SEED_MESSAGES;
          const merged = mergeAndDeduplicateConversations(c, m, currentUser?.id, allUsers);
          setConversations(merged.conversations);
          setMessages(merged.messages);
        } catch {}
      }
    };

    // Live cross-client sync polling every 2 seconds
    const syncInterval = setInterval(() => {
      fetch('/api/sync')
        .then((res) => res.json())
        .then((data) => {
          if (data?.conversations || data?.messages) {
            setConversations((prevConvs) => {
              setMessages((prevMsgs) => {
                const combinedConvs = [...(data.conversations || []), ...prevConvs];
                const combinedMsgs = { ...(data.messages || {}), ...prevMsgs };
                const merged = mergeAndDeduplicateConversations(combinedConvs, combinedMsgs, currentUser?.id, allUsers);

                try {
                  localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(merged.conversations));
                  localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(merged.messages));
                } catch {}

                return merged.messages;
              });
              const combinedConvs = [...(data.conversations || []), ...prevConvs];
              const merged = mergeAndDeduplicateConversations(combinedConvs, messages, currentUser?.id, allUsers);
              return merged.conversations;
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
  }, [currentUser?.id, allUsers, activeConversationId, messages]);

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

  // Start or switch to a single unified 1-to-1 conversation
  const startDirectMessage = useCallback((targetUserId: string): string => {
    if (!currentUser) return '';

    const canonicalConvId = getCanonicalDirectConvId(currentUser.id, targetUserId);

    // Check if canonical conversation already exists
    const existing = conversations.find(
      (c) =>
        !c.isGroup &&
        (c.id === canonicalConvId ||
          (c.participantIds.includes(currentUser.id) && c.participantIds.includes(targetUserId)))
    );

    if (existing) {
      setActiveConversationId(existing.id);
      return existing.id;
    }

    const targetUser = getUserById(targetUserId) || allUsers.find((u) => u.id === targetUserId);
    if (!targetUser) return '';

    const newConv: Conversation = {
      id: canonicalConvId,
      isGroup: false,
      participantIds: [currentUser.id, targetUser.id],
      participants: [currentUser, targetUser],
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    };

    const updatedConvs = [newConv, ...conversations.filter((c) => c.id !== canonicalConvId)];
    persistConversations(updatedConvs);
    setActiveConversationId(canonicalConvId);
    return canonicalConvId;
  }, [currentUser, conversations, getUserById, allUsers, persistConversations]);

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

  // Unified Send Message: Appends to existing conversation & moves it to top
  const sendMessage = useCallback((input: SendMessageInput) => {
    if (!currentUser) return;

    let convId = input.conversationId;
    let targetReceiverId = input.receiverId;

    if (!convId && targetReceiverId) {
      convId = startDirectMessage(targetReceiverId);
    }

    if (!convId) return;

    // Find the conversation
    const currentConv = conversations.find((c) => c.id === convId);
    if (!targetReceiverId) {
      targetReceiverId = currentConv?.isGroup
        ? convId
        : currentConv?.participantIds.find((id) => id !== currentUser.id) || convId;
    }

    // Determine canonical conversation ID for direct chats
    let finalConvId = convId;
    if (currentConv && !currentConv.isGroup && targetReceiverId) {
      finalConvId = getCanonicalDirectConvId(currentUser.id, targetReceiverId);
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      conversationId: finalConvId,
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

    // 1. Append message to the single conversation history
    setMessages((prevMsgs) => {
      const currentList = prevMsgs[finalConvId] || prevMsgs[convId!] || [];
      const updatedMessages = {
        ...prevMsgs,
        [finalConvId]: [...currentList, newMessage],
      };
      persistMessages(updatedMessages);
      return updatedMessages;
    });

    // 2. Update conversation record & move to the TOP of the sidebar
    setConversations((prevConvs) => {
      let matchedConv = prevConvs.find((c) => c.id === finalConvId || c.id === convId);
      if (!matchedConv) {
        const receiverProfile = getUserById(targetReceiverId!) || allUsers.find((u) => u.id === targetReceiverId);
        matchedConv = {
          id: finalConvId,
          isGroup: false,
          participantIds: [currentUser.id, targetReceiverId!],
          participants: [currentUser, receiverProfile || currentUser],
          unreadCount: 0,
          updatedAt: newMessage.createdAt,
          lastMessage: newMessage,
        };
      } else {
        matchedConv = {
          ...matchedConv,
          id: finalConvId,
          lastMessage: newMessage,
          updatedAt: newMessage.createdAt,
        };
      }

      // Filter out any other duplicate copies and place the updated conversation at index 0
      const remaining = prevConvs.filter((c) => c.id !== finalConvId && c.id !== convId);
      const updatedConvs = [matchedConv, ...remaining];

      persistConversations(updatedConvs);
      return updatedConvs;
    });

    if (activeConversationId !== finalConvId) {
      setActiveConversationId(finalConvId);
    }

    sounds.playSend();

    // Broadcast to server for real-time multi-window sync
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_message',
        payload: {
          convId: finalConvId,
          message: newMessage,
          receiverId: targetReceiverId,
          sender: currentUser,
        },
      }),
    }).catch(() => {});
  }, [currentUser, conversations, startDirectMessage, getUserById, allUsers, activeConversationId, persistMessages, persistConversations]);

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

