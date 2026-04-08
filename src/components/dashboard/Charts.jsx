import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { apiGet } from '../../api';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-lg border border-white/20 shadow-xl text-sm">
        {label && <p className="font-semibold text-slate-800 dark:text-white mb-1">{label}</p>}
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color || entry.fill }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DEFAULT_DATA = {
  classification: [{ name: 'No documents yet', value: 1, color: '#334155' }],
  risk_distribution: [{ name: 'Waiting', high: 0, medium: 0, low: 0 }],
  weekly_volume: [
    { name: 'W1', docs: 0 }, { name: 'W2', docs: 0 }, { name: 'W3', docs: 0 },
    { name: 'W4', docs: 0 }, { name: 'W5', docs: 0 },
  ],
};

const Charts = () => {
  const [data, setData] = useState(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/charts')
      .then(res => {
        setData({
          classification: res.data.classification?.length ? res.data.classification : DEFAULT_DATA.classification,
          risk_distribution: res.data.risk_distribution?.length ? res.data.risk_distribution : DEFAULT_DATA.risk_distribution,
          weekly_volume: res.data.weekly_volume?.length ? res.data.weekly_volume : DEFAULT_DATA.weekly_volume,
        });
      })
      .catch(err => console.error('Charts fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {[1, 2].map(i => (
          <div key={i} className={`rounded-2xl glass-panel p-6 h-64 animate-pulse ${i === 2 ? 'lg:col-span-2' : ''}`}>
            <div className="h-4 w-32 bg-slate-300/30 rounded mb-4" />
            <div className="h-full bg-slate-200/20 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Document Classification Pie */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-2xl glass-panel col-span-1"
      >
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Classification</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.classification}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.classification.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {data.classification.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              {item.name}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Weekly Volume Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-2xl glass-panel col-span-1 lg:col-span-2"
      >
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Processing Volume</h3>
        <p className="text-xs text-slate-400 mb-4">Documents uploaded per week (last 5 weeks)</p>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.weekly_volume} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.15} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="docs"
                name="Documents"
                stroke="#5BC0BE"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#5BC0BE' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Risk Distribution Bar Chart (full width below) */}
      {(data.risk_distribution[0]?.high > 0 || data.risk_distribution[0]?.medium > 0 || data.risk_distribution[0]?.low > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl glass-panel col-span-1 lg:col-span-3"
        >
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Risk Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">Clause risk levels across all analyzed documents</p>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.risk_distribution} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.15} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="high" name="High Risk" fill="#f87171" radius={[4, 4, 0, 0]} />
                <Bar dataKey="medium" name="Medium Risk" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                <Bar dataKey="low" name="Low Risk" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Charts;
