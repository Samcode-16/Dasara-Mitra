import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, RefreshCw } from 'lucide-react';
import { Button, Input } from './ui.jsx';
import { useLanguage } from './DasaraContext';

export default function Chatbot() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: language === 'kn' ? 'ನಮಸ್ಕಾರ! ಮೈಸೂರು ದಸರಾ ಬಗ್ಗೆ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?' : 'Namaskara! How can I help you with Mysore Dasara today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    setMessages((previous) => {
      if (previous.length === 1 && previous[0].role === 'assistant') {
        return [{
          role: 'assistant',
          content: language === 'kn'
            ? 'ನಮಸ್ಕಾರ! ಮೈಸೂರು ದಸರಾ ಬಗ್ಗೆ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?'
            : 'Namaskara! How can I help you with Mysore Dasara today?'
        }];
      }
      return previous;
    });
  }, [language]);

  const sendPromptToGemini = async ({ userMessage, languageCode, history }) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    
    if (!apiKey) {
      throw new Error('missing-api-key');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const languageHint = languageCode === 'kn' ? 'Kannada' : 'English';

    const systemInstruction = {
      role: 'system',
      parts: [{
        text: `You are "Dasara Mitra", a helpful and warm cultural festival guide for Mysuru Dasara. 

LANGUAGE RULES:
- The user's preferred language is ${languageHint}
- Always respond in ${languageHint} language regardless of what language the user writes in
- If user language is Kannada: respond in Kannada script (ಕನ್ನಡ)
- If user language is English: respond in English
- Never refuse to answer due to language differences
- Be helpful and accommodating

CONTENT: Provide factual information about Mysuru Dasara events, transport, history, and cultural details. Keep responses under 100 words and always greet with "Namaskara" in the appropriate language.`
      }]
    };

    const trimmedHistory = history
      .filter((entry, index) => !(index === 0 && entry.role === 'assistant'))
      .slice(-6)
      .map((entry) => ({
        role: entry.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: entry.content }]
      }));

    const contents = [
      ...trimmedHistory,
      {
        role: 'user',
        parts: [{ text: `Language: ${languageHint}\n${userMessage || 'Namaskara'}` }]
      }
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        system_instruction: systemInstruction,
        generation_config: {
          temperature: languageCode === 'kn' ? 0.7 : 0.6,
          top_p: 0.95,
          top_k: 40
        }
      })
    });

    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      const message = details?.error?.message || response.statusText || 'Gemini request failed';
      throw new Error(message);
    }

    const data = await response.json();
    if (data?.promptFeedback?.blockReason) {
      const reason = data.promptFeedback.blockReason;
      throw new Error(`blocked:${reason}`);
    }

    const candidate = data?.candidates?.[0];

    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
      throw new Error(`blocked:${candidate.finishReason}`);
    }

    const reply = candidate?.content?.parts
      ?.map((part) => part.text?.trim())
      .filter(Boolean)
      .join('\n');

    if (!reply) {
      throw new Error('empty-response');
    }

    return reply;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      // Construct a prompt that includes context
      const reply = await sendPromptToGemini({
        userMessage: userMsg,
        languageCode: language,
        history: messages
      });

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error("Chat error:", error);
      const problem = error?.message || '';

      if (problem === 'missing-api-key') {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Chat configuration is missing. Please add your Google Gemini API key.' }]);
      } else if (problem === 'empty-response') {
        setMessages(prev => [...prev, { role: 'assistant', content: 'I could not find festival details right now. Try asking again in a moment.' }]);
      } else if (problem.startsWith('blocked:')) {
        const reason = problem.split(':')[1] || 'safety';
        setMessages(prev => [...prev, { role: 'assistant', content: `I could not answer that request due to safety filters (${reason}). Please try asking in another way.` }]);
      } else {
        const friendlyMessage = problem
          ? `${t('error')} (${problem})`
          : t('error');
        setMessages(prev => [...prev, { role: 'assistant', content: friendlyMessage }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-xl text-white flex items-center gap-2 transition-all hover:scale-110 transform duration-200 ${isOpen ? 'hidden' : 'flex'}`}
        style={{ backgroundColor: '#DAA520' }}
      >
        <MessageCircle className="w-6 h-6" />
        <span className="font-bold hidden md:inline">{t('chatTitle')}</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[90vw] md:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#DAA520] animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          {/* Header */}
          <div className="p-4 bg-[#800000] text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="font-bold">{t('chatTitle')}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-gray-200 text-gray-800 rounded-br-none' 
                      : 'bg-[#800000] text-white rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#800000] text-white p-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chatPlaceholder')}
                className="focus-visible:ring-[#DAA520]"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-[#DAA520] hover:bg-[#B8860B] text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}