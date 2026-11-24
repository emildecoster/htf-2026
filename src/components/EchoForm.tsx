import { useState } from 'react'
import { createEcho } from '#/lib/echo.functions.ts'

type EchoFormProps = {
  glitchId?: string
  onSuccess?: (result: { echoId: string; glitchId: string }) => void
}

export function EchoForm({ glitchId, onSuccess }: EchoFormProps) {
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedDescription = description.trim()

    if (!trimmedDescription || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createEcho({
        data: {
          description: trimmedDescription,
          glitchId,
        },
      })

      setDescription('')
      onSuccess?.(result)
    } catch (error) {
      console.error('Failed to report echo:', error)
      setError('Something went wrong while reporting the echo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="echo-form">
      <label htmlFor="echo-description" className="echo-form-label">
        Description
      </label>

      <textarea
        id="echo-description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Describe what you observed..."
        rows={4}
        required
        maxLength={2000}
        disabled={isSubmitting}
        className="echo-form-textarea"
      />

      {error && (
        <p role="alert" className="echo-form-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !description.trim()}
        className="echo-form-submit"
      >
        {isSubmitting ? 'Reporting...' : 'Report Echo'}
      </button>
    </form>
  )
}
