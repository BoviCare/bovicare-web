import React, { useState, useRef, useEffect } from 'react';
import {
  FaUserMd, FaPaperPlane, FaPlus, FaTrash,
  FaSearch, FaChevronDown, FaChevronRight, FaComment
} from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Navbar from '../../components/Navbar/Navbar';
import { useChat } from '../../contexts/ChatContext';
import './Chat.css';

const SUGGESTIONS = [
  'Notei abortos no terço final da gestação e diminuição na produção de leite. Qual doença pode estar afetando meu rebanho?',
  'Como prevenir e tratar a brucelose em bovinos?',
  'Quais vacinas são obrigatórias para o rebanho?',
];

const TOOL_LABELS = {
  retrieve_bovine_disease_context: 'Pesquisou na base de conhecimento',
};

function ToolCallBadge({ toolCalls }) {
  const [open, setOpen] = useState(false);
  if (!toolCalls?.length) return null;
  return (
    <div className="tool-calls-wrapper">
      <button type="button" className="tool-calls-toggle" onClick={() => setOpen(o => !o)}>
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

function groupByDate(conversations) {
  const groups = { Hoje: [], Ontem: [], Anteriores: [] };
  conversations.forEach(conv => {
    const date = conv.created_at ? new Date(conv.created_at) : null;
    if (!date || isNaN(date)) {
      groups.Anteriores.push(conv);
    } else if (isToday(date)) {
      groups.Hoje.push(conv);
    } else if (isYesterday(date)) {
      groups.Ontem.push(conv);
    } else {
      groups.Anteriores.push(conv);
    }
  });
  return groups;
}

function ConversationRow({ conv, active, onSelect, onDelete }) {
  const [hovered, setHovered] = useState(false);

  const handleDelete = e => {
    e.stopPropagation();
    if (window.confirm('Excluir esta conversa?')) onDelete(conv.id);
  };

  const relTime = conv.created_at
    ? formatDistanceToNow(new Date(conv.created_at), { addSuffix: true, locale: ptBR })
    : null;

  return (
    <div
      className={`convo-row${active ? ' convo-row--active' : ''}`}
      onClick={() => onSelect(conv.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <FaComment className="convo-row__icon" />
      <div className="convo-row__body">
        <div className="convo-row__title">{conv.title || 'Nova conversa'}</div>
        {relTime && <span className="convo-row__time">{relTime}</span>}
      </div>
      {hovered && (
        <button className="convo-row__delete" onClick={handleDelete} title="Excluir">
          <FaTrash />
        </button>
      )}
    </div>
  );
}

const Chat = () => {
  const publicUrl = process.env.PUBLIC_URL || '';
  const avatarSrc = publicUrl
    ? `${publicUrl}/images/assistenteBovicare.jpg`
    : '/images/assistenteBovicare.jpg';

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
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const filtered = conversations.filter(c =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const grouped = groupByDate(filtered);

  const currentTitle = conversations.find(c => c.id === currentConversationId)?.title;

  const handleNew = () => {
    resetToInitialState();
    setInputValue('');
    setSearchQuery('');
  };

  const handleDelete = async id => {
    try {
      await deleteConversation(id);
    } catch {
      window.alert('Não foi possível excluir a conversa. Tente novamente.');
    }
  };

  const handleSend = e => {
    e?.preventDefault();
    const q = inputValue.trim();
    if (!q || isLoading) return;
    setInputValue('');
    sendMessage(q);
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      <Navbar />

      <div className="chat-workspace">
        {/* ── Sidebar ── */}
        <aside className="chat-sidebar">
          <div className="chat-sidebar__top">
            <button className="chat-new-btn" onClick={handleNew}>
              <FaPlus style={{ fontSize: 12 }} />
              Nova conversa
            </button>
          </div>

          <div className="chat-sidebar__search-wrap">
            <FaSearch className="chat-sidebar__search-icon" />
            <input
              className="chat-sidebar__search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar conversas..."
            />
          </div>

          <div className="chat-sidebar__list">
            {(['Hoje', 'Ontem', 'Anteriores']).map(label => {
              const items = grouped[label];
              if (!items.length) return null;
              return (
                <div key={label} className="chat-sidebar__group">
                  <div className="chat-sidebar__group-label">{label}</div>
                  {items.map(conv => (
                    <ConversationRow
                      key={conv.id}
                      conv={conv}
                      active={conv.id === currentConversationId}
                      onSelect={setCurrentConversationId}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="chat-sidebar__empty">Nenhuma conversa encontrada.</div>
            )}
          </div>
        </aside>

        {/* ── Chat pane ── */}
        <div className="chat-pane">
          {/* Header */}
          <div className="chat-pane__header">
            <img src={avatarSrc} alt="Assistente BoviCare" className="chat-pane__avatar" />
            <div>
              <h2 className="chat-pane__title">
                {currentTitle || 'Assistente BoviCare'}
              </h2>
              <p className="chat-pane__subtitle">Saúde, manejo e produção do rebanho</p>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 && !isLoading ? (
              <div className="chat-empty-state">
                <img src={avatarSrc} alt="Assistente" className="chat-empty__avatar" />
                <h3 className="chat-empty__title">Como posso ajudar hoje?</h3>
                <p className="chat-empty__subtitle">
                  Pergunte sobre o seu rebanho — esta conversa será salva automaticamente.
                </p>
                <div className="chat-suggestions">
                  {SUGGESTIONS.map((text, i) => (
                    <button
                      key={i}
                      className="chat-suggestion-chip"
                      onClick={() => sendMessage(text)}
                    >
                      {text.length > 60 ? `${text.slice(0, 60)}…` : text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`chat-bubble chat-bubble--${msg.role}`}
                  >
                    <div className="chat-bubble__avatar">
                      {msg.role === 'user' ? (
                        <FaUserMd />
                      ) : (
                        <img src={avatarSrc} alt="Assistente" />
                      )}
                    </div>
                    <div className="chat-bubble__content">
                      <div className={`chat-bubble__body${msg.role === 'assistant' ? ' chat-bubble__body--assistant' : ''}`}>
                        {msg.role === 'assistant' && (
                          <ToolCallBadge toolCalls={msg.tool_calls} />
                        )}
                        {msg.role === 'assistant' ? (
                          <div className="markdown-wrapper">
                            <ReactMarkdown
                              components={{
                                h2: ({ children, ...p }) => <h2 className="markdown-subheader" {...p}>{children}</h2>,
                                h3: ({ children, ...p }) => <h3 className="markdown-subheader" {...p}>{children}</h3>,
                                p: p => <p className="markdown-paragraph" {...p} />,
                                ul: p => <ul className="markdown-list" {...p} />,
                                ol: p => <ol className="markdown-list" {...p} />,
                                li: p => <li className="markdown-list-item" {...p} />,
                                strong: p => <strong {...p} />,
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="markdown-paragraph">{msg.content}</p>
                        )}
                        {msg.role === 'assistant' && msg.sources?.length > 0 && (
                          <div className="message-sources">
                            <strong>Fontes</strong>
                            <div className="sources-tags">
                              {msg.sources.map((src, i) => (
                                <span
                                  key={i}
                                  className="source-tag"
                                  title={src.content_preview || src.disease_name}
                                >
                                  {src.disease_name || 'Fonte'}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="chat-bubble chat-bubble--assistant">
                    <div className="chat-bubble__avatar">
                      <img src={avatarSrc} alt="Assistente" />
                    </div>
                    <div className="chat-bubble__content">
                      <div className="chat-bubble__body chat-bubble__body--assistant">
                        <div className="typing-indicator">
                          <span /><span /><span />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <form className="chat-input-form" onSubmit={handleSend}>
              <textarea
                className="chat-textarea"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escreva sua pergunta..."
                rows={1}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="chat-send-btn"
                disabled={!inputValue.trim() || isLoading}
                title="Enviar"
              >
                {isLoading
                  ? <span className="chat-loading-spinner" />
                  : <FaPaperPlane />}
              </button>
            </form>
            <p className="chat-disclaimer">
              O assistente pode cometer erros. Confirme informações críticas com um veterinário.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
