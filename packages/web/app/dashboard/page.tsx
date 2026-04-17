import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <nav className="flex justify-between items-center mb-8">
          <Link href="/" className="text-2xl font-bold text-slate-900">
            SDD Training
          </Link>
          <div className="space-x-4">
            <Link href="/tracks" className="text-slate-600 hover:text-slate-900">
              Tracks
            </Link>
            <span className="text-slate-900 font-medium">Dashboard</span>
          </div>
        </nav>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">Your Progress</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-slate-500 text-sm mb-1">Exercises Completed</p>
            <p className="text-3xl font-bold text-slate-900">0</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-slate-500 text-sm mb-1">Current Streak</p>
            <p className="text-3xl font-bold text-slate-900">0 days</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-slate-500 text-sm mb-1">Tracks Started</p>
            <p className="text-3xl font-bold text-slate-900">0</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Getting Started</h2>
          <p className="text-slate-600 mb-6">
            You haven&apos;t completed any exercises yet. Start your journey by working through 
            the Basics track!
          </p>
          <Link
            href="/tracks/basics"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Basics Track
          </Link>
        </div>
      </div>
    </main>
  );
}
