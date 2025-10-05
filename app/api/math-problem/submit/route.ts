import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabaseClient'
import { GEMINI_API_URL } from '../../../../lib/constants'

// Helper: Call Gemini to generate feedback
async function generateFeedback(problem: string, correct: number, user: number) {
  const prompt = `A student answered this math problem: "${problem}". The correct answer is ${correct}. The student's answer was ${user}. Give helpful feedback.`;
  const aiRes = await fetch(GEMINI_API_URL, {
    method: 'POST',
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    headers: { 'Content-Type': 'application/json' },
  });

  const aiData = await aiRes.json();

  return aiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Good try!';
}

export async function POST(req: NextRequest) {
  const { session_id, user_answer } = await req.json();
  // 1. Fetch problem from Supabase
  const { data: session, error } = await supabase
    .from('math_problem_sessions')
    .select('*')
    .eq('id', session_id)
    .single();

  if (error || !session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const is_correct = Number(user_answer) === session.correct_answer;

  // 2. Generate feedback using Gemini
  const feedback_text = await generateFeedback(
    session.problem_text,
    session.correct_answer,
    user_answer
  );

  // 3. Save submission
  await supabase.from('math_problem_submissions').insert({
    session_id,
    user_answer,
    is_correct,
    feedback_text,
  });

  return NextResponse.json({ is_correct, feedback_text });
}