import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, XCircle, Bot, Send, Sparkles, Shield, RefreshCw } from 'lucide-react';
import { processChatbotQuery } from '../utils/chatbotEngine';
import { sfx } from '../utils/soundEffects';

export default function ChatbotWidget({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      sender: 'bot', 
      text: `Hello ${user?.name ? user.name : 'there'}! 👋 I am **Aura**, your virtual insurance intelligence assistant.\n\nAsk me about your active policies, claim statuses, due premiums, or AI recommendations!` 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { label: '📋 My Policies', query: 'Show my active policies' },
    { label: '📑 Claim Status', query: 'Check my filed claim status' },
    { label: '💳 Due Premium', query: 'How much premium do I owe?' },
    { label: '⚡ How to File Claim', query: 'How do I file a new claim?' },
    { label: '✨ AI Recommendations', query: 'What policies are recommended for me?' },
    { label: '🛡️ Add-on Riders', query: 'What protection riders are available?' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleSendQuery = async (queryText) => {
    const textToSend = queryText || input.trim();
    if (!textToSend || loading) return;

    sfx.playPop();
    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setInput('');
    setLoading(true);

    try {
      const reply = await processChatbotQuery(textToSend, user);
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
      sfx.playPop();
    } catch (err) {
      setMessages(prev => [
        ...prev, 
        { sender: 'bot', text: 'I encountered an issue retrieving live records. Please verify your connection or try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendQuery(input);
  };

  // Helper to render basic markdown formatting
  const renderFormattedText = (rawText) => {
    return rawText.split('\n').map((line, lIdx) => {
      // Horizontal dividers
      if (line.trim() === '────────────────────' || line.trim() === '====================') {
        return <hr key={lIdx} style={{ border: 'none', borderTop: '1px solid var(--border-glass)', margin: '8px 0' }} />;
      }

      // Format bold and code
      const parts = line.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} style={{ color: '#fff', fontWeight: '700' }}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={pIdx} style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.85em', color: '#06b6d4', fontFamily: 'monospace' }}>
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={pIdx} style={{ color: '#cbd5e1' }}>{part.slice(1, -1)}</em>;
        }
        return part;
      });

      return (
        <div key={lIdx} style={{ minHeight: line.trim() === '' ? '8px' : 'auto', marginBottom: '2px' }}>
          {formattedParts}
        </div>
      );
    });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button 
        onClick={() => { sfx.playPop(); setIsOpen(!isOpen); }}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          border: 'none',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 25px rgba(99, 102, 241, 0.45)',
          cursor: 'pointer',
          zIndex: 9999,
          transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="Chat with Aura Assistant"
      >
        {isOpen ? <XCircle size={28} /> : <MessageCircle size={28} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="glass-card animate-fade-in" style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '390px',
          height: '540px',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9998,
          boxShadow: '0 16px 50px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          overflow: 'hidden',
          background: 'var(--bg-card)'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.1))',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)' }}>
                <Bot size={20} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>Aura AI Intelligence</h3>
                <span style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} /> Context Active
                </span>
              </div>
            </div>

            <button 
              onClick={() => {
                sfx.playPop();
                setMessages([{ sender: 'bot', text: 'Chat reset. How else can I assist you with your insurance today?' }]);
              }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              title="Reset Chat History"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 15px',
                  borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.sender === 'user' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.04)',
                  border: msg.sender === 'user' ? 'none' : '1px solid var(--border-glass)',
                  color: msg.sender === 'user' ? '#ffffff' : 'var(--text-main)',
                  fontSize: '0.84rem',
                  lineHeight: '1.45',
                  boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none'
                }}>
                  {renderFormattedText(msg.text)}
                </div>
              </div>
            ))}
            
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', fontSize: '0.82rem', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={14} className="animate-spin" /> Aura is computing response...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Drawer */}
          <div style={{
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-glass)',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendQuery(p.query)}
                style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '12px',
                  color: 'var(--text-main)',
                  fontSize: '0.72rem',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  fontWeight: '600',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                  e.currentTarget.style.borderColor = '#6366f1';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)';
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <form onSubmit={handleFormSubmit} style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--border-glass)',
            display: 'flex',
            gap: '8px',
            background: 'var(--bg-card)'
          }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ask about your policies, claims, or payments..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '20px', fontSize: '0.85rem' }}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || loading}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: input.trim() && !loading ? 'linear-gradient(135deg, #6366f1, #06b6d4)' : 'rgba(255,255,255,0.05)',
                border: 'none',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                boxShadow: input.trim() && !loading ? '0 2px 10px rgba(99, 102, 241, 0.4)' : 'none'
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
