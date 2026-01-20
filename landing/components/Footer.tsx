'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Footer() {

  const footerLinks = [
    { label: 'Security', href: '/security' },
    { label: 'Roadmap', href: '/roadmap' },
    { label: 'FAQ', href: '/faq' },
    { label: 'About', href: '/about' },
    { label: 'Get in Touch', href: '/contact' },
    { label: 'Docs', href: 'https://docs.kielswap.com', external: true },
  ]

  return (
    <footer className="relative z-10 px-6 md:px-12 py-16 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        {/* Footer Links */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          {footerLinks.map((link) => (
            <motion.div
              key={link.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {link.external ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white text-sm font-light transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  href={link.href}
                  className="text-gray-400 hover:text-white text-sm font-light transition-colors"
                >
                  {link.label}
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            © 2026 Kielswap. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

