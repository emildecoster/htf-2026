import { randomUUID } from 'node:crypto'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { isAbsolute, join, relative, resolve } from 'node:path'

const UPLOAD_DIRECTORY = join(process.cwd(), 'uploads', 'echoes')

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const IMAGE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
} as const

export type ImageMimeType = keyof typeof IMAGE_TYPES

export type StoredImage = {
  fileName: string
  filePath: string
  mimeType: ImageMimeType
}

function detectImageType(buffer: Buffer): ImageMimeType | null {
  // JPEG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg'
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return 'image/png'
  }

  // WebP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp'
  }

  return null
}

export async function storeImage(file: File): Promise<StoredImage> {
  if (file.size === 0) {
    throw new Error('Image cannot be empty.')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Image exceeds the 5 MB size limit.')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = detectImageType(buffer)

  if (!mimeType) {
    throw new Error('Unsupported or invalid image format.')
  }

  const extension = IMAGE_TYPES[mimeType]
  const storedFileName = `${randomUUID()}${extension}`
  const filePath = join(UPLOAD_DIRECTORY, storedFileName)

  await mkdir(UPLOAD_DIRECTORY, { recursive: true })
  await writeFile(filePath, buffer, { flag: 'wx' })

  return {
    fileName: file.name,
    filePath,
    mimeType,
  }
}

export async function deleteStoredImage(filePath: string) {
  await unlink(filePath)
}

export async function readStoredImage(filePath: string): Promise<Buffer> {
  const resolvedPath = resolve(filePath)
  const relativePath = relative(UPLOAD_DIRECTORY, resolvedPath)

  // Only allow files inside the upload directory.
  if (
    !relativePath ||
    relativePath.startsWith('..') ||
    isAbsolute(relativePath)
  ) {
    throw new Error('Invalid image path.')
  }

  return readFile(resolvedPath)
}
