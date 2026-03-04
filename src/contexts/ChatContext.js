import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  getConversations,
  createConversation as apiCreateConversation,
  getConversationMessages,
  deleteConversation as apiDeleteConversation,
  sendChatMessage,
} from '../services/api';

const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshConversations = useCallback(async () => {
    try {
      const list = await getConversations();
      setConversations(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to refresh conversations:', err);
      setConversations([]);
    }
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  const resetToInitialState = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
    setIsLoading(false);
  }, []);

  const createConversation = useCallback(async (title = 'Nova conversa') => {
    try {
      const conv = await apiCreateConversation(title);
      setConversations((prev) => [conv, ...prev]);
      setCurrentConversationId(conv.id);
      setMessages([]);
      return conv.id;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      throw err;
    }
  }, []);

  const setCurrentConversationIdHandler = useCallback(async (id) => {
    if (!id) {
      setCurrentConversationId(null);
      setMessages([]);
      return;
    }
    setCurrentConversationId(id);
    try {
      const msgs = await getConversationMessages(id);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      console.warn('Failed to load messages:', err);
      setMessages([]);
    }
  }, []);

  const deleteConversation = useCallback(async (conversationId) => {
    try {
      await apiDeleteConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (conversationId === currentConversationId) {
        resetToInitialState();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      throw err;
    }
  }, [currentConversationId, resetToInitialState]);

  const sendMessage = useCallback(async (query) => {
    if (!query?.trim() || isLoading) return;

    const isNewConversation = !currentConversationId;

    const userMessage = {
      id: generateMessageId(),
      role: 'user',
      content: query.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => (isNewConversation ? [userMessage] : [...prev, userMessage]));
    setIsLoading(true);

    try {
      const data = await sendChatMessage(query.trim(), currentConversationId || undefined);

      const assistantMessage = {
        id: data.conversation_id ? `${data.conversation_id}-a` : generateMessageId(),
        role: 'assistant',
        content: data?.reply || 'Não consegui gerar uma resposta no momento.',
        created_at: new Date().toISOString(),
        sources: data?.sources || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (isNewConversation && data.conversation_id) {
        setCurrentConversationId(data.conversation_id);
      }
      refreshConversations();
    } catch (error) {
      const d = error.response?.data;
      let errMsg = d?.message || d?.error;
      if (!errMsg && typeof d === 'string' && d.length < 500) errMsg = d;
      if (!errMsg) errMsg = error.message || 'Não consegui obter uma resposta. Tente novamente em instantes.';
      const errorMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: errMsg,
        created_at: new Date().toISOString(),
        sources: [],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [currentConversationId, isLoading, refreshConversations]);

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
    refreshConversations,
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
