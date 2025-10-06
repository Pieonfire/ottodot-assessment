'use client'

import { useState } from 'react'

interface MathProblem {
  problem_text: string
  final_answer: number
}

type ErrorType =
  | 'network'
  | 'timeout'
  | 'server'
  | 'unknown'
  | 'none'

export default function Home() {
  const [showDialog, setShowDialog] = useState(false)
  const [problem, setProblem] = useState<MathProblem | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [errorType, setErrorType] = useState<ErrorType>('none')
  const [lastAction, setLastAction] = useState<'generate' | 'submit' | null>(null)
  const [lastPayload, setLastPayload] = useState<any>(null)
  const shouldShowDialog = problem && (isCorrect === null || isCorrect === false)

  // Handle generate button click
  const handleGenerateClick = () => {
    if (shouldShowDialog) {
      setShowDialog(true)
    } else {
      generateProblem()
    }
  }

  // Handle dialog confirm/cancel
  const handleDialogConfirm = () => {
    setShowDialog(false)
    generateProblem()
  }

  const handleDialogCancel = () => {
    setShowDialog(false)
  }

  // Return error if timeout after 1 min
  async function fetchWithTimeout(resource: RequestInfo, options: RequestInit = {}, timeout = 120000) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(resource, { ...options, signal: controller.signal })
      clearTimeout(id)
      return response
    } catch (error: any) {
      clearTimeout(id)
      if (error.name === 'AbortError') throw new Error('timeout')
      throw error
    }
  }

  const generateProblem = async () => {
    setIsGenerating(true)
    setFeedback('')
    setIsCorrect(null)
    setUserAnswer('')
    setErrorType('none')
    setLastAction('generate')
    setLastPayload(null)

    try {
      const res = await fetchWithTimeout('/api/math-problem', { method: 'POST' }, 120000)
      if (!res.ok) {
        setErrorType('server')
        throw new Error('Server error')
      }

      const data = await res.json()
      if (data.error) {
        setErrorType('server')
        throw new Error(data.error)
      }

      setProblem({ problem_text: data.problem_text, final_answer: data.final_answer })
      setSessionId(data.session_id)
    } catch (err: any) {
      if (err.message === 'timeout') {
        setFeedback('The server is taking too long to respond. Please try again.')
        setErrorType('timeout')
      } else if (err.message === 'Failed to fetch') {
        setFeedback('Network error. Please check your connection and try again.')
        setErrorType('network')
      } else if (err.message) {
        setFeedback(`Error: ${err.message}`)
        setErrorType('server')
      } else {
        setFeedback('An unknown error occurred. Please try again.')
        setErrorType('unknown')
      }
      setProblem(null)
      setSessionId(null)
    }
    setIsGenerating(false)
  }

  const submitAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!sessionId) return
    setIsSubmitting(true)
    setFeedback('')
    setIsCorrect(null)
    setErrorType('none')
    setLastAction('submit')
    setLastPayload({ session_id: sessionId, user_answer: Number(userAnswer) })

    try {
      const res = await fetchWithTimeout('/api/math-problem/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_answer: Number(userAnswer),
        }),
      }, 120000)
      if (!res.ok) {
        setErrorType('server')
        throw new Error('Server error')
      }

      const data = await res.json()
      if (data.error) {
        setErrorType('server')
        throw new Error(data.error)
      }

      setFeedback(data.feedback_text)
      setIsCorrect(data.is_correct)
    } catch (err: any) {
      if (err.message === 'timeout') {
        setFeedback('The server is taking too long to respond. Please try again.')
        setErrorType('timeout')
      } else if (err.message === 'Failed to fetch') {
        setFeedback('Network error. Please check your connection and try again.')
        setErrorType('network')
      } else if (err.message) {
        setFeedback(`Error: ${err.message}`)
        setErrorType('server')
      } else {
        setFeedback('An unknown error occurred. Please try again.')
        setErrorType('unknown')
      }
      setIsCorrect(null)
    }
    setIsSubmitting(false)
  }

  // Retry logic
  const handleRetry = () => {
    if (lastAction === 'generate') {
      generateProblem()
    } else if (lastAction === 'submit' && lastPayload) {
      submitAnswer()
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
      <main className="w-full flex items-center justify-center">
        <div className="bg-white rounded-3xl border-4 border-[#bae6fd] shadow-2xl max-w-md w-full mx-auto p-8 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-extrabold text-center mb-2 text-black drop-shadow">
            Math Problem Generator
          </h1>
          <p className="text-base text-center text-[#334155] mb-4">
            Practice Primary 5 math questions!
          </p>
          <button
            onClick={handleGenerateClick}
            disabled={isGenerating || isSubmitting}
            className="rounded-full px-6 py-3 font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 transition mb-4 w-full"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-white mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span className="animate-pulse">Generating...</span>
              </span>
            ) : 'Generate New Problem'}
          </button>

          {problem && (
            <div className="w-full flex flex-col items-center">
              <h2 className="text-lg font-semibold mb-2 text-[#0e7490] text-center">Problem:</h2>
              <p className="text-base text-[#334155] leading-relaxed mb-4 font-medium text-center">
                {problem.problem_text}
              </p>
              <form onSubmit={submitAnswer} className="space-y-4 w-full flex flex-col items-center">
                <div className="w-full">
                  <label htmlFor="answer" className="block text-base font-semibold text-[#0e7490] mb-2 text-center">
                    Your Answer:
                  </label>
                  <input
                    type="number"
                    id="answer"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#bae6fd] rounded-2xl focus:ring-2 focus:ring-[#38bdf8] focus:border-transparent text-lg text-center"
                    placeholder="Enter your answer"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!userAnswer || isSubmitting}
                  className="rounded-full px-6 py-3 font-semibold text-white bg-green-500 hover:bg-green-600 disabled:bg-gray-300 transition w-full"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      <span className="animate-pulse">Checking...</span>
                    </span>
                  ) : 'Submit Answer'}
                </button>
              </form>
            </div>
          )}

          {/* Dialog Box */}
          {showDialog && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <div className="bg-white rounded-2xl shadow-lg p-6 max-w-xs w-full flex flex-col items-center border-2 border-blue-200">
                <p className="text-center text-lg font-semibold mb-4 text-blue-700">
                  Are you sure? Try to solve this question before moving on.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handleDialogConfirm}
                    className="rounded-full px-4 py-2 font-semibold text-white bg-blue-500 hover:bg-blue-600 transition"
                  >
                    Yes, skip
                  </button>
                  <button
                    onClick={handleDialogCancel}
                    className="rounded-full px-4 py-2 font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 transition"
                  >
                    No, I can do this!
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback on Question */}
          {feedback && !feedback.startsWith('Error') && errorType === 'none' && (
            <div className={`rounded-2xl shadow p-4 transition-all border-2 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} mt-4 w-full`}>
              <h2 className={`text-lg font-bold mb-2 ${isCorrect ? 'text-green-700' : 'text-yellow-700'}`}>
                {isCorrect ? '🎉 Correct!' : '🤔 Not quite right'}
              </h2>
              <p className="text-[#334155] text-base leading-relaxed">{feedback}</p>
            </div>
          )}

          {/* Error Message with Retry */}
          {errorType !== 'none' && (
            <div className="rounded-2xl shadow p-4 bg-red-50 border-2 border-red-200 mt-4 w-full flex flex-col items-center">
              <h2 className="text-lg font-bold mb-2 text-red-700">Oops!</h2>
              <p className="text-red-700 text-base mb-4">{feedback}</p>
              <button
                onClick={handleRetry}
                className="rounded-full px-6 py-2 font-semibold text-white bg-red-500 hover:bg-red-600 transition"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}