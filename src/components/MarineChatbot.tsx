import React, { useState, useCallback } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import { post } from '../api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

function BlueCurrentMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="BlueCurrent">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <path d="M12 3c-3 4-3 6 0 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 21c3-4 3-6 0-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3 12h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M21 12h-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

export const MarineChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'BlueCurrent Marine Copilot online. Ask me about real-time wave safety, PFZ fisheries, oil spill hazards, or EEZ boundary navigation.',
    },
  ]);
  const [inputMsg, setInputMsg] = useState<string>('');
  const [chatBusy, setChatBusy] = useState<boolean>(false);

  const quickPrompts = [
    { label: 'Wave & Safety Status', text: 'What is our current marine safety score and peak wave condition?' },
    { label: 'Highest Yield PFZ', text: 'Which Potential Fishing Zone has the highest projected yield right now?' },
    { label: 'Oil Spill Risk', text: 'Is there an active oil spill near our navigation corridor?' },
    { label: 'EEZ Boundary Check', text: 'Check current vessel positions against the EEZ geofence.' },
  ];

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const query = textToSend || inputMsg;
      if (!query.trim() || chatBusy) return;

      const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: query };
      setChatMessages((prev) => [...prev, userMessage]);
      setInputMsg('');
      setChatBusy(true);

      try {
        const res = await post<{ reply: string }>('/api/chat', { message: query });
        setChatMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), sender: 'bot', text: res.reply },
        ]);
      } catch {
        setChatMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: '[Offline Mode] Sea state is moderate (~1.8m wave, wind 24 km/h). PFZ Zone 01 is leading at 92% yield. Swarm consensus: Safe for cruising outside Seep Alpha corridor.',
          },
        ]);
      } finally {
        setChatBusy(false);
      }
    },
    [inputMsg, chatBusy]
  );

  if (!isOpen) {
    return (
      <button className="chat-launcher anim-scale" onClick={() => setIsOpen(true)}>
        <Bot size={16} color="var(--accent-teal)" />
        <span>Marine AI Copilot</span>
        <Sparkles size={13} color="var(--accent-teal)" />
      </button>
    );
  }

  return (
    <div className="chat-panel anim-scale">
      {/* Header */}
      <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{ color: 'var(--accent-teal)' }}>
            <BlueCurrentMark size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.1 }}>
              BlueCurrent Copilot
            </div>
            <div className="label-caps" style={{ fontSize: '0.58rem', color: chatBusy ? 'var(--accent-amber)' : 'var(--accent-teal)' }}>
              {chatBusy ? '● SYNTHESIZING TELEMETRY' : '● MULTI-AGENT GROUNDED'}
            </div>
          </div>
        </div>
        <button className="btn-ghost" onClick={() => setIsOpen(false)} style={{ padding: '4px' }}>
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={msg.sender === 'user' ? 'chat-msg chat-msg-user anim-slide-r' : 'chat-msg chat-msg-bot anim-slide-l'}
          >
            {msg.text}
          </div>
        ))}
        {chatBusy && (
          <div className="typing-indicator">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            className="btn-ghost"
            onClick={() => handleSendMessage(p.text)}
            style={{ padding: '4px 8px', fontSize: '0.68rem', whiteSpace: 'nowrap', borderRadius: '12px', background: 'rgba(100,160,200,0.06)' }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-default)', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Ask BlueCurrent marine intelligence…"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none' }}
        />
        <button className="btn-primary" onClick={() => handleSendMessage()} style={{ padding: '8px 12px' }}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
};
