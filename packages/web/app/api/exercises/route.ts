import { NextResponse } from 'next/server';
import { ExerciseLoader } from '@sdd-training/core';
import path from 'path';

export async function GET() {
  try {
    const exercisesPath = path.join(process.cwd(), '..', '..', 'exercises');
    const loader = new ExerciseLoader(exercisesPath);
    const exercises = await loader.listExercises();
    
    const exerciseDetails = await Promise.all(
      exercises.map(async (id) => {
        try {
          const exercise = await loader.loadExercise(id);
          return {
            id,
            name: exercise.config.name,
            track: exercise.config.track,
            difficulty: exercise.config.difficulty,
          };
        } catch {
          return null;
        }
      })
    );
    
    return NextResponse.json(exerciseDetails.filter(Boolean));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load exercises' }, { status: 500 });
  }
}
