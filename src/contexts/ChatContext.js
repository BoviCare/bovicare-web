import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const STORAGE_KEY = 'bovicare_chat_conversations';

const generateId = () => `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load chat conversations from localStorage', e);
  }
  return [];
};

const saveToStorage = (conversations) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (e) {
    console.warn('Failed to save chat conversations to localStorage', e);
  }
};

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState(loadFromStorage);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const resetToInitialState = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
    setIsLoading(false);
  }, []);

  const createConversation = useCallback((title = 'Nova Conversa') => {
    const id = generateId();
    const conv = {
      id,
      title,
      messages: [],
      lastMessageAt: new Date().toISOString(),
    };
    setConversations((prev) => {
      const next = [conv, ...prev];
      saveToStorage(next);
      return next;
    });
    setCurrentConversationId(id);
    setMessages([]);
    return id;
  }, []);

  const setCurrentConversationIdHandler = useCallback((id) => {
    if (!id) {
      setCurrentConversationId(null);
      setMessages([]);
      return;
    }
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setCurrentConversationId(id);
      setMessages(conv.messages || []);
    }
  }, [conversations]);

  const deleteConversation = useCallback((conversationId) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== conversationId);
      saveToStorage(next);
      return next;
    });
    if (conversationId === currentConversationId) {
      resetToInitialState();
    }
  }, [currentConversationId, resetToInitialState]);

  const sendMessage = useCallback(async (query) => {
    if (!query?.trim() || isLoading) return;

    const isNewConversation = !currentConversationId;
    const convId = currentConversationId || createConversation();

    const userMessage = {
      id: generateMessageId(),
      role: 'user',
      content: query.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => (isNewConversation ? [userMessage] : [...prev, userMessage]));
    setIsLoading(true);

    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== convId) return c;
        const msgs = [...(c.messages || []), userMessage];
        return { ...c, messages: msgs, lastMessageAt: userMessage.created_at };
      });
      saveToStorage(updated);
      return updated;
    });

    try {
      const { data } = await api.post('/api/chat/diagnose', {
        message: query.trim(),
      });

      const assistantMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: data?.reply || 'Não consegui gerar uma resposta no momento.',
        created_at: new Date().toISOString(),
        sources: data?.sources || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.id !== convId) return c;
          const msgs = [...(c.messages || []), userMessage, assistantMessage];
          const newTitle = c.title === 'Nova Conversa'
            ? (query.trim().slice(0, 40) + (query.trim().length > 40 ? '...' : ''))
            : c.title;
          return { ...c, title: newTitle, messages: msgs, lastMessageAt: assistantMessage.created_at };
        });
        saveToStorage(updated);
        return updated;
      });
    } catch (error) {
      const errorMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Não consegui obter uma resposta. Tente novamente em instantes.',
        created_at: new Date().toISOString(),
        sources: [],
      };
      setMessages((prev) => [...prev, errorMessage]);
      setConversations((prev) => {
        const conv = prev.find((c) => c.id === convId);
        if (!conv) return prev;
        const msgs = [...(conv.messages || []), userMessage, errorMessage];
        const updated = prev.map((c) =>
          c.id === convId ? { ...c, messages: msgs, lastMessageAt: errorMessage.created_at } : c
        );
        saveToStorage(updated);
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentConversationId, isLoading, createConversation]);

  const value = {
    conversations,
    currentConversationId,
    messages,
    isLoading,
    setCurrentConversationId: setCurrentConversationIdHandler,
    resetToInitialState,
    createConversation,
    deleteConversation,
    sendMessage,
  };

  return (
    <ChatContext.Provider value={value}>
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
