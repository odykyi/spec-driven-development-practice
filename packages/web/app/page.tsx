import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-bold text-slate-900">SDD Training</h1>
          <div className="space-x-4">
            <Link 
              href="/tracks" 
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              Tracks
            </Link>
            <Link 
              href="/dashboard" 
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </nav>

        <div className="text-center py-20">
          <h2 className="text-5xl font-bold text-slate-900 mb-6">
            Master Spec-Driven Development
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Learn to write effective specifications and prompts for AI-assisted development. 
            Practice with hands-on exercises and get immediate feedback.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/tracks"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Tracks
            </Link>
            <Link
              href="/exercise/basics/hello-world"
              className="bg-white text-slate-700 border border-slate-300 px-6 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
            >
              Start First Exercise
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Progressive Learning</h3>
            <p className="text-slate-600">
              Start with basics and work your way up to advanced patterns through structured tracks.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Instant Feedback</h3>
            <p className="text-slate-600">
              Get immediate validation on your specifications with detailed error messages.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Learn by Doing</h3>
            <p className="text-slate-600">
              Practice with real-world scenarios and build skills through hands-on exercises.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
