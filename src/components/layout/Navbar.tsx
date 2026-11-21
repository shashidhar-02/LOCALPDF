'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Wifi, WifiOff, Trash2, Github, Menu, X, ChevronDown } from 'lucide-react';
import { TOOLS } from '@/lib/tools-data';
import { objectUrls } from '@/lib/object-url';

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold shadow-sm group-hover:bg-sky-700 transition">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-sky-600 transition">
                  LocalPDF
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 -mt-1">
                  100% Device-Only
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
            {/* Tools Menu */}
            <div className="relative">
              <button
                onClick={() => setToolsDropdown(!toolsDropdown)}
                onBlur={() => setTimeout(() => setToolsDropdown(false), 200)}
                className="flex items-center space-x-1 hover:text-slate-900 transition py-2"
                aria-expanded={toolsDropdown}
              >
                <span>Tools</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {toolsDropdown && (
                <div className="absolute top-full -left-20 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 grid grid-cols-1 divide-y divide-slate-100 max-h-[80vh] overflow-y-auto">
                  <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-50">
                    All Browser Tools
                  </div>
                  {TOOLS.map((tool) => (
                    <Link
                      key={tool.id}
                      href={`/${tool.slug}`}
                      className="px-4 py-2.5 hover:bg-sky-50 flex items-center justify-between transition group"
                      onClick={() => setToolsDropdown(false)}
                    >
                      <div>
                        <div className="font-semibold text-slate-800 text-sm group-hover:text-sky-600">
                          {tool.shortTitle}
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-1">
                          {tool.tagline}
                        </div>
                      </div>
                      {tool.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                          {tool.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/privacy" className="hover:text-slate-900 transition">
              Privacy
            </Link>
            <Link href="/architecture" className="hover:text-slate-900 transition">
              Architecture
            </Link>
            <Link href="/benchmarks" className="hover:text-slate-900 transition">
              Benchmarks
            </Link>
            <Link href="/guides" className="hover:text-slate-900 transition">
              Guides
            </Link>
          </nav>

          {/* Right Action Icons & Status */}
          <div className="flex items-center space-x-3">
            {/* Online / Offline status badge */}
            <div
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
              title={isOnline ? 'Online (Cached for offline)' : 'Working offline (No internet needed)'}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Offline Ready</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>Offline Mode</span>
                </>
              )}
            </div>

            {/* Clear local memory button */}
            <button
              onClick={handleClearCache}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Clear cached documents from memory"
              aria-label="Clear cached documents"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* GitHub Link */}
            <a
              href="https://github.com/shashidharmushike/localpdf"
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              title="View on GitHub"
            >
              <Github className="w-5 h-5" />
            </a>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Cleared Toast */}
      {clearedToast && (
        <div className="absolute top-16 right-4 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Local memory cleared. All buffers revoked.</span>
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tools
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TOOLS.slice(0, 8).map((tool) => (
              <Link
                key={tool.id}
                href={`/${tool.slug}`}
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg border border-slate-100 bg-slate-50 text-xs font-medium text-slate-800 hover:bg-sky-50 hover:text-sky-700"
              >
                {tool.shortTitle}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3 flex flex-col space-y-2 text-sm font-medium text-slate-700">
            <Link href="/privacy" onClick={() => setMenuOpen(false)} className="py-1">
              Privacy Policy & Proof
            </Link>
            <Link href="/architecture" onClick={() => setMenuOpen(false)} className="py-1">
              Architecture & Security
            </Link>
            <Link href="/benchmarks" onClick={() => setMenuOpen(false)} className="py-1">
              Performance Benchmarks
            </Link>
            <Link href="/guides" onClick={() => setMenuOpen(false)} className="py-1">
              Troubleshooting & Guides
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
