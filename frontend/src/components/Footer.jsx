import React from 'react';
import Logo from './Logo';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer({ onOpenAuth }) {


  const handleSmoothScroll = (e, href) => {
    e.preventDefault();
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        const navHeight = 72;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - navHeight,
          behavior: 'smooth',
        });
      }
    }
  };

  return (
    <footer id="about" className="bg-white border-t border-slate-200 pt-16 pb-12 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 pb-12 border-b border-slate-100">
          
          {/* Brand Column (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-block focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-lg"
              aria-label="TASKORA Home"
            >
              <Logo size="md" />
            </a>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              TASKORA helps teams organize projects, manage tasks, collaborate efficiently, and track progress through a unified workspace.
            </p>
            <div className="pt-2 text-xs text-slate-400">
              Official Tagline: <br />
              <span className="font-semibold text-slate-600">&ldquo;Plan Better. Work Smarter. Achieve More.&rdquo;</span>
            </div>
          </div>

          {/* Column 1: PRODUCT */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleSmoothScroll(e, '#features')}
                  className="hover:text-blue-600 transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => handleSmoothScroll(e, '#how-it-works')}
                  className="hover:text-blue-600 transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleSmoothScroll(e, '#features')}
                  className="hover:text-blue-600 transition-colors"
                >
                  Project Management
                </a>
              </li>
              <li>
                <a
                  href="#solutions"
                  onClick={(e) => handleSmoothScroll(e, '#solutions')}
                  className="hover:text-blue-600 transition-colors"
                >
                  Team Collaboration
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: COMPANY */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleSmoothScroll(e, '#about')}
                  className="hover:text-blue-600 transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAuth('contact')}
                  className="text-left hover:text-blue-600 transition-colors"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: RESOURCES */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAuth('docs')}
                  className="text-left hover:text-blue-600 transition-colors"
                >
                  Documentation
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAuth('help')}
                  className="text-left hover:text-blue-600 transition-colors"
                >
                  Help Center
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: LEGAL */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAuth('privacy')}
                  className="text-left hover:text-blue-600 transition-colors"
                >
                  Privacy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAuth('terms')}
                  className="text-left hover:text-blue-600 transition-colors"
                >
                  Terms
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {CURRENT_YEAR} TASKORA. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-slate-400">
            <span>Built with React &amp; Tailwind CSS</span>
            <span>Frontend Architecture Edition</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
