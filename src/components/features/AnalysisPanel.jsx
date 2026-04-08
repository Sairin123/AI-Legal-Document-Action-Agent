import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle, Search, FileText, XCircle, ChevronRight, Check } from 'lucide-react';
import api, { apiGet, apiPost } from '../../api';

const AnalysisPanel = () => {
  const [queue, setQueue] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await apiGet('/queue');
      setQueue(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const currentDoc = queue[activeIdx];

  const handleDecision = async (decision) => {
    setIsProcessing(true);
    try {
      await apiPost(`/action/${currentDoc.id}`, { action: decision });
      setQueue(prev => prev.filter((_, i) => i !== activeIdx));
      setActiveIdx(0);
    } catch (e) {
      console.error(e);
      alert('Failed to register action');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center p-8 text-slate-500 font-bold animate-pulse">Loading Approval Queue from Backend...</div>;
  }

  if (!currentDoc) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-emerald-500">
          <CheckCircle size={80} className="mb-6" />
          <h2 className="text-3xl font-bold mb-2">You're All Caught Up!</h2>
          <p className="text-slate-500">The AI has processed all documents requiring your approval.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col pt-4">
      <div className="flex justify-between items-center mb-6 px-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">Needs Approval</span>
            {currentDoc.name}
          </h2>
          <p className="text-slate-500 text-sm mt-1">Processed by Autonomy Agent • {currentDoc.time} • Queue length: {queue.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 px-6 pb-6 relative overflow-hidden">
        
        {/* Document Viewer Mockup */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentDoc.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-legal-blue to-legal-cyan"></div>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200">Source Document</h3>
              <div className="flex items-center gap-4">
                <Search size={16} className="text-slate-400" />
              </div>
            </div>
            
            <div className="flex-1 bg-white/50 dark:bg-black/20 rounded-xl p-6 overflow-y-auto text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-serif shadow-inner space-y-4">
              {currentDoc.content.map((block, idx) => (
                <p key={idx}>
                  {block.highlight ? (
                    <span className={`px-1 rounded relative group cursor-pointer ${
                      block.highlight === 'danger' ? 'bg-red-200/50 dark:bg-red-500/30 border-b-2 border-red-500 border-dashed' : 'bg-yellow-200/50 dark:bg-yellow-500/20 border-b-2 border-yellow-500 border-dashed'
                    }`}>
                      {block.p}
                      <span className="absolute bottom-full mb-2 left-0 w-48 bg-slate-800 text-white text-xs p-2 rounded shadow-xl hidden group-hover:block z-50 animate-fade-in font-sans">
                        {block.reason}
                      </span>
                    </span>
                  ) : (
                    block.p
                  )}
                </p>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* AI Action/Approval Sidebar */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col h-[calc(100vh-140px)] relative overflow-hidden">
          
          {/* Processing Overlay */}
          {isProcessing && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
              className="absolute inset-0 z-50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex flex-col justify-center items-center"
            >
              <div className="w-12 h-12 border-4 border-legal-blue border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 font-bold text-legal-blue dark:text-legal-cyan animate-pulse">Executing Action...</p>
            </motion.div>
          )}

          <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <ShieldAlert className="text-legal-cyan" size={20} /> Intensive Analysis Report
          </h3>
          
          <div className="space-y-4 mb-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
            
            {/* Detailed AI Summary Card */}
            <div className="bg-gradient-to-br from-legal-blue/10 to-legal-cyan/10 p-5 rounded-2xl border border-legal-cyan/30 shadow-sm relative">
              <div className="absolute top-0 right-0 -mr-2 -mt-2 w-8 h-8 rounded-full bg-legal-cyan flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
                <Check size={16} className="text-white" />
              </div>
              <h4 className="font-heading italic text-xl text-legal-blue dark:text-legal-cyan mb-2">Executive Summary</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {currentDoc.aiSummary}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-6 mb-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">Recommended Actions</h4>
              <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
            </div>

            {currentDoc.clauses.map((clause, index) => (
               <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:border-legal-cyan/50 hover:shadow-md">
                 <div className="flex justify-between items-start mb-3">
                   <h4 className="font-bold text-slate-800 dark:text-white text-base">{clause.title}</h4>
                   <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded p-1 ${clause.type === 'risk' || clause.risk_level === 'High' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 border border-red-500/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30'}`}>
                     {clause.risk_level || 'Low'} Risk
                   </span>
                 </div>
                 
                 <div className="mb-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border-l-2 border-slate-300 dark:border-slate-600">
                   <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Clause Text Extract</span>
                   <p className="text-xs text-slate-600 dark:text-slate-400 font-serif leading-relaxed line-clamp-3">
                     "{clause.content || clause.text || 'No exact text extract provided.'}"
                   </p>
                 </div>

                 <div className="bg-legal-cyan/10 p-3 rounded-lg border border-legal-cyan/20 flex flex-col gap-1">
                   <span className="text-[10px] text-legal-blue dark:text-legal-cyan font-bold uppercase tracking-wider">AI Suggestion</span>
                   <p className="text-sm text-slate-800 dark:text-slate-200 font-medium flex items-start gap-2">
                     <ChevronRight size={16} className="text-legal-cyan shrink-0 mt-0.5" /> 
                     <span>{clause.aiAction}</span>
                   </p>
                 </div>
               </div>
            ))}
          </div>

          <div className="mt-auto pt-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => handleDecision('reject')}
                className="flex-1 py-4 flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 font-bold transition-colors group text-sm"
              >
                <XCircle size={18} className="group-hover:scale-110 transition-transform" /> Reject / Edit
              </button>
              <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
              <button 
                onClick={() => handleDecision('approve')}
                className="flex-1 py-4 flex items-center justify-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold transition-colors group text-sm"
              >
                <CheckCircle size={18} className="group-hover:scale-110 transition-transform" /> Approve All
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AnalysisPanel;
