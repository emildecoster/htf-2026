import { useEffect, useState } from 'react'

type AuthenticatedImageProps = {
  attachmentId: string
  alt: string
  className?: string
}

export function AuthenticatedImage({
  attachmentId,
  alt,
  className,
}: AuthenticatedImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let objectUrl: string | undefined

    async function loadImage() {
      try {
        const response = await fetch(
          `/api/echo-attachments/${attachmentId}`,
          {
            signal: controller.signal,
            credentials: 'same-origin',
          },
        )

        if (!response.ok) {
          throw new Error(`Image request failed: ${response.status}`)
        }

        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)

        setImageUrl(objectUrl)
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Failed to load image:', error)
          setFailed(true)
        }
      }
    }

    void loadImage()

    return () => {
      controller.abort()

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [attachmentId])

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`Unable to load ${alt}`}
        className={`${className ?? ''} flex items-center justify-center bg-subtle text-xs text-muted`}
      >
        Image unavailable
      </div>
    )
  }

  if (!imageUrl) {
    return (
      <div
        aria-label={`Loading ${alt}`}
        className={`${className ?? ''} animate-pulse bg-subtle`}
      />
    )
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
    />
  )
}
