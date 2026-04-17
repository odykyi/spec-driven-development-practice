import Link from 'next/link';

const tracks = [
  {
    id: 'basics',
    name: 'Basics',
    description: 'Learn the fundamentals of specification writing',
    difficulty: 'Beginner',
    exercises: 3,
    color: 'bg-green-100 text-green-800',
  },
  {
    id: 'patterns',
    name: 'Patterns',
    description: 'Common patterns for complex systems',
    difficulty: 'Intermediate',
    exercises: 1,
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Complex multi-step flows and real-world scenarios',
    difficulty: 'Advanced',
    exercises: 1,
    color: 'bg-red-100 text-red-800',
  },
];

export default function TracksPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <nav className="flex justify-between items-center mb-8">
          <Link href="/" className="text-2xl font-bold text-slate-900">
            SDD Training
          </Link>
          <Link 
            href="/dashboard" 
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            Dashboard
          </Link>
        </nav>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">Learning Tracks</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.map((track) => (
            <Link
              key={track.id}
              href={`/tracks/${track.id}`}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-slate-900">{track.name}</h2>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${track.color}`}>
                  {track.difficulty}
                </span>
              </div>
              <p className="text-slate-600 mb-4">{track.description}</p>
              <p className="text-sm text-slate-500">{track.exercises} exercises</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
