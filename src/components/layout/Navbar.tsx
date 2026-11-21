'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Wifi,
  WifiOff,
  Trash2,
  Github,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';
import { TOOLS } from '@/lib/tools-data';
import { objectUrls } from '@/lib/object-url';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const [isOnline, setIsOnline] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsDropdown, setToolsDropdown] = useState(false);
  const [clearedToast, setClearedToast] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register Service Worker for offline PWA
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration error:', err);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleClearCache = () => {
    objectUrls.revokeAll();
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name !== 'localpdf-v1') caches.delete(name);
        });
      });
    }
    setClearedToast(true);
    setTimeout(() => setClearedToast(false), 2500);
  };

  return (
    <div className="sticky top-0 z-40 flex flex-col">
      {/* Top Banner (Above Address/Header) */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white text-[11px] sm:text-xs py-1.5 px-4 text-center font-medium border-b border-slate-800 flex items-center justify-center gap-1.5 sm:gap-3">
        <span className="flex items-center space-x-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <strong className="text-emerald-400 font-bold">100% Client-Side Privacy:</strong>
          <span className="text-slate-300 hidden sm:inline">
            Your PDF never leaves your device • No server uploads • No watermarks • No subscription
          </span>
          <span className="text-slate-300 sm:hidden">
            Your PDF stays on your device
          </span>
        </span>
        <Link
          href="/edit-pdf"
          className="inline-flex items-center space-x-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30 font-semibold transition text-[10px] sm:text-[11px]"
        >
          <span>Try Edit PDF</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Main Navbar Header */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo */}
            <div className="flex items-center space-x-3 shrink-0">
              <Link href="/" className="flex items-center space-x-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition">
                    LocalPDF
                  </span>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 -mt-1">
                    100% Device-Only
                  </span>
                </div>
              </Link>
            </div>

            {/* Global Search Bar */}
            <div className="hidden sm:block flex-1 max-w-xs md:max-w-sm mx-2">
              <SearchBar />
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center space-x-5 text-sm font-medium text-slate-600 dark:text-slate-300">
              {/* Tools Dropdown Menu */}
              <div className="relative">
                <button
                  onClick={() => setToolsDropdown(!toolsDropdown)}
                  onBlur={() => setTimeout(() => setToolsDropdown(false), 200)}
                  className="flex items-center space-x-1 hover:text-slate-900 dark:hover:text-white transition py-2"
                  aria-expanded={toolsDropdown}
                >
                  <span>Tools</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {toolsDropdown && (
                  <div className="absolute top-full -left-20 w-84 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800 max-h-[80vh] overflow-y-auto">
                    <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                      <span>All Browser Tools</span>
                      <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">
                        {TOOLS.length} Tools
                      </span>
                    </div>
                    {TOOLS.map((tool) => (
                      <Link
                        key={tool.id}
                        href={`/${tool.slug}`}
                        className="px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-slate-800 flex items-center justify-between transition group"
                        onClick={() => setToolsDropdown(false)}
                      >
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm group-hover:text-sky-600 dark:group-hover:text-sky-400">
                            {tool.shortTitle}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                            {tool.tagline}
                          </div>
                        </div>
                        {tool.badge && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                            {tool.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/edit-pdf"
                className="text-sky-600 dark:text-sky-400 font-bold hover:text-sky-700 dark:hover:text-sky-300 transition flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Edit PDF</span>
              </Link>
              <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition">
                Privacy
              </Link>
              <Link href="/architecture" className="hover:text-slate-900 dark:hover:text-white transition">
                Architecture
              </Link>
              <Link href="/guides" className="hover:text-slate-900 dark:hover:text-white transition">
                Guides
              </Link>
            </nav>

            {/* Right Action Icons & Status */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Online / Offline status badge */}
              <div
                className={`hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isOnline
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                }`}
                title={isOnline ? 'Online (Cached for offline)' : 'Working offline (No internet needed)'}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Offline Ready</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Offline Mode</span>
                  </>
                )}
              </div>

              {/* Light / Dark Mode Toggle */}
              <ThemeToggle />

              {/* Clear local memory button */}
              <button
                onClick={handleClearCache}
                className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
                title="Clear cached documents from memory"
                aria-label="Clear cached documents"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* GitHub Link */}
              <a
                href="https://github.com/shashidhar-02/LOCALPDF"
                target="_blank"
                rel="noreferrer"
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                title="View on GitHub"
              >
                <Github className="w-5 h-5" />
              </a>

              {/* Mobile menu button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                aria-label="Toggle navigation menu"
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-slate-700 dark:text-slate-200" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar Row */}
          <div className="sm:hidden pb-3">
            <SearchBar />
          </div>
        </div>

        {/* Cleared Toast */}
        {clearedToast && (
          <div className="absolute top-20 right-4 bg-slate-900 text-white text-xs px-3.5 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 z-50 border border-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Local memory cleared. All buffers revoked.</span>
          </div>
        )}

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-4">
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Popular Tools
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TOOLS.slice(0, 10).map((tool) => (
                <Link
                  key={tool.id}
                  href={`/${tool.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700"
                >
                  {tool.shortTitle}
                </Link>
              ))}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-col space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Link href="/edit-pdf" onClick={() => setMenuOpen(false)} className="py-1 text-sky-600 dark:text-sky-400 font-bold">
                Edit PDF (New)
              </Link>
              <Link href="/privacy" onClick={() => setMenuOpen(false)} className="py-1">
                Privacy Policy & Proof
              </Link>
              <Link href="/architecture" onClick={() => setMenuOpen(false)} className="py-1">
                Architecture & Security
              </Link>
              <Link href="/guides" onClick={() => setMenuOpen(false)} className="py-1">
                Troubleshooting & Guides
              </Link>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
