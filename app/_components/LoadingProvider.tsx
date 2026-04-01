"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadingState } from '../lib/loading-state';

interface LoadingContextType {
  setIsLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to the global loading singleton
    return loadingState.subscribe((state) => {
      setIsLoading(state);
    });
  }, []);

  const value = {
    setIsLoading: (loading: boolean) => loadingState.setIsLoading(loading)
  };

  return (
    <LoadingContext.Provider value={value}>
      {isLoading && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center pointer-events-none overflow-hidden select-none">
          {/* Subtle backdrop */}
          <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[2px]" />
          
          {/* Modern loader container */}
          <div className="relative group">
            {/* Soft glow effect */}
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150 animate-pulse duration-500" />
            
            <div className="relative flex flex-col items-center gap-4">
              {/* Main Spinner - Modern Ring with Gap */}
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin shadow-indigo-500/20 shadow-lg" />
                {/* Inner small ring for complexity */}
                <div className="absolute inset-2 border-2 border-transparent border-b-sky-400 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
              </div>
              
              {/* Optional: Nice text under loader */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase animate-pulse">
                  Processing
                </span>
                <span className="flex">
                  <span className="animate-bounce delay-0 text-indigo-600">.</span>
                  <span className="animate-bounce delay-150 text-indigo-600">.</span>
                  <span className="animate-bounce delay-300 text-indigo-600">.</span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Top progress bar for extra "loading" feel */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-100 dark:bg-indigo-950/30 overflow-hidden">
            <div className="h-full bg-linear-to-r from-indigo-500 via-sky-500 to-indigo-500 w-[40%] animate-[progress_1.5s_ease-in-out_infinite]" 
                 style={{ 
                   boxShadow: '0 0 10px rgba(79, 70, 229, 0.5)',
                   backgroundSize: '200% 100%' 
                 }} 
            />
          </div>
          
          <style jsx>{`
            @keyframes progress {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(250%); }
            }
          `}</style>
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
