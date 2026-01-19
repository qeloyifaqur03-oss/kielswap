'use client'

export default function HistoryPage() {
  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">
      <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 max-w-2xl w-full">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-light text-white mb-4 sm:mb-6">History</h1>
          <p className="text-xs sm:text-sm text-gray-400 font-light">Your transactions will appear here.</p>
        </div>
      </div>
    </section>
  )
}
