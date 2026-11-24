import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'

import { createEcho } from '#/lib/echo.functions.ts'

const MAX_IMAGES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

type SelectedImage = {
  file: File
  previewUrl: string
}

type EchoFormProps = {
  glitchId?: string
  onSuccess?: (result: { echoId: string; glitchId: string }) => void
}

export function EchoForm({ glitchId, onSuccess }: EchoFormProps) {
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<SelectedImage[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const imageUrls = useRef(new Set<string>())

  // Revoke any remaining preview URLs when the component unmounts.
  useEffect(() => {
    return () => {
      for (const url of imageUrls.current) {
        URL.revokeObjectURL(url)
      }
    }
  }, [])

  function handleImageSelection(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFiles = Array.from(event.target.files ?? [])

    // Allow selecting the same file again later.
    event.target.value = ''

    if (selectedFiles.length === 0) {
      return
    }

    if (images.length + selectedFiles.length > MAX_IMAGES) {
      setError(`You can attach a maximum of ${MAX_IMAGES} images.`)
      return
    }

    for (const file of selectedFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Only JPEG, PNG and WebP images are supported.')
        return
      }

      if (file.size === 0 || file.size > MAX_FILE_SIZE) {
        setError('Each image must be between 1 byte and 5 MB.')
        return
      }
    }

    const newImages = selectedFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file)
      imageUrls.current.add(previewUrl)

      return { file, previewUrl }
    })

    setImages((previous) => [...previous, ...newImages])
    setError(null)
  }

  function removeImage(previewUrl: string) {
    URL.revokeObjectURL(previewUrl)
    imageUrls.current.delete(previewUrl)

    setImages((previous) =>
      previous.filter((image) => image.previewUrl !== previewUrl),
    )
  }

  function clearImages() {
    for (const image of images) {
      URL.revokeObjectURL(image.previewUrl)
      imageUrls.current.delete(image.previewUrl)
    }

    setImages([])
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedDescription = description.trim()

    if (!trimmedDescription || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()

      formData.append('description', trimmedDescription)

      if (glitchId) {
        formData.append('glitchId', glitchId)
      }

      for (const image of images) {
        formData.append('images', image.file)
      }

      const result = await createEcho({
        data: formData,
      })

      setDescription('')
      clearImages()
      onSuccess?.(result)
    } catch (error) {
      console.error('Failed to report echo:', error)
      setError('Something went wrong while reporting the echo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label htmlFor="echo-description" className="font-medium">
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
        className="w-full rounded-lg border border-line bg-background p-3 text-fg"
      />

      {/* Image attachments */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="font-medium">
            Attachments
          </label>

          <span className="text-xs text-muted">
            {images.length}/{MAX_IMAGES} images
          </span>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map(({ file, previewUrl }) => (
              <div
                key={previewUrl}
                className="relative overflow-hidden rounded-lg border border-line"
              >
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="aspect-video w-full object-cover"
                />

                <button
                  type="button"
                  onClick={() => removeImage(previewUrl)}
                  disabled={isSubmitting}
                  aria-label={`Remove ${file.name}`}
                  className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white transition-colors hover:bg-black disabled:opacity-50"
                >
                  <X className="size-4" />
                </button>

                <p className="truncate px-2 py-1.5 text-xs text-muted">
                  {file.name}
                </p>
              </div>
            ))}
          </div>
        )}

        {images.length < MAX_IMAGES && (
          <label
            htmlFor="echo-images"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line p-6 text-center transition-colors hover:bg-subtle"
          >
            <ImagePlus className="size-7 text-muted" />

            <span className="text-sm font-medium text-fg">
              Add photographs
            </span>

            <span className="text-xs text-muted">
              JPEG, PNG or WebP · Maximum 5 MB per image
            </span>

            <input
              id="echo-images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={isSubmitting}
              onChange={handleImageSelection}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !description.trim()}
        className="self-end rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Reporting...' : 'Report Echo'}
      </button>
    </form>
  )
}
