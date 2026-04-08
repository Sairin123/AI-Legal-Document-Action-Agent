import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import StatCards from './components/dashboard/StatCards';
import Charts from './components/dashboard/Charts';
import Timeline from './components/dashboard/Timeline';
import UploadSection from './components/features/UploadSection';
import AnalysisPanel from './components/features/AnalysisPanel';
import MultiAgentChat from './components/features/MultiAgentChat';
import LandingPage from './components/layout/LandingPage';
import AuthPage from './components/auth/AuthPage';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuth, setShowAuth] = useState(false);

  // Show landing or auth page if not logged in
  if (!isAuthenticated) {
    if (showAuth) {
      return <AuthPage onBack={() => setShowAuth(false)} />;
    }
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  // If authenticated but Website tab is selected, float the landing page
  if (activeTab === 'website') {
    return <LandingPage onGetStarted={() => setActiveTab('dashboard')} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            key="dashboard"
            className="h-full flex flex-col"
          >
            <div className="mb-8">
              <h1 className="font-heading text-5xl text-white italic tracking-tight mb-2">Agentic Dashboard</h1>
              <p className="text-slate-400 font-sans text-sm tracking-wide">Overview of legal documents processed and actions taken.</p>
            </div>
            <StatCards />
            <Charts />
            <Timeline />
          </motion.div>
        );
      case 'upload':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            key="upload"
            className="h-full"
          >
            <UploadSection />
          </motion.div>
        );
      case 'analysis':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            key="analysis"
            className="h-full"
          >
            <AnalysisPanel />
          </motion.div>
        );
      case 'chat':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            key="chat"
            className="h-full"
          >
            <MultiAgentChat />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dark min-h-screen bg-black text-slate-100 font-sans flex relative overflow-hidden transition-colors duration-300">
      {/* Background Decorators */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-legal-cyan/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] w-[40%] h-[40%] rounded-full bg-legal-blue/20 blur-[100px] pointer-events-none" />

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <Header />

      <main className="flex-1 ml-64 mt-20 p-8 h-[calc(100vh-5rem)] overflow-y-auto relative z-10 custom-scrollbar">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
