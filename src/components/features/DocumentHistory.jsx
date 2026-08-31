import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, FileText, Calendar, Search, Activity, Trash2, ExternalLink, X } from 'lucide-react';
import api, { apiGet } from '../../api';

const DocumentHistory = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewingDoc, setViewingDoc] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await apiGet('/history');
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocDetails = async (id) => {
    try {
      const res = await apiGet(`/history/${id}`);
      setViewingDoc(res.data);
    } catch (err) {
      console.error("Failed to fetch doc details:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this document?")) {
      try {
        await api.delete(`/history/${id}`);
        setDocuments(prev => prev.filter(d => d.id !== id));
      } catch (err) {
        console.error("Failed to delete document:", err);
        alert("Action failed. Document could not be deleted.");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'needs_approval': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(search.toLowerCase()) || 
    doc.doc_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full h-full p-8 max-w-6xl mx-auto relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-legal-blue to-legal-teal flex items-center justify-center">
                <History className="text-white" size={20} />
              </div>
              Document History
            </h2>
            <p className="text-slate-500 dark:text-slate-400">View and track all uploaded legal documents across your workspace.</p>
          </div>
          
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-legal-cyan text-slate-800 dark:text-white transition-colors"
            />
          </div>
        </div>

        <div className="liquid-glass rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-white/10">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <div className="col-span-4 pl-4">Document Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Date Uploaded</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right pr-4">Actions</div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-white/5">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading history...</div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <History className="mx-auto mb-4 opacity-50" size={48} />
                <p className="text-lg">No documents found in history.</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredDocs.map((doc, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={doc.id}
                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => fetchDocDetails(doc.id)}
                  >
                    <div className="col-span-4 pl-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-legal-blue/10 flex items-center justify-center text-legal-cyan shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-semibold text-slate-800 dark:text-white truncate" title={doc.name}>
                          {doc.name}
                        </h4>
                        <p className="text-xs text-slate-500 truncate" title={doc.aiSummary}>{doc.aiSummary}</p>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                       <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize border border-slate-200 dark:border-slate-700">
                          {doc.doc_type}
                       </span>
                    </div>

                    <div className="col-span-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Calendar size={14} />
                      {doc.time}
                    </div>

                    <div className="col-span-2">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusColor(doc.status)}`}>
                          {doc.status.replace('_', ' ')}
                       </span>
                    </div>

                    <div className="col-span-2 pr-4 flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); fetchDocDetails(doc.id); }}
                        className="p-2 rounded-lg text-slate-400 hover:text-legal-cyan hover:bg-legal-cyan/10 transition-colors" title="View Details"
                      >
                        <ExternalLink size={18} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>

      {/* Document Detail Modal */}
      <AnimatePresence>
        {viewingDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="liquid-glass border border-white/20 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col relative overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-legal-blue to-legal-teal flex items-center justify-center shadow-lg">
                    <FileText className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{viewingDoc.name}</h3>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                      <Activity size={12} /> {viewingDoc.doc_type} • {viewingDoc.time}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingDoc(null)}
                  className="bg-slate-800/80 text-white p-2 rounded-full hover:bg-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h4 className="text-legal-cyan font-bold uppercase tracking-wider text-xs mb-4">Extracted Content</h4>
                      <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                        {viewingDoc.extracted_text || "No text available for this document."}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-legal-cyan font-bold uppercase tracking-wider text-xs mb-4">AI Analysis Summary</h4>
                      <div className="bg-legal-blue/10 rounded-2xl p-6 border border-legal-blue/20 text-slate-200 text-sm leading-relaxed italic">
                        {viewingDoc.aiSummary || "No summary generated."}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-legal-cyan font-bold uppercase tracking-wider text-xs mb-4">Risk Profile</h4>
                      <div className="space-y-3">
                        {viewingDoc.clauses?.length > 0 ? viewingDoc.clauses.map((c, i) => (
                          <div key={i} className={`p-4 rounded-xl border ${
                            c.riskLevel === 'High' ? 'bg-red-500/10 border-red-500/20' : 
                            c.riskLevel === 'Medium' ? 'bg-orange-500/10 border-orange-500/20' : 
                            'bg-emerald-500/10 border-emerald-500/20'
                          }`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-sm text-white">{c.title}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                c.riskLevel === 'High' ? 'bg-red-500 text-white' : 
                                c.riskLevel === 'Medium' ? 'bg-orange-500 text-white' : 
                                'bg-emerald-500 text-white'
                              }`}>{c.riskLevel}</span>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2">{c.content}</p>
                          </div>
                        )) : (
                          <p className="text-slate-500 text-sm">No specific clauses identified.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-slate-900/30 flex justify-end">
                <button 
                  onClick={() => setViewingDoc(null)}
                  className="px-6 py-2 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors"
                >
                  Close Viewer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocumentHistory;
