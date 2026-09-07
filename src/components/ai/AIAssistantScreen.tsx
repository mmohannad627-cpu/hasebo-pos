/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { api } from '../../services/api';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Store,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const AIAssistantScreen: React.FC = () => {
  const [messages, setMessages] = useState<{ sender: 'ai' | 'user'; text: string; time: string }[]>([
    {
      sender: 'ai',
      text: `أهلاً بك! أنا **المستشار التجاري والمالي الذكي** لنظامك. 
أستطيع تحليل مبيعاتك وأرباحك وحركة المخزون والديون لحظياً، وتقديم توصيات مخصصة لمساعدتك في زيادة الأرباح وتجنب ركود البضاعة.

**جرّب الاستفسارات السريعة بالأسفل أو اكتب سؤالك مباشرة:**`,
      time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickPrompts = [
    '📊 كيف أزيد مجمل أرباح المتجر هذا الشهر؟',
    '⚠️ ما هي التوصيات للتعامل مع الأصناف التي تقترب من انتهاء الصلاحية؟',
    '💰 تحليل التدفق النقدي وتحصيل ديون العملاء',
    '📦 خطة تحسين دوران المخزون للأصناف بطيئة الحركة',
  ];

  const handleSend = async (queryToSend?: string) => {
    const text = queryToSend || inputQuery;
    if (!text.trim() || isLoading) return;

    const userMsg = {
      sender: 'user' as const,
      text,
      time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await api.askAIAdvisor(text);
      const aiMsg = {
        sender: 'ai' as const,
        text: res.response,
        time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai' as const,
          text: 'عذراً، حدث خطأ أثناء معالجة الاستشارة: ' + err.message,
          time: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 h-[calc(100vh-4rem)] flex flex-col max-w-5xl mx-auto select-none" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>المستشار التجاري والمالي الذكي (AI Assistant)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                Gemini 3.7 Flash
              </span>
            </h2>
            <p className="text-xs text-slate-400">تحليل فوري لقواعد البيانات والمؤشرات المالية لمتجرك</p>
          </div>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 text-xs leading-relaxed ${
              m.sender === 'user' ? 'justify-start' : 'justify-start'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs ${
                m.sender === 'user'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}
            >
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-2xl p-4 rounded-2xl border ${
                m.sender === 'user'
                  ? 'bg-slate-850 border-slate-700 text-slate-100'
                  : 'bg-slate-900 border-slate-800 text-slate-200 shadow-sm'
              }`}
            >
              <div className="prose prose-invert prose-sm max-w-none text-xs">
                <ReactMarkdown>{m.text}</ReactMarkdown>
              </div>
              <span className="text-[10px] text-slate-500 block mt-2 font-mono text-left">{m.time}</span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 text-xs">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              <span>جاري استخراج التحليلات المالية والتوصيات الذكية...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-medium whitespace-nowrap transition cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="pt-2 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="اكتب استشارتك المالية أو المخزنية هنا..."
            className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="absolute left-2 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
