import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, FileSignature, Send, UploadCloud, MessageSquare, RefreshCw } from 'lucide-react';
import { apiGet } from '../../api';

const EVENT_CONFIG = {
  uploaded:  { icon: UploadCloud,    color: 'text-legal-blue dark:text-legal-cyan',   bg: 'bg-legal-blue/10 dark:bg-legal-cyan/10' },
  analyzed:  { icon: CheckCircle2,   color: 'text-emerald-500',                        bg: 'bg-emerald-500/10' },
  approved:  { icon: CheckCircle2,   color: 'text-emerald-500',                        bg: 'bg-emerald-500/10' },
  modified:  { icon: FileSignature,  color: 'text-legal-cyan',                         bg: 'bg-legal-cyan/10' },
  risk:      { icon: AlertCircle,    color: 'text-rose-500',                           bg: 'bg-rose-500/10' },
  chat:      { icon: MessageSquare,  color: 'text-purple-500',                         bg: 'bg-purple-500/10' },
  system:    { icon: Send,           color: 'text-legal-blue',                         bg: 'bg-legal-blue/10' },
};

const Timeline = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = () => {
    setLoading(true);
    apiGet('/timeline?limit=8')
      .then(res => setEvents(res.data))
      .catch(err => console.error('Timeline fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTimeline(); }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="p-6 rounded-2xl glass-panel relative overflow-hidden"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Automation Activity</h3>
        <button
          onClick={fetchTimeline}
          className="text-sm text-legal-cyan hover:underline font-medium flex items-center gap-1"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-200/50 dark:bg-slate-700/50 shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-1/3 bg-slate-200/50 dark:bg-slate-700/50 rounded" />
                <div className="h-3 w-2/3 bg-slate-200/50 dark:bg-slate-700/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <Send size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No activity yet</p>
          <p className="text-sm mt-1">Upload a document to see agent actions here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <AnimatePresence>
            {events.map((event, index) => {
              const cfg = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.system;
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-4 relative group"
                >
                  {index !== events.length - 1 && (
                    <div className="absolute left-[1.125rem] top-10 bottom-[-1.25rem] w-px bg-slate-200 dark:bg-slate-700" />
                  )}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${cfg.bg} ${cfg.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{event.title}</h4>
                      <span className="text-xs font-medium text-slate-400 shrink-0 ml-2">{event.time}</span>
                    </div>
                    <div className="text-xs font-semibold text-legal-cyan mb-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-legal-cyan" />
                      {event.agent}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{event.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default Timeline;
