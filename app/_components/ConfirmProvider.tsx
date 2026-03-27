"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertCircle, X, AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveCallback, setResolveCallback] = useState<(value: boolean) => void>(() => {});

  const confirm = useCallback((confirmOptions: ConfirmOptions) => {
    setOptions(confirmOptions);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolveCallback(() => resolve);
    });
  }, []);

  const handleCancel = () => {
    setIsOpen(false);
    resolveCallback(false);
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolveCallback(true);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-10000 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={handleCancel}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white dark:bg-neutral-900 rounded-4xl shadow-2xl w-full max-w-md border border-white/20 dark:border-neutral-800 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            <div className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg ${
                  options.type === 'danger' 
                    ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10' 
                    : options.type === 'warning'
                    ? 'bg-amber-50 text-amber-500 dark:bg-amber-500/10'
                    : 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10'
                }`}>
                  {options.type === 'danger' ? (
                    <AlertTriangle className="w-10 h-10" />
                  ) : options.type === 'warning' ? (
                    <AlertTriangle className="w-10 h-10" />
                  ) : (
                    <AlertCircle className="w-10 h-10" />
                  )}
                </div>
                
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tight">
                  {options.title}
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                  {options.message}
                </p>
              </div>

              <div className="mt-10 flex flex-col gap-3">
                <button
                  onClick={handleConfirm}
                  className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-[0.98] ${
                    options.type === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
                      : options.type === 'warning'
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                  }`}
                >
                  {options.confirmText || 'Yes, proceed'}
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full py-4 rounded-2xl font-bold text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-[0.98]"
                >
                  {options.cancelText || 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (context === undefined) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
}
