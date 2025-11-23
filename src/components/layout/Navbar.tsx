import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass-card mb-8">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img src="/snowflake-logo.png" alt="Crystal Logo" className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold gradient-text">Crystal</h1>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/')
                  ? 'bg-blue-electric text-white'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/linkedin"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                isActive('/linkedin')
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              LinkedIn
            </Link>
            <Link
              to="/stepstone"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                isActive('/stepstone')
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Stepstone
            </Link>
            <Link
              to="/settings"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/settings')
                  ? 'bg-blue-electric text-white'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
