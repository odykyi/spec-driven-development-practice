'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface ExerciseData {
  id: string;
  name: string;
  track: string;
  difficulty: string;
  readme: string;
  hints: string[];
}

export default function ExercisePage() {
  const params = useParams();
  const exerciseId = params.id as string;
  
  const [exercise, setExercise] = useState<ExerciseData | null>(null);
  const [specification, setSpecification] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState<'instructions' | 'editor'>('instructions');

  useEffect(() => {
    fetch(`/api/exercises/${exerciseId}`)
      .then(res => res.json())
      .then(data => {
        setExercise(data);
        // Set starter template
        setSpecification(`# ${data.name}

## ADDED Requirements

### Requirement: <!-- requirement name -->
<!-- Describe what the system SHALL do -->

#### Scenario: <!-- scenario name -->
- **WHEN** <!-- action or condition -->
- **THEN** <!-- expected outcome -->
`);
      })
      .catch(console.error);
  }, [exerciseId]);

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId, specification }),
      });
      const result = await res.json();
      setValidationResult(result);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  if (!exercise) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-slate-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <nav className="flex justify-between items-center mb-4">
          <Link href="/" className="text-xl font-bold text-slate-900">
            SDD Training
          </Link>
          <div className="space-x-4">
            <Link href={`/tracks/${exercise.track}`} className="text-slate-600 hover:text-slate-900">
              ← Back to track
            </Link>
          </div>
        </nav>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('instructions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'instructions'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Instructions
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'editor'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Editor
          </button>
        </div>

        {activeTab === 'instructions' ? (
          <div className="bg-white rounded-xl shadow-sm p-8 prose prose-slate max-w-none">
            <div dangerouslySetInnerHTML={{ 
              __html: exercise.readme
                .replace(/# (.*)/, '<h1 class="text-3xl font-bold mb-4">$1</h1>')
                .replace(/## (.*)/, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/```markdown\n([\s\S]*?)```/g, '<pre class="bg-slate-100 p-4 rounded-lg overflow-x-auto"><code>$1</code></pre>')
                .replace(/- (.*)/g, '<li class="ml-4">$1</li>')
                .replace(/\n/g, '<br/>')
            }} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 border-b flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">spec.md</span>
                <button
                  onClick={handleValidate}
                  disabled={isValidating}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isValidating ? 'Validating...' : 'Validate'}
                </button>
              </div>
              <textarea
                value={specification}
                onChange={(e) => setSpecification(e.target.value)}
                className="w-full h-96 p-4 font-mono text-sm resize-none focus:outline-none"
                placeholder="Write your specification here..."
              />
            </div>

            {validationResult && (
              <div className={`rounded-xl p-4 ${
                validationResult.status === 'pass' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <h3 className={`font-semibold mb-2 ${
                  validationResult.status === 'pass' ? 'text-green-800' : 'text-red-800'
                }`}>
                  Validation {validationResult.status === 'pass' ? 'Passed ✅' : 'Failed ❌'}
                </h3>
                <p className="text-sm text-slate-600 mb-2">
                  {validationResult.summary.passed}/{validationResult.summary.total} checks passed
                </p>
                <div className="space-y-1">
                  {validationResult.checks.map((check: any) => (
                    <div key={check.id} className="text-sm">
                      <span className={
                        check.status === 'pass' ? 'text-green-600' : 
                        check.status === 'fail' ? 'text-red-600' : 'text-yellow-600'
                      }>
                        {check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '⚠'}
                      </span>
                      <span className="ml-2 text-slate-700">{check.name}: {check.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {exercise.hints.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Hints</h3>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  {exercise.hints.map((hint, i) => (
                    <li key={i}>{hint}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
