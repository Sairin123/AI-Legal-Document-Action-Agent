import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Mic, LogOut, User as UserIcon, Settings as SettingsIcon, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getUserInfoFromToken = () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.sub) {
        return { email: payload.sub, initial: payload.sub[0].toUpperCase() };
      }
    } catch { /* ignore */ }
  }
  return { email: 'admin@lexagent.ai', initial: 'A' };
};

const Header = () => {
  const [userInfo] = useState(getUserInfoFromToken);
  const userInitial = userInfo.initial;
  const userEmail = userInfo.email;
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // References for click-outside to close dropdowns
  const notifRef = useRef();
  const profileRef = useRef();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  return (
    <header className="h-20 fixed top-0 right-0 left-64 glass z-40 flex items-center justify-between px-8">
      <div className="flex-1 max-w-2xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white transition-colors" size={20} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isListening ? "Listening..." : "Search documents, clauses, or ask the UI agent..."}
            className="w-full h-12 pl-12 pr-12 rounded-full glass-panel focus:outline-none focus:ring-1 focus:ring-white/30 transition-all font-medium text-white placeholder-slate-400"
          />
          <button 
            onClick={startListening}
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${isListening ? 'bg-legal-cyan/20 text-legal-cyan shadow-[0_0_15px_rgba(91,192,190,0.5)] animate-pulse' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}
          >
            <Mic size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-4 ml-8 relative">
        <div ref={notifRef} className="relative">
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className={`w-10 h-10 rounded-full glass-panel flex items-center justify-center transition-colors relative ${showNotifications ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-slate-300'}`}
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-4 w-80 liquid-glass border border-white/10 rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="p-4 border-b border-white/10 bg-black/40">
                  <h3 className="text-white font-semibold">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <div className="flex flex-col">
                    <div className="p-4 hover:bg-white/5 border-b border-white/5 cursor-pointer">
                      <div className="text-sm font-semibold text-white">MSA Pending Approval</div>
                      <div className="text-xs text-slate-400 mt-1">Acme Corp MSA requires your final sign-off.</div>
                      <div className="text-[10px] text-legal-cyan mt-2">2 minutes ago</div>
                    </div>
                    <div className="p-4 hover:bg-white/5 cursor-pointer">
                      <div className="text-sm font-semibold text-white">Risk Flag: High</div>
                      <div className="text-xs text-slate-400 mt-1">Uncapped liability found in vendor contract.</div>
                      <div className="text-[10px] text-legal-cyan mt-2">1 hour ago</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div ref={profileRef} className="relative">
          <button 
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className={`h-10 w-10 rounded-full bg-gradient-to-tr from-legal-blue to-legal-teal border-2 transition-all shadow-md flex items-center justify-center text-white font-bold cursor-pointer ${showProfile ? 'border-legal-cyan' : 'border-transparent'}`}
          >
            {userInitial}
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-4 w-64 liquid-glass border border-white/10 rounded-2xl shadow-xl overflow-hidden p-2"
              >
                <div className="px-4 py-3 border-b border-white/10 mb-2">
                  <div className="text-sm text-white font-semibold">My Account</div>
                  <div className="text-xs text-slate-400 truncate">{userEmail}</div>
                </div>
                
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                  <UserIcon size={16} /> My Profile
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                  <SettingsIcon size={16} /> Preferences
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors mb-2">
                  <CreditCard size={16} /> Billing
                </button>
                
                <div className="border-t border-white/10 pt-2 text-left">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
