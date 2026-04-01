"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info, BellRing } from 'lucide-react';
import { notificationState } from '../lib/notification-state';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    // Subscribe to the global notification singleton
    return notificationState.subscribe((notification) => {
      setToasts((prev) => [...prev, notification]);
      setTimeout(() => removeToast(notification.id), 5000);
    });
  }, [removeToast]);

  const value = {
    showToast: (type: ToastType, message: string, title?: string) => {
      notificationState.showToast(type, message, title);
    }
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-6 right-6 z-10000 flex flex-col gap-4 pointer-events-none items-end max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full group relative overflow-hidden backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border transition-all duration-500 animate-in slide-in-from-right fade-in px-4 py-4 flex gap-4 ${
              toast.type === 'success'
                ? 'bg-white/90 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-500/20 shadow-emerald-500/5'
                : toast.type === 'error'
                ? 'bg-white/90 dark:bg-rose-950/40 border-rose-100 dark:border-rose-500/20 shadow-rose-500/5'
                : toast.type === 'warning'
                ? 'bg-white/90 dark:bg-amber-950/40 border-amber-100 dark:border-amber-500/20 shadow-amber-500/5'
                : 'bg-white/90 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-500/20 shadow-indigo-500/5'
            }`}
          >
            {/* Animated Side Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              toast.type === 'success' ? 'bg-emerald-500' :
              toast.type === 'error' ? 'bg-rose-500' :
              toast.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'
            } opacity-50`} />

            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
              toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' :
              toast.type === 'error' ? 'bg-rose-500/10 text-rose-600' :
              toast.type === 'warning' ? 'bg-amber-500/10 text-amber-600' :
              'bg-indigo-500/10 text-indigo-600'
            }`}>
              {toast.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
              {toast.type === 'error' && <AlertCircle className="w-6 h-6" />}
              {toast.type === 'warning' && <Info className="w-6 h-6" />}
              {toast.type === 'info' && <BellRing className="w-6 h-6" />}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <h4 className={`text-sm font-bold tracking-tight mb-0.5 ${
                toast.type === 'success' ? 'text-emerald-900 dark:text-emerald-300' :
                toast.type === 'error' ? 'text-rose-900 dark:text-rose-300' :
                toast.type === 'warning' ? 'text-amber-900 dark:text-amber-300' :
                'text-indigo-900 dark:text-indigo-300'
              }`}>
                {toast.title || (toast.type.charAt(0) === 'e' ? 'Error' : toast.type.charAt(0).toUpperCase() + toast.type.slice(1))}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed wrap-break-word">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1.5 h-8 w-8 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Expire progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-white/5">
              <div 
                className={`h-full transition-all linear ${
                  toast.type === 'success' ? 'bg-emerald-500' :
                  toast.type === 'error' ? 'bg-rose-500' :
                  toast.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'
                }`}
                style={{ 
                  animation: 'toast-progress 5s linear forwards'
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <style jsx global>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
