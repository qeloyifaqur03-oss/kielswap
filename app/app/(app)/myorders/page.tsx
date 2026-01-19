'use client'

export default function MyOrdersPage() {
  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8">
      <div className="glass rounded-3xl p-12 max-w-2xl w-full">
        <div className="text-center">
          <h1 className="text-2xl font-light text-white mb-6">My Orders</h1>
          <p className="text-sm text-gray-400 font-light">No limit orders yet</p>
        </div>
      </div>
    </section>
  )
}
