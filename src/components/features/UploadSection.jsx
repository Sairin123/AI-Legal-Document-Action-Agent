import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, File, CheckCircle, Loader } from 'lucide-react';
import api, { apiPost } from '../../api';

const UploadSection = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, uploading, analyzing, done
  const [resultId, setResultId] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  }

  const processFile = async (file) => {
    setStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // 1. Upload
      const uploadRes = await apiPost('/upload', formData);
      const docId = uploadRes.data.id;
      
      // 2. Trigger Analysis
      setStatus('analyzing');
      await apiPost(`/analyze/${docId}`);
      
      setResultId(docId);
      setStatus('done');
      
      setTimeout(() => setStatus('idle'), 4000);
    } catch (error) {
      console.error(error);
      setStatus('idle');
      alert('Error processing document. Ensure backend is running.');
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Upload Legal Documents</h2>
          <p className="text-slate-500 dark:text-slate-400">Drag and drop your contracts, NDAs, or agreements to be parsed by our AI agents.</p>
        </div>

        <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept=".pdf,.docx,.txt"
            onChange={handleFileSelect}
        />
        
        <label htmlFor="file-upload">
          <motion.div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            animate={{
              scale: isDragging ? 1.02 : 1,
              backgroundColor: isDragging ? 'rgba(91, 192, 190, 0.1)' : 'rgba(255, 255, 255, 0.5)'
            }}
            className={`border-3 border-dashed rounded-3xl p-12 text-center transition-colors glass-panel cursor-pointer ${
              isDragging 
                ? 'border-legal-cyan dark:border-legal-cyan/50 dark:bg-legal-cyan/10' 
                : 'border-slate-300 dark:border-slate-700'
            }`}
          >
            {status === 'done' ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-emerald-500"
              >
                <CheckCircle size={64} className="mb-4" />
                <h3 className="text-xl font-bold">Document Successfully Parsed & Analyzed!</h3>
                <p className="text-slate-500 mt-2">Added to your Approval Queue.</p>
              </motion.div>
            ) : status === 'analyzing' || status === 'uploading' ? (
              <motion.div className="flex flex-col items-center text-legal-blue dark:text-legal-cyan">
                <Loader size={64} className="animate-spin mb-4" />
                <h3 className="text-xl font-bold">{status === 'uploading' ? 'Extracting Text...' : 'AI Pipeline Running...'}</h3>
                <p className="text-slate-500 mt-2 font-medium">Extracting clauses and measuring risk profiles (approx 5-10s).</p>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center pointer-events-none">
                <div className="w-20 h-20 bg-legal-blue/5 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <UploadCloud size={40} className="text-legal-blue dark:text-legal-cyan" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Drag & Drop files here</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">or click to browse from your computer</p>
                
                <div className="flex items-center gap-4 text-sm font-semibold text-slate-400">
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full"><File size={14}/> PDF</span>
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full"><File size={14}/> DOCX</span>
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full"><File size={14}/> TXT</span>
                </div>
              </div>
            )}
          </motion.div>
        </label>
      </motion.div>
    </div>
  );
};

export default UploadSection;
