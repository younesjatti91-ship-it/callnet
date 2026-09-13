'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Lock, Mail, User, Building, Phone, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.register({
        name,
        companyName: companyName || `${name} Store`,
        email,
        password,
        phone,
      });
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 items-center justify-center shadow-xl shadow-emerald-500/20 text-slate-950 font-bold mb-2">
            <Sparkles className="w-6 h-6 text-slate-950" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Register as a COD Merchant
          </h1>
          <p className="text-xs text-slate-400">
            Create your multi-tenant store account with automated confirmation & logistics
          </p>
        </div>

        {/* Register Form Panel */}
        <div className="glass-panel-glow p-8 rounded-3xl space-y-5 border border-slate-800">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Youssef El Amrani"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Store / Business Name</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Atlas Elegance Casablanca"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="merchant@yourstore.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">WhatsApp / Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="+212600112233"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all text-xs"
            >
              <span>{loading ? 'Creating store account...' : 'Create Merchant Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-800">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
