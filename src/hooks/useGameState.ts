import { useState, useEffect } from 'react'

interface GameState {
  question: string
  category: string
  difficulty: string
  hint: string
}

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCurrentGameState = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Fetch current question
      const questionResponse = await fetch('/current_question')
      let questionData = null
      
      if (questionResponse.ok) {
        questionData = await questionResponse.json()
      }
      
      // Fetch current hint
      const hintResponse = await fetch('/current_hint')
      let hintData = null
      
      if (hintResponse.ok) {
        hintData = await hintResponse.json()
      }
      
      if (questionData) {
        setGameState({
          question: questionData.question,
          category: questionData.category,
          difficulty: questionData.difficulty,
          hint: hintData?.hint || ''
        })
      }
    } catch (err) {
      setError('Failed to fetch game state')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrentGameState()
  }, [])

  return {
    gameState,
    isLoading,
    error,
    refetch: fetchCurrentGameState
  }
}
