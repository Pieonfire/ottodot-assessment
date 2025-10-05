import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabaseClient'
import { GEMINI_API_URL } from '../../../lib/constants'

// Helper: Call Gemini to generate a math problem
async function generateMathProblem() {
  const prompt = `Generate a Primary 5 Singapore math word problem involving whole numbers. 
                  Reply ONLY in this JSON format: {"problem_text": "...", "final_answer": ...}`;
  const aiRes = await fetch(GEMINI_API_URL, {
    method: 'POST',
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    headers: { 'Content-Type': 'application/json' },
  });

  const aiData = await aiRes.json();
  const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) throw new Error('AI did not return JSON');

  return JSON.parse(jsonMatch[0]);
}

export async function POST(req: NextRequest) {
  try {
    // 1. Generate problem using Gemini
    const { problem_text, final_answer } = await generateMathProblem();

    // 2. Save to Supabase
    const { data: session, error } = await supabase
      .from('math_problem_sessions')
      .insert({ problem_text, correct_answer: final_answer })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save problem' }, { status: 500 });
    }

    return NextResponse.json({
      problem_text,
      final_answer,
      session_id: session.id,
    });
  } catch (err) {
    console.error('Error generating problem:', err);
    return NextResponse.json({ error: 'Failed to generate problem' }, { status: 500 });
  }
}