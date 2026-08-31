import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Library, FileText, ExternalLink, ShieldAlert, Sparkles, Zap } from 'lucide-react';
import { apiGet } from '../../api';

const ClauseLibrary = () => {
  const [clauses, setClauses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchClauses();
  }, []);

  const fetchClauses = async () => {
    try {
      const res = await apiGet('/clauses');
      setClauses(res.data);
    } catch (err) {
      console.error('Failed to fetch library:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClauses = clauses.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.doc_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'risk') return matchesSearch && (c.type === 'risk' || c.risk_level === 'High');
    if (filterType === 'positive') return matchesSearch && c.type === 'positive';
    return matchesSearch;
  });

  return (
    <div className="h-full flex flex-col pt-4">
      <div className="px-6 mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <Library className="text-legal-cyan" />
          Smart Clause Library
        </h2>
        <p className="text-slate-500 text-sm mt-1 italic">A centralized repository of every legal provision analyzed by your agents.</p>
      </div>

      <div className="px-6 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search clauses, keywords, or documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-legal-cyan/20 transition-all shadow-sm"
          />
        </div>
        
        <div className="flex gap-2">
          {['all', 'risk', 'positive'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                filterType === type 
                  ? 'bg-legal-cyan text-white border-legal-cyan shadow-lg shadow-legal-cyan/20' 
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700" />
            ))}
          </div>
        ) : filteredClauses.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 glass-panel rounded-2xl">
            <Library size={48} className="mb-4 opacity-20" />
            <p className="font-medium">No archived clauses found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredClauses.map((clause, idx) => (
                <motion.div
                  key={clause.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="glass-panel p-6 rounded-2xl flex flex-col group hover:border-legal-cyan/50 transition-all cursor-default"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                       <div className={`p-2 rounded-lg ${
                         clause.type === 'positive' ? 'bg-fuchsia-500/10 text-fuchsia-500' :
                         (clause.type === 'risk' || clause.risk_level === 'High') ? 'bg-red-500/10 text-red-500' :
                         'bg-emerald-500/10 text-emerald-500'
                       }`}>
                         {clause.type === 'positive' ? <Sparkles size={16} /> :
                          (clause.type === 'risk' || clause.risk_level === 'High') ? <ShieldAlert size={16} /> :
                          <Zap size={16} />}
                       </div>
                       <h4 className="font-bold text-slate-800 dark:text-white">{clause.title}</h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                        clause.risk_level === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {clause.risk_level} Risk
                    </span>
                  </div>

                  <div className="flex-1 mb-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 relative group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-serif leading-relaxed line-clamp-4 italic">
                      "{clause.content || 'Clause text unavailable.'}"
                    </p>
                  </div>

                  <div className="bg-legal-cyan/5 border border-legal-cyan/10 p-3 rounded-lg mb-4">
                    <span className="text-[10px] font-bold text-legal-cyan uppercase mb-1 block">AI Analysis & Strategy</span>
                    <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                      {clause.ai_action}
                    </p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <FileText size={14} />
                      <span className="truncate max-w-[120px]">{clause.doc_name}</span>
                    </div>
                    <button className="text-xs font-bold text-legal-cyan hover:underline flex items-center gap-1 group">
                      View Document <ExternalLink size={12} className="group-hover:scale-110" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClauseLibrary;
