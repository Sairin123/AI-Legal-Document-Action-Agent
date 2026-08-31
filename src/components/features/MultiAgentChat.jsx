import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, ShieldAlert, Zap, User, Sparkles, Globe, Mic, MicOff, Volume2 } from 'lucide-react';
import { apiPost } from '../../api';

const agents = [
  { id: 'summarizer', name: 'Summarizer Agent', icon: Bot, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  { id: 'risk', name: 'Risk Analyzer', icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' },
  { id: 'action', name: 'Action Agent', icon: Zap, color: 'text-legal-blue dark:text-legal-cyan', bg: 'bg-legal-blue/10 border-legal-blue/30 dark:bg-legal-cyan/10 dark:border-legal-cyan/30' },
  { id: 'positive', name: 'Positive Agent', icon: Sparkles, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10 border-fuchsia-500/30' },
  { id: 'translator', name: 'Translator Agent', icon: Globe, color: 'text-violet-500', bg: 'bg-violet-500/10 border-violet-500/30' }
];

const mockConvos = {
  summarizer: [
    { sender: 'bot', text: 'Hi! I am the Summarizer Agent. Which document would you like me to condense today?' },
    { sender: 'user', text: 'Please summarize the Acme Corp MSA.' },
    { sender: 'bot', text: '### Comprehensive Breakdown: Acme Corp MSA\n\n**1. Core Agreement Details:**\n• **Term Length:** 24-month initial term, automatically renewing for successive 1-year periods unless terminated with 60 days written notice.\n• **Contract Value:** Total commitment is $120,000 annually, billed proportionately on a monthly basis.\n\n**2. Key Obligations & Deliverables:**\n• Vendor is responsible for supplying monthly programmatic progress reports by the 5th of each month.\n• Vendor guarantees a **99.9% uptime SLA** across all supplied SaaS platforms.\n• Client must provide reasonable access to API endpoints to facilitate continuous integration.\n\n**3. Payment Terms:**\n• Payment structure follows a strict Net 30 framework.\n• Late payments incur a 1.5% monthly compound interest penalty.\n\n**4. Termination Rights:**\n• Either party may terminate for convenience with 90 days notice.\n• Immediate termination available for material breach, provided 15 days cure period expires without resolution.' }
  ],
  risk: [
    { sender: 'bot', text: 'Risk Analyzer ready. I scan for anomalies and liabilities.' },
    { sender: 'user', text: 'Are there any non-standard clauses in the new Vendor NDA?' },
    { sender: 'bot', text: '### Risk Analysis Report: Vendor NDA\n\nScanning complete. I cross-referenced the Vendor NDA against your corporate legal playbook and have identified **3 anomalies** requiring attention:\n\n🔴 **CRITICAL RISK: Non-Compete Duration (Section 4)**\n• *Finding:* The non-compete prohibits engagement with competitors for **5 years** post-termination.\n• *Deviation:* Our standard playbook enforces a maximum of **2 years**. 5 years is likely overly broad and unenforceable in standard jurisdictions.\n\n🔴 **CRITICAL RISK: Broad IP Assignment (Section 12)**\n• *Finding:* Assigns all intellectual property created during the term to the vendor, without carving out prior inventions or unrelated work-product.\n• *Deviation:* Needs immediate revision to strictly cover "Project Deliverables/Work Product only."\n\n🟡 **MODERATE RISK: Venue & Jurisdiction (Section 17)**\n• *Finding:* Disputes are to be settled in Wilmington, Delaware.\n• *Deviation:* While Delaware is common, your preference typically defaults to New York. Consider if this poses a logistical hurdle.' }
  ],
  action: [
    { sender: 'bot', text: 'Action Agent here. I can draft emails, set reminders, or redline docs based on insights.' },
    { sender: 'user', text: 'Draft a professional email to the vendor requesting changes to the non-compete and IP assignment.' },
    { sender: 'bot', text: '[Drafting...]', isTyping: true },
  ],
  positive: [
    { sender: 'bot', text: 'Positive Insights Agent ready. Tell me which document to scan for favorable clauses and benefits.' },
    { sender: 'user', text: 'Analyze the new vendor contract for any positive protections for our company.' },
    { sender: 'bot', text: '### Positive Analysis Report\n\nScanning complete. I have identified **3 highly favorable clauses**:\n\n🟢 **EXCELLENT: Data Ownership Retained (Section 9)**\n• The company retains 100% exclusive ownership of all inputted data and derived metrics.\n• Benefit: Secures intellectual property and prevents vendor lock-in.\n\n🟢 **FAVORABLE: Uptime Guarantee & SLA (Section 5)**\n• Vendor guarantees 99.9% uptime with immediate financial penalties (credits) for downtime.\n• Benefit: Ensures high availability and operational continuity.\n\n🟢 **FAVORABLE: Termination for Convenience (Section 15)**\n• The contract includes a 90-day termination for convenience clause without early termination penalties.\n• Benefit: Provides immense operational flexibility if business needs pivot.' }
  ],
  translator: [
    { sender: 'bot', text: '🌐 Legal Translator Agent ready. Submitted documents can be translated here to any official language.' },
    { sender: 'user', text: 'Could you translate the indemnification clause of the uploaded document to Spanish and simplify it?' },
    { sender: 'bot', text: '### Translation & Simplification\n\n**ORIGINAL (English):**\n"The Receiving Party shall indemnify and hold harmless the Disclosing Party against any liabilities..."\n\n**TRANSLATED (Spanish):**\n*La parte receptora deberá indemnizar y eximir de responsabilidad a la parte reveladora contra cualquier obligación legal...*\n\n**SIMPLE EXPLANATION (Spanish):**\nBásicamente significa que si recibes información confidencial y hay un problema legal, tú tendrás que cubrir los gastos, no la otra persona.' }
  ]
};

const MultiAgentChat = () => {
  const [activeAgent, setActiveAgent] = useState('action');
  const [messages, setMessages] = useState(mockConvos['action']);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [, setIsSpeaking] = useState(false);
  
  const languages = [
    'English', 'Spanish', 'French', 'German', 'Mandarin', 'Hindi', 'Arabic', 'Japanese',
    'Bengali', 'Telugu', 'Malayalam', 'Tamil', 'Kannada', 'Marathi', 'Assamese', 'Gujarati', 'Odia', 'Sanskrit', 'Urdu'
  ];
  const [selectedLang, setSelectedLang] = useState('English');

  // Voice Input Logic
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.start();
  };

  // Voice Output Logic (TTS)
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`_]/g, '')); // Strip markdown
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-Speech is not supported in your browser.");
    }
  };

  // Removed mock typing simulator to prevent race conditions with real backend responses
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    // Show typing indicator
    setMessages(prev => [...prev, { sender: 'bot', text: '', isTyping: true }]);
    // Append target language for the AI if not English
    const backendMessage = selectedLang !== 'English' 
      ? `${userMsg}\n\n[IMPORTANT: Please translate and structure your ENTIRE final response seamlessly in ${selectedLang}. Do not include English unless necessary.]` 
      : userMsg;

    try {
      const res = await apiPost('/chat', { agent_id: activeAgent, message: backendMessage });
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { sender: 'bot', text: res.data.response };
        return updated;
      });
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { sender: 'bot', text: 'Sorry, I could not reach the backend. Ensure the server is running.' };
        return updated;
      });
    }
  };

  // Render rich text: converts **bold**, emoji bullets, separators into JSX
  const renderMessageText = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('─────')) {
        return <hr key={i} className="border-slate-200 dark:border-slate-600 my-2" />;
      }
      if (line === '') return <div key={i} className="h-1" />;
      const parts = line.split(/\*\*(.*?)\*\*/g);
      const content = parts.map((part, j) =>
        j % 2 === 1 ? <strong key={j} className="font-semibold">{part}</strong> : <span key={j}>{part}</span>
      );
      const isSpecialLine = /^[🔴🟡🟢📋📧⚡✅🔍]/u.test(line);
      return <div key={i} className={isSpecialLine ? 'mt-2' : ''}>{content}</div>;
    });
  };

  return (
    <div className="h-full flex flex-col pt-4">
      <div className="px-6 mb-4 flex justify-between items-center gap-4">
        <div className="flex gap-4 overflow-x-auto pb-2 flex-1">
          {agents.map(agent => {
            const Icon = agent.icon;
            const isActive = activeAgent === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => { 
                  setActiveAgent(agent.id); 
                  setMessages(mockConvos[agent.id]);
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${
                  isActive 
                    ? `${agent.bg} shadow-md` 
                    : 'bg-white/40 dark:bg-slate-800/40 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm ${isActive ? agent.color : 'text-slate-500'}`}>
                  <Icon size={18} />
                </div>
                <span className={`font-semibold text-sm ${isActive ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{agent.name}</span>
              </button>
            )
          })}
        </div>
        
        <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 mb-2">
          <Globe size={16} className="text-slate-500" />
          <select 
            value={selectedLang} 
            onChange={(e) => setSelectedLang(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer appearance-none outline-none pr-2"
          >
            {languages.map(lang => (
              <option key={lang} value={lang} className="text-slate-800 dark:bg-slate-800 dark:text-white">
                Output: {lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 mx-6 mb-6 glass-panel rounded-2xl flex flex-col overflow-hidden relative">
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={idx} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center shadow-md ${
                    msg.sender === 'user' ? 'bg-gradient-to-tr from-legal-teal to-legal-blue text-white' : 'bg-white dark:bg-slate-800 text-legal-cyan'
                  }`}>
                    {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  
                  <div className={`relative p-4 rounded-2xl text-sm leading-relaxed shadow-sm group ${
                    msg.sender === 'user' 
                      ? 'bg-legal-blue text-white dark:bg-legal-cyan/20 dark:text-legal-cyan rounded-tr-none' 
                      : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                  }`}>
                    {msg.isTyping ? (
                      <div className="flex gap-1 items-center h-5 px-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    ) : (
                      <>
                        {msg.sender === 'bot' && !msg.isTyping && (
                          <button 
                            onClick={() => speakText(msg.text)}
                            className="absolute -right-10 top-2 p-2 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 hover:bg-white/20 text-slate-400 hover:text-legal-cyan transition-all"
                            title="Listen to response"
                          >
                            <Volume2 size={16} />
                          </button>
                        )}
                        {msg.sender === 'bot'
                          ? <div className="space-y-0.5">{renderMessageText(msg.text)}</div>
                          : msg.text
                        }
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 dark:bg-slate-900/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? "Listening..." : `Ask the ${agents.find(a => a.id === activeAgent)?.name}...`}
                className={`w-full h-12 pl-4 pr-12 rounded-xl border ${isListening ? 'border-legal-cyan ring-2 ring-legal-cyan/20' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-cyan/50 dark:text-white transition-all shadow-inner`}
              />
              <button 
                type="button"
                onClick={startListening}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                  isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-legal-blue dark:hover:text-legal-cyan'
                }`}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-legal-blue text-white disabled:opacity-50 hover:bg-legal-teal dark:bg-legal-cyan dark:text-legal-navy transition-colors shadow-lg"
            >
              <Send size={20} className="ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiAgentChat;
