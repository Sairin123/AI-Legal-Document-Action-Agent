import React, { useState } from 'react';
import { Home, FileText, CheckSquare, MessageSquare, Settings, Globe, X, History, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [showSettings, setShowSettings] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'upload', icon: FileText, label: 'Documents' },
    { id: 'analysis', icon: CheckSquare, label: 'Approval Queue' },
    { id: 'history', icon: History, label: 'Document History' },
    { id: 'clauses', icon: Library, label: 'Clause Library' },
    { id: 'chat', icon: MessageSquare, label: 'Agent Chat' },
    { id: 'website', icon: Globe, label: 'Website Homepage' },
  ];

  return (
    <>
      <aside className="w-64 h-screen fixed top-0 left-0 glass z-50 flex flex-col pt-20 pb-4">
        <div className="px-6 mb-8 mt-4">
          <h2 className="text-2xl font-heading italic text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-legal-cyan to-legal-blue flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            LexAgent.
          </h2>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 relative">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 relative ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={isActive ? '' : 'opacity-70'} />
                  <span className="font-medium">{item.label}</span>
                </div>
                
                {/* Badge for Approval Queue */}
                {item.id === 'analysis' && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    2
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 mt-auto">
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-300"
          >
            <Settings size={20} className="opacity-70" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="liquid-glass border border-white/20 rounded-3xl w-full max-w-lg p-8 relative overflow-hidden"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 className="font-heading text-3xl text-white italic mb-6">Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Theme Preference</label>
                  <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-legal-cyan transition-colors appearance-none">
                    <option>Constant Dark (Premium Default)</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Agent Confidence Threshold</label>
                  <input type="range" className="w-full cursor-pointer accent-legal-cyan" min="0" max="100" defaultValue="85" />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Low (More alerts)</span>
                    <span>High (Fewer alerts)</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Microphone Input</label>
                  <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-legal-cyan transition-colors appearance-none">
                    <option>System Default</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="w-full liquid-glass-strong py-3 rounded-xl text-white font-medium hover:bg-white/10 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
