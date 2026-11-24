import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useCity } from '../context/CityContext';
import { api } from '../api/client';
import { AqiBadge } from '../components/ui/AqiBadge';
import type { AqiData } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  aqiCategory?: string;
}

export const AssistantPage: React.FC = () => {
  const { selectedCity } = useCity();
  const [cityData, setCityData] = useState<AqiData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgSeqRef = useRef(0);

  const nextMsgId = (prefix: string) => {
    msgSeqRef.current += 1;
    return `${prefix}-${msgSeqRef.current}`;
  };

  const sampleQuestions = [
    'Is the air safe today?',
    'Should I exercise outdoors?',
    'Which pollutants are currently high?',
    'What precautions should children and elderly take?',
    'What is causing poor air quality?',
    'How can I reduce my exposure indoors?',
    'What is the expected air quality tomorrow?',
    'Do I need to wear an N95 mask right now?',
  ];

  useEffect(() => {
    let mounted = true;
    async function fetchContext() {
      try {
        const data = await api.getAqi(selectedCity);
        if (mounted) {
          setCityData(data);
          // Set welcome message tailored to current city
          setMessages([
            {
              id: 'welcome',
              sender: 'assistant',
              text: `Hello! I am your BreatheCity AI Assistant. I am monitoring live air quality telemetry for **${data.city}**.\n\nCurrent status is **${data.aqi_category}** (AQI ${Math.round(data.aqi || 0)}). Ask me anything about health precautions, masks, workouts, or pollutants!`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              aqiCategory: data.aqi_category,
            },
          ]);
        }
      } catch {
        if (mounted) {
          setMessages([
            {
              id: 'welcome-fallback',
              sender: 'assistant',
              text: `Hello! I am your BreatheCity AI Assistant. Currently monitoring **${selectedCity}**. Ask me any question regarding air pollution, health precautions, or mask guidelines!`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      } finally {
        // done
      }
    }
    fetchContext();
    return () => {
      mounted = false;
    };
  }, [selectedCity]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const q = (textToSend || inputValue).trim();
    if (!q || isTyping) return;

    const userMsg: Message = {
      id: nextMsgId('user'),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    try {
      const response = await api.askAssistant(selectedCity, q);
      const assistantMsg: Message = {
        id: nextMsgId('assistant'),
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aqiCategory: response.aqi_category,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMsg: Message = {
        id: nextMsgId('err'),
        sender: 'assistant',
        text: `Sorry, I encountered an issue analyzing the air quality data. Please try again. (${err instanceof Error ? err.message : 'Network error'})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Context Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white flex items-center gap-2">
              BreatheCity AI Assistant
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                Context-Aware
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Grounded in live atmospheric telemetry &bull; Non-clinical health recommendations
            </p>
          </div>
        </div>

        {/* Current City Context Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold text-white">{selectedCity}</span>
          {cityData?.aqi_category && (
            <AqiBadge category={cityData.aqi_category} aqi={cityData.aqi} size="sm" showNumber />
          )}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col h-[560px] overflow-hidden shadow-2xl">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-slate-800 text-slate-200 border border-slate-700'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[82%] sm:max-w-[70%] rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none shadow-md'
                    : 'bg-slate-900/95 text-slate-200 border border-slate-800 rounded-tl-none shadow-lg'
                }`}
              >
                <div className="whitespace-pre-line space-y-1">
                  {msg.text}
                </div>
                <div
                  className={`mt-2 text-[10px] flex items-center gap-2 ${
                    msg.sender === 'user' ? 'text-emerald-100 justify-end' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'assistant' && (
                    <span className="flex items-center gap-1 font-mono text-[9px] text-emerald-400/80">
                      <ShieldCheck className="w-2.5 h-2.5" /> Verified CPCB Logic
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span>BreatheCity Assistant is analyzing telemetry...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Pills */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Suggested Questions:</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {sampleQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSendMessage(q)}
                disabled={isTyping}
                className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-emerald-500/40 text-[11px] font-medium transition-all shrink-0"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask a question about ${selectedCity}'s air quality, masks, exercise...`}
            disabled={isTyping}
            aria-label={`Ask a question about ${selectedCity}'s air quality`}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isTyping}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-emerald-500/25"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Safety & Medical Disclaimer */}
      <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-center gap-2.5 text-xs text-amber-300">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
        <p className="leading-snug">
          BreatheCity AI guidance is based on atmospheric environmental telemetry and official public health guidelines. It is not clinical medical advice. Consult medical professionals for acute respiratory emergencies.
        </p>
      </div>
    </div>
  );
};
