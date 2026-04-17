import { NextResponse } from 'next/server';
import { SpecParser, ValidationEngine, createMemoryCache, ExerciseLoader } from '@sdd-training/core';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { exerciseId, specification } = body;

    if (!exerciseId || !specification) {
      return NextResponse.json(
        { error: 'Missing exerciseId or specification' },
        { status: 400 }
      );
    }

    // Load exercise config
    const exercisesPath = path.join(process.cwd(), '..', '..', 'exercises');
    const loader = new ExerciseLoader(exercisesPath);
    const exercise = await loader.loadExercise(exerciseId);

    // Parse and validate
    const parser = new SpecParser();
    const spec = parser.parse(specification);

    const engine = new ValidationEngine(createMemoryCache());
    const result = engine.validate(spec, {
      exerciseConfig: exercise.config,
      cache: createMemoryCache(),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Validation failed', details: String(error) },
      { status: 500 }
    );
  }
}
