import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, CheckCircle, Loader, Camera, X, ImageIcon } from 'lucide-react';
import { apiPost } from '../../api';

const UploadSection = ({ onNavigateToQueue }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, uploading, analyzing, done
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    setIsCameraOpen(true);
    setStatus('idle');
    try {
      // Request high resolution for better OCR
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Could not access the camera. Please check your permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Calculate crop area based on the UI overlay
      // The overlay is inset-x-8 inset-y-12 in a max-lg container
      // We'll capture the full frame but optimize quality
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Optional: Add a flash effect
      const flash = document.createElement('div');
      flash.className = "fixed inset-0 bg-white z-[100] animate-pulse";
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 100);

      // Convert to file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'scanned-legal-doc.jpg', { type: 'image/jpeg' });
          stopCamera();
          processFile(file);
        }
      }, 'image/jpeg', 0.98);
    }
  };

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
      const extractedText = uploadRes.data.extracted_text || "";
      
      if (extractedText.includes("[Image upload detected. OCR skipped") || 
          extractedText.includes("[Image text extraction failed")) {
          setStatus('idle');
          alert("OCR Failed: " + extractedText);
          return;
      }

      // 2. Trigger Analysis
      setStatus('analyzing');
      await apiPost(`/analyze/${docId}`);
      
      setStatus('done');
      
      // Auto-navigate to queue if the user requested it via capture
      if (onNavigateToQueue) {
        setTimeout(() => {
          onNavigateToQueue();
          setStatus('idle');
        }, 1500);
      } else {
        setTimeout(() => setStatus('idle'), 4000);
      }
    } catch (error) {
      console.error(error);
      setStatus('idle');
      alert('Error processing document. Ensure backend is running.');
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 relative">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Upload Legal Documents</h2>
          <p className="text-slate-500 dark:text-slate-400">Drag and drop, browse, or use your camera to scan contracts, NDAs, or agreements.</p>
        </div>

        <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept=".pdf,.docx,.txt,image/*"
            onChange={handleFileSelect}
        />
        
        {/* Main Upload Dropzone */}
        {!isCameraOpen && (
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
              className={`border-3 border-dashed rounded-3xl p-12 text-center transition-colors glass-panel cursor-pointer relative ${
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
                  <h3 className="text-xl font-bold">{status === 'uploading' ? 'Uploading & Extracting Text...' : 'AI Pipeline Running...'}</h3>
                  <p className="text-slate-500 mt-2 font-medium">Extracting clauses and measuring risk profiles (approx 5-10s).</p>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center pointer-events-none">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-legal-blue/5 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
                      <UploadCloud size={32} className="text-legal-blue dark:text-legal-cyan" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Drag & Drop files here</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">or click to browse from your computer</p>
                  
                  <div className="flex items-center justify-center gap-3 text-sm font-semibold text-slate-400">
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full"><File size={14}/> PDF</span>
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full"><File size={14}/> DOCX</span>
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full"><ImageIcon size={14}/> IMG</span>
                  </div>
                </div>
              )}
            </motion.div>
          </label>
        )}

        {/* Action Buttons */}
        {!isCameraOpen && status === 'idle' && (
          <div className="mt-6 flex justify-center">
             <button
                onClick={(e) => { e.preventDefault(); startCamera(); }}
                className="flex items-center gap-2 bg-gradient-to-r from-legal-blue to-legal-teal hover:from-legal-teal hover:to-legal-cyan text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-legal-cyan/20 transition-all active:scale-[0.98]"
              >
                <Camera size={20} />
                Scan with Camera
             </button>
          </div>
        )}

        {/* Camera Overlay Modal */}
        <AnimatePresence>
          {isCameraOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 rounded-3xl p-4 overflow-hidden backdrop-blur-sm"
            >
              <div className="relative w-full h-full max-w-lg mx-auto flex flex-col items-center justify-center">
                <button 
                  onClick={stopCamera}
                  className="absolute top-4 right-4 bg-slate-800/80 text-white p-2 rounded-full hover:bg-red-500 transition-colors z-10"
                >
                  <X size={20} />
                </button>
                
                <div className="relative w-full aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-legal-cyan mb-6">
                  {/* Video Stream */}
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  {/* Scanner UI overlay */}
                  <div className="absolute inset-x-8 inset-y-12 border-2 border-white/50 rounded-xl pointer-events-none">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-legal-cyan -translate-x-[2px] -translate-y-[2px]" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-legal-cyan translate-x-[2px] -translate-y-[2px]" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-legal-cyan -translate-x-[2px] translate-y-[2px]" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-legal-cyan translate-x-[2px] translate-y-[2px]" />
                  </div>
                </div>

                <button
                  onClick={captureImage}
                  className="w-16 h-16 rounded-full bg-legal-cyan border-4 border-white shadow-lg hover:scale-105 active:scale-95 transition-all text-legal-navy flex items-center justify-center shrink-0"
                >
                  <Camera size={24} />
                </button>
                <button 
                  onClick={captureImage}
                  className="text-white font-medium mt-3 hover:text-legal-cyan hover:underline transition-colors active:scale-95"
                >
                  Tap to Capture Document
                </button>
                
                {/* Hidden canvas for taking photos */}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};

export default UploadSection;
