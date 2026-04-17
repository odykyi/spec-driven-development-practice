import Link from 'next/link';
import * as fs from 'fs/promises';
import * as path from 'path';
import yaml from 'yaml';

interface Exercise {
  id: string;
  name: string;
  difficulty: string;
}

async function getTrackExercises(trackId: string): Promise<Exercise[]> {
  try {
    const trackPath = path.join(process.cwd(), '..', '..', 'tracks', `${trackId}.yml`);
    const content = await fs.readFile(trackPath, 'utf-8');
    const track = yaml.parse(content);
    
    const exercises: Exercise[] = [];
    for (const exerciseId of track.exercises || []) {
      try {
        const configPath = path.join(
          process.cwd(), 
          '..', 
          '..', 
          'exercises', 
          exerciseId, 
          '.meta', 
          'config.yml'
        );
        const configContent = await fs.readFile(configPath, 'utf-8');
        const config = yaml.parse(configContent);
        exercises.push({
          id: exerciseId,
          name: config.name,
          difficulty: config.difficulty,
        });
      } catch {
        // Skip exercises that can't be loaded
      }
    }
    
    return exercises;
  } catch {
    return [];
  }
}

export default async function TrackPage({ params }: { params: { id: string } }) {
  const exercises = await getTrackExercises(params.id);

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
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
          </div>
        </nav>

        <Link 
          href="/tracks" 
          className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
        >
          ← Back to tracks
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2 capitalize">{params.id}</h1>
        <p className="text-slate-600 mb-8">
          Complete these exercises in order to master {params.id} concepts.
        </p>

        {exercises.length === 0 ? (
          <div className="bg-white p-8 rounded-xl text-center">
            <p className="text-slate-600">No exercises available in this track yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise, index) => (
              <Link
                key={exercise.id}
                href={`/exercise/${exercise.id}`}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{exercise.name}</h2>
                    <p className="text-sm text-slate-500 capitalize">{exercise.difficulty}</p>
                  </div>
                </div>
                <span className="text-blue-600 font-medium">Start →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
