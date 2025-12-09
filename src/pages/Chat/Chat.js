import React, { useState, useRef, useEffect } from 'react';
import { FaUserMd, FaPaperPlane, FaRobot } from 'react-icons/fa';
import Navbar from '../../components/Navbar/Navbar';
import api from '../../services/api';
import './Chat.css';

// Component to render markdown-like text with proper formatting
const MarkdownText = ({ text }) => {
  if (!text) return null;

  // Helper function to parse and render a line with markdown
  const parseLine = (line, key) => {
    const trimmed = line.trim();
    if (!trimmed) return null;
    
    // Headers (## or ###)
    if (trimmed.match(/^#{2,3}\s+/)) {
      const level = trimmed.match(/^#+/)[0].length;
      const headerText = trimmed.replace(/^#+\s*/, '');
      const HeaderTag = level === 2 ? 'h2' : 'h3';
      return React.createElement(HeaderTag, { key, className: "markdown-subheader" }, headerText);
    }
    
    // Lists (- item or * item)
    if (trimmed.match(/^[-*]\s+/)) {
      const listText = trimmed.replace(/^[-*]\s+/, '');
      // Parse bold text in list items
      const parts = listText.split(/(\*\*[^*]+\*\*)/g);
      return (
        <div key={key} className="markdown-list-item">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </div>
      );
    }
    
    // Paragraphs with potential bold text
    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
    if (parts.length > 1) {
      return (
        <p key={key} className="markdown-paragraph">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    }
    
    // Regular paragraphs
    return <p key={key} className="markdown-paragraph">{trimmed}</p>;
  };

  // Split by sections (Resumo and Resposta Detalhada)
  const sectionRegex = /(\*\*Resumo:\*\*|\*\*Resposta Detalhada:\*\*)/i;
  const parts = text.split(sectionRegex);
  
  const sections = [];
  let currentSection = null;
  let currentContent = [];

  parts.forEach((part, idx) => {
    const isSectionHeader = part.match(/^\*\*Resumo:\*\*$/i) || part.match(/^\*\*Resposta Detalhada:\*\*$/i);
    
    if (isSectionHeader) {
      if (currentSection) {
        sections.push({ type: currentSection, content: currentContent.join('\n') });
      }
      currentSection = part.replace(/\*\*/g, '').replace(':', '').trim();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(part);
    } else if (idx === 0 && part.trim()) {
      // Content before any section
      sections.push({ type: null, content: part });
    }
  });

  if (currentSection) {
    sections.push({ type: currentSection, content: currentContent.join('\n') });
  }

  return (
    <div className="markdown-wrapper">
      {sections.map((section, idx) => {
        const lines = section.content.split('\n').filter(line => line.trim() || line === '');
        const renderedContent = lines.map((line, lineIdx) => parseLine(line, `${idx}-${lineIdx}`)).filter(Boolean);
        
        return (
          <div key={idx} className={`markdown-section ${section.type ? `markdown-${section.type.toLowerCase().replace(/\s+/g, '-')}` : ''}`}>
            {section.type && (
              <h2 className="markdown-section-title">{section.type}</h2>
            )}
            {renderedContent}
          </div>
        );
      })}
    </div>
  );
};

const Chat = () => {
  // Garantir caminho correto para imagens em todos os navegadores
  const publicUrl = process.env.PUBLIC_URL || '';
  const assistantImagePath = publicUrl ? `${publicUrl}/images/assistenteBovicare.jpg` : '/images/assistenteBovicare.jpg';
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Olá! Sou o assistente virtual do BoviCare. Como posso ajudá-lo hoje com questões sobre seu rebanho?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/api/chat/diagnose', {
        message: userMessage.text
      });

      const assistantMessage = {
        id: userMessage.id + 1,
        text: data?.reply || 'Não consegui gerar uma resposta no momento.',
        sender: 'assistant',
        timestamp: new Date(),
        sources: data?.sources || []
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const assistantMessage = {
        id: userMessage.id + 1,
        text: 'Não consegui obter uma resposta. Tente novamente em instantes.',
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chat-container">
      <Navbar />
      <div className="chat-main">
        <div className="chat-header">
          <div className="chat-header-content">
            <div className="assistant-avatar">
              <img src={assistantImagePath} alt="Assistente BoviCare" />
            </div>
            <div className="chat-header-info">
              <h1>Chat</h1>
              <p>Assistente Virtual BoviCare</p>
            </div>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.sender === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="message-avatar">
                {message.sender === 'user' ? <FaUserMd /> : <img src={assistantImagePath} alt="Assistente" />}
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  <MarkdownText text={message.text} />
                  {message.sources && message.sources.length > 0 && (
                    <div className="message-sources">
                      <strong>Fontes:</strong>
                      <div className="sources-tags">
                        {message.sources.map((source, idx) => (
                          <span key={idx} className="source-tag">
                            {source.disease_name || 'Fonte'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <span className="message-time">{formatTime(message.timestamp)}</span>
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
        </div>

        <div className="chat-input">
          <form onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Envie uma mensagem"
              disabled={isLoading}
              className="message-input"
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
