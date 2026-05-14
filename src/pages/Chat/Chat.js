import React, { useState, useRef, useEffect } from 'react';
import { FaUserMd, FaPaperPlane, FaPlus, FaTrash, FaSearch, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Navbar from '../../components/Navbar/Navbar';
import { useChat } from '../../contexts/ChatContext';
import './Chat.css';

const TOOL_LABELS = {
  retrieve_bovine_disease_context: 'Pesquisou na base de conhecimento',
};

function ToolCallBadge({ toolCalls }) {
  const [open, setOpen] = useState(false);
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="tool-calls-wrapper">
      <button
        type="button"
        className="tool-calls-toggle"
        onClick={() => setOpen((o) => !o)}
      >
        <FaSearch className="tool-calls-icon" />
        <span>{toolCalls.length === 1 ? '1 ferramenta usada' : `${toolCalls.length} ferramentas usadas`}</span>
        {open ? <FaChevronDown className="tool-calls-chevron" /> : <FaChevronRight className="tool-calls-chevron" />}
      </button>
      {open && (
        <ul className="tool-calls-list">
          {toolCalls.map((tc, i) => (
            <li key={i} className="tool-calls-item">
              <span className="tool-calls-name">{TOOL_LABELS[tc.tool_name] || tc.tool_name}</span>
              {tc.query && <span className="tool-calls-query">"{tc.query}"</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const SUGGESTIONS = [
  'Notei abortos no terço final da gestação e diminuição na produção de leite. Qual doença pode estar afetando meu rebanho?',
  'Como prevenir e tratar a brucelose em bovinos?',
  'Quais vacinas são obrigatórias para o rebanho?',
];

const Chat = () => {
  const publicUrl = process.env.PUBLIC_URL || '';
  const assistantImagePath = publicUrl ? `${publicUrl}/images/assistenteBovicare.jpg` : '/images/assistenteBovicare.jpg';

  const {
    conversations,
    currentConversationId,
    messages,
    isLoading,
    setCurrentConversationId,
    resetToInitialState,
    deleteConversation,
    sendMessage,
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewConversation = () => {
    resetToInitialState();
    setInputValue('');
  };

  const handleConversationChange = (e) => {
    const id = e.target.value;
    setCurrentConversationId(id === '' ? null : id);
    setInputValue('');
  };

  const handleDeleteConversation = async () => {
    if (!currentConversationId) return;
    if (!window.confirm('Tem certeza que deseja excluir esta conversa?')) return;
    try {
      await deleteConversation(currentConversationId);
      setInputValue('');
    } catch (err) {
      console.error('Erro ao excluir conversa:', err);
      window.alert('Não foi possível excluir a conversa. Tente novamente.');
    }
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const query = inputValue.trim();
    setInputValue('');
    sendMessage(query);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (text) => {
    setInputValue(text);
  };

  const formatTimestamp = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ptBR });
  };

  return (
    <div className="chat-container">
      <Navbar />
      <div className="chat-main">
        <div className="chat-header chat-header-toolbar">
          <div className="chat-header-controls">
            <select
              className="chat-select"
              value={currentConversationId || ''}
              onChange={handleConversationChange}
            >
              <option value="">Selecione uma conversa</option>
              {conversations.map((conv) => (
                <option key={conv.id} value={conv.id}>
                  {conv.title}
                </option>
              ))}
            </select>
            {currentConversationId && (
              <button
                type="button"
                className="chat-btn chat-btn-outline chat-btn-danger"
                onClick={handleDeleteConversation}
                title="Excluir conversa"
              >
                <FaTrash className="chat-btn-icon" />
                Excluir
              </button>
            )}
            <button
              type="button"
              className="chat-btn chat-btn-outline"
              onClick={handleNewConversation}
              title="Nova conversa"
            >
              <FaPlus className="chat-btn-icon" />
              Nova Conversa
            </button>
          </div>
        </div>

        <div ref={messagesContainerRef} className="chat-messages">
          {messages.length === 0 ? (
            <>
              {!isLoading ? (
                <div className="chat-empty-state">
                  <div className="chat-empty-content">
                    <h2 className="chat-empty-title">Olá! Sou seu assistente de saúde animal.</h2>
                    <p className="chat-empty-subtitle">Como posso ajudá-lo hoje com questões sobre seu rebanho?</p>
                  </div>
                  <div className="chat-suggestions">
                    {SUGGESTIONS.map((text, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="chat-suggestion-badge"
                        onClick={() => handleSuggestionClick(text)}
                      >
                        {text.length > 60 ? `${text.slice(0, 60)}...` : text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="message assistant-message">
                  <div className="message-avatar">
                    <img src={assistantImagePath} alt="Assistente" />
                  </div>
                  <div className="message-content">
                    <div className="message-bubble loading">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  <div className="message-avatar">
                    {message.role === 'user' ? (
                      <FaUserMd />
                    ) : (
                      <img src={assistantImagePath} alt="Assistente" />
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-bubble">
                      {message.role === 'assistant' && (
                        <ToolCallBadge toolCalls={message.tool_calls} />
                      )}
                      {message.role === 'assistant' ? (
                        <div className="markdown-wrapper">
                          <ReactMarkdown
                            components={{
                              h2: ({ children, ...props }) => <h2 className="markdown-subheader" {...props}>{children}</h2>,
                              h3: ({ children, ...props }) => <h3 className="markdown-subheader" {...props}>{children}</h3>,
                              p: (props) => <p className="markdown-paragraph" {...props} />,
                              ul: (props) => <ul className="markdown-list" {...props} />,
                              ol: (props) => <ol className="markdown-list" {...props} />,
                              li: (props) => <li className="markdown-list-item" {...props} />,
                              strong: (props) => <strong {...props} />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="markdown-paragraph">{message.content}</p>
                      )}
                      {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                        <div className="message-sources">
                          <strong>Fontes:</strong>
                          <div className="sources-tags">
                            {message.sources.map((source, idx) => (
                              <span
                                key={idx}
                                className="source-tag"
                                title={source.content_preview || source.disease_name}
                              >
                                {source.disease_name || 'Fonte'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <span className="message-time">{formatTimestamp(message.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message assistant-message">
                  <div className="message-avatar">
                    <img src={assistantImagePath} alt="Assistente" />
                  </div>
                  <div className="message-content">
                    <div className="message-bubble loading">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="chat-input">
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <textarea
              className="chat-textarea message-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!inputValue.trim() || isLoading}
              title="Enviar"
            >
              {isLoading ? (
                <span className="chat-loading-spinner" />
              ) : (
                <FaPaperPlane className="chat-send-icon" />
              )}
            </button>
          </form>
          <p className="chat-disclaimer">O Chatbot pode cometer erros. Confira informações importantes.</p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
