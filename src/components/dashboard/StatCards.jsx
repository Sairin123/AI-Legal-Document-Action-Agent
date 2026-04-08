import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileCheck, AlertTriangle, Clock, Activity } from 'lucide-react';
import api, { apiGet } from '../../api';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const StatCards = () => {
  const [data, setData] = useState({ processed: 0, actions_pending: 0, automation_rate: '0%' });

  useEffect(() => {
    apiGet('/stats').then(res => {
      setData(res.data);
    }).catch(err => console.error(err));
  }, []);

  const stats = [
    { id: 1, title: 'Docs Processed', value: data.processed.toString(), icon: FileCheck, color: 'from-green-400 to-emerald-600', trend: 'Total docs parsed' },
    { id: 2, title: 'High Risk Clauses', value: data.high_risk_clauses !== undefined ? data.high_risk_clauses.toString() : '0', icon: AlertTriangle, color: 'from-red-400 to-rose-600', trend: 'Critical liabilities requiring review' },
    { id: 3, title: 'Pending Actions', value: data.actions_pending.toString(), icon: Clock, color: 'from-orange-400 to-amber-600', trend: 'Requires your approval' },
    { id: 4, title: 'AI Automation Rate', value: data.automation_rate, icon: Activity, color: 'from-legal-cyan to-legal-blue', trend: 'Approved without edits' },
  ];

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <motion.div 
            key={stat.id} 
            variants={item}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="p-6 rounded-2xl glass-panel relative overflow-hidden group"
          >
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${stat.color} rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500`}></div>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                <Icon size={24} />
              </div>
            </div>
            
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              {stat.trend}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default StatCards;
