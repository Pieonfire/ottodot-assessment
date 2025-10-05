'use client'

import { useState } from 'react'

interface MathProblem {
  problem_text: string
  final_answer: number
}

export default function Home() {
  const [problem, setProblem] = useState<MathProblem | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const generateProblem = async () => {
    setIsLoading(true)
    setFeedback('')
    setIsCorrect(null)
    setUserAnswer('')
    try {
      const res = await fetch('../api/math-problem', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to generate problem')
      const data = await res.json()
      setProblem({ problem_text: data.problem_text, final_answer: data.final_answer })
      setSessionId(data.session_id)
    } catch (err) {
      setFeedback('Error generating problem. Please try again.')
      setProblem(null)
      setSessionId(null)
      console.log(err)
    }
    setIsLoading(false)
  }

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionId) return
    setIsLoading(true)
    setFeedback('')
    setIsCorrect(null)
    try {
      const res = await fetch('/api/math-problem/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_answer: Number(userAnswer),
        }),
      })
      if (!res.ok) throw new Error('Failed to submit answer')
      const data = await res.json()
      setFeedback(data.feedback_text)
      setIsCorrect(data.is_correct)
    } catch (err) {
      setFeedback('Error submitting answer. Please try again.')
      setIsCorrect(null)
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] to-[#f0fdfa] flex flex-col items-center">
      <main className="container mx-auto px-4 py-8 max-w-xl flex-1 flex flex-col justify-center">
        <div className="flex flex-col items-center mb-8">
          {/* Ottodot-style mascot/avatar (optional) */}
          <img src="/ottodot-mascot.png" alt="Mascot" className="w-20 h-20 mb-2" />
          <h1 className="text-4xl font-extrabold text-center mb-2 text-[#0e7490] drop-shadow">
            Math Problem Generator
          </h1>
          <p className="text-lg text-center text-[#334155] mb-2">
            Practice Primary 5 math with instant feedback!
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 transition-all">
          <button
            onClick={generateProblem}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] hover:from-[#0ea5e9] hover:to-[#38bdf8] disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-2xl text-lg transition duration-200 ease-in-out transform hover:scale-105"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Generating...
              </span>
            ) : 'Generate New Problem'}
          </button>
        </div>

        {problem && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 transition-all">
            <h2 className="text-xl font-semibold mb-4 text-[#0e7490]">Problem:</h2>
            <p className="text-lg text-[#334155] leading-relaxed mb-6 font-medium">
              {problem.problem_text}
            </p>
            <form onSubmit={submitAnswer} className="space-y-4">
              <div>
                <label htmlFor="answer" className="block text-base font-semibold text-[#0e7490] mb-2">
                  Your Answer:
                </label>
                <input
                  type="number"
                  id="answer"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[#bae6fd] rounded-2xl focus:ring-2 focus:ring-[#38bdf8] focus:border-transparent text-lg"
                  placeholder="Enter your answer"
                  required
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={!userAnswer || isLoading}
                className="w-full bg-gradient-to-r from-[#34d399] to-[#10b981] hover:from-[#10b981] hover:to-[#34d399] disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-2xl text-lg transition duration-200 ease-in-out transform hover:scale-105"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Checking...
                  </span>
                ) : 'Submit Answer'}
              </button>
            </form>
          </div>
        )}

        // Feedback on Question
        {feedback && (
          <div className={`rounded-3xl shadow-xl p-6 transition-all border-2 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isCorrect ? 'text-green-700' : 'text-yellow-700'}`}>
              {isCorrect ? '🎉 Correct!' : '🤔 Not quite right'}
            </h2>
            <p className="text-[#334155] text-lg leading-relaxed animate-fade-in">{feedback}</p>
          </div>
        )}

        // Error Message
        {feedback && feedback.startsWith('Error') && (
          <div className="rounded-3xl shadow-xl p-6 bg-red-50 border-2 border-red-200 mb-6">
            <h2 className="text-xl font-bold mb-2 text-red-700">Oops!</h2>
            <p className="text-red-700 text-lg">{feedback}</p>
          </div>
        )}
      </main>
    </div>
  )
}