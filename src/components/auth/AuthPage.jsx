import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Scale, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

function InputField({ id, label, type = 'text', value, onChange, error, icon: Icon, rightElement, autoComplete }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-300">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-legal-cyan transition-colors duration-200">
          <Icon size={17} />
        </div>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={`w-full h-12 pl-10 pr-12 rounded-xl bg-slate-800/80 text-white placeholder-slate-600
            border transition-all duration-200 focus:outline-none focus:ring-2
            ${error
              ? 'border-red-500/70 focus:ring-red-500/30'
              : 'border-slate-700 focus:ring-legal-cyan/40 focus:border-legal-cyan/60'
            }`}
          placeholder={label}
          required
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-red-400 flex items-center gap-1 font-medium"
          >
            <AlertCircle size={12} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const PASSWORD_MIN = 8;

function validate(email, password, isLogin) {
  const errors = {};
  if (!email) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  else if (!isLogin && password.length < PASSWORD_MIN)
    errors.password = `Password must be at least ${PASSWORD_MIN} characters`;
  return errors;
}

export default function AuthPage({ onBack }) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = () => {
    setIsLogin((v) => !v);
    setErrors({});
    setServerError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMsg('');
    const fieldErrors = validate(email, password, isLogin);
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      if (isLogin) {
        const res = await api.post('/auth/login', { email, password });
        login(res.data.access_token);
      } else {
        await api.post('/auth/signup', { email, password });
        setSuccessMsg('Account created! Please log in.');
        setPassword('');
        setIsLogin(true);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === 'Email already registered') {
        setErrors({ email: 'This email is already registered' });
      } else if (err.response?.status === 401) {
        setServerError('Invalid email or password. Please try again.');
      } else if (!err.response) {
        setServerError('Cannot reach the server. Make sure the backend is running.');
      } else {
        setServerError(detail || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Atmospheric blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-legal-cyan/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[40%] h-[40%] rounded-full bg-legal-blue/20 blur-[100px] pointer-events-none" />

      {/* Back button */}
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 transition-colors duration-200 group z-50"
        >
          <ArrowRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Website</span>
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={isLogin ? 'login' : 'signup'}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-md relative z-10"
        >
          {/* Card */}
          <div className="liquid-glass rounded-[2rem] shadow-2xl overflow-hidden">

            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-legal-teal via-legal-cyan to-legal-blue" />

            <div className="p-8 sm:p-10">
              {/* Logo */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-legal-cyan to-legal-blue flex items-center justify-center shadow-lg shadow-legal-cyan/20 mb-4">
                  <Scale size={28} className="text-white" />
                </div>
                <h1 className="text-4xl font-heading italic text-white tracking-tight">LexAgent.</h1>
                <p className="text-slate-400 text-sm mt-1">
                  {isLogin ? 'Sign in to your workspace' : 'Create your account'}
                </p>
              </div>

              {/* Server error banner */}
              <AnimatePresence>
                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-5 flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm font-medium"
                  >
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    {serverError}
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-5 flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-3 text-sm font-medium"
                  >
                    <CheckCircle size={16} className="mt-0.5 shrink-0" />
                    {successMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <InputField
                  id="auth-email"
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: '' })); }}
                  error={errors.email}
                  icon={Mail}
                  autoComplete="email"
                />

                <InputField
                  id="auth-password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: '' })); }}
                  error={errors.password}
                  icon={Lock}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-slate-500 hover:text-legal-cyan transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  }
                />

                {!isLogin && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-slate-500 font-medium flex items-center gap-1.5"
                  >
                    <CheckCircle size={12} className="text-legal-cyan" />
                    Minimum {PASSWORD_MIN} characters required
                  </motion.p>
                )}

                <button
                  id="auth-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-legal-teal to-legal-cyan text-legal-navy font-bold text-sm
                    flex items-center justify-center gap-2
                    hover:brightness-110 active:scale-[0.98] transition-all duration-200
                    disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-legal-cyan/20"
                >
                  {loading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      {isLogin ? 'Signing in…' : 'Creating account…'}
                    </>
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <span className="text-slate-500 text-sm">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                </span>
                <button
                  id="auth-switch-btn"
                  onClick={switchMode}
                  className="text-legal-cyan text-sm font-semibold hover:underline underline-offset-2 transition-colors"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-slate-600 text-xs mt-5">
            AI-powered legal document processing · Secured with JWT
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
