'use client';

import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, Bell, Shield, Globe, ChevronDown, LogOut, Menu } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../lib/i18n';
import { api } from '../lib/api';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  activeStore?: any;
  currentStore?: any;
}

export const Header: React.FC<HeaderProps> = ({ title = '', subtitle, children }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { language, setLanguage } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const me = await api.getMe();
        if (me?.user) setCurrentUser(me.user);
      } catch {}
    };
    fetchUser();
  }, []);

  const canSeeWaha = currentUser && ['superadmin', 'admin', 'moderator'].includes(currentUser.role?.toLowerCase());

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇲🇦' },
  ];

  const current = languages.find((l) => l.code === language) || languages[0];

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/75 backdrop-blur-xl px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-40 shadow-sm shadow-black/20">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'));
            }
          }}
          className="lg:hidden p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {title}
          </h1>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Status indicator badge - only for Admin, SuperAdmin, and Moderator */}
        {canSeeWaha && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-950/60 border border-emerald-500/30 rounded-full text-xs text-emerald-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
            <span>WAHA Engine Online</span>
          </div>
        )}

        {/* Language Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white transition-colors"
          >
            <span>{current.flag}</span>
            <span className="hidden sm:inline">{current.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
          </button>

          {langOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    setLangOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-2 ${
                    l.code === language
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {children}

        {/* Quick Logout Button */}
        <button
          title="Sign Out"
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('codflow_token');
              window.location.href = '/login';
            }
          }}
          className="p-2 bg-slate-800/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-xl transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
