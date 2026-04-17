import { NextResponse } from 'next/server';
import { ExerciseLoader } from '@sdd-training/core';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const exercisesPath = path.join(process.cwd(), '..', '..', 'exercises');
    const loader = new ExerciseLoader(exercisesPath);
    const exercise = await loader.loadExercise(params.id);
    
    return NextResponse.json({
      id: exercise.id,
      name: exercise.config.name,
      track: exercise.config.track,
      difficulty: exercise.config.difficulty,
      readme: exercise.readme,
      hints: exercise.config.hints || [],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
  }
}
