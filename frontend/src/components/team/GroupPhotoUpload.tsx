import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'

import {
  Camera,
  CheckCircle2,
  Crop,
  ImagePlus,
  RefreshCw,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'

import api from '../../services/api'

interface GroupPhotoUploadProps {
  currentPhotoUrl: string | null
  onUploadSuccess: (photoPath: string) => void
}

interface UploadResponse {
  message: string
  team_id: number
  group_photo_path: string
  filename: string
}

function createCroppedImage(
  imageSrc: string,
  cropAreaPixels: Area,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      if (!context) {
        reject(new Error('Unable to create image canvas.'))
        return
      }

      canvas.width = cropAreaPixels.width
      canvas.height = cropAreaPixels.height

      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'

      context.drawImage(
        image,
        cropAreaPixels.x,
        cropAreaPixels.y,
        cropAreaPixels.width,
        cropAreaPixels.height,
        0,
        0,
        cropAreaPixels.width,
        cropAreaPixels.height,
      )

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Unable to create cropped image.'))
            return
          }

          resolve(blob)
        },
        'image/jpeg',
        0.92,
      )
    }

    image.onerror = () => {
      reject(new Error('Unable to load selected image.'))
    }

    image.src = imageSrc
  })
}

export default function GroupPhotoUpload({
  currentPhotoUrl,
  onUploadSuccess,
}: GroupPhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentPhotoUrl,
  )

  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null)

  const [crop, setCrop] = useState<Point>({
    x: 0,
    y: 0,
  })

  const [zoom, setZoom] = useState(1)

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<Area | null>(null)

  const [showCropper, setShowCropper] = useState(false)

  const [uploading, setUploading] = useState(false)

  const [error, setError] = useState('')

  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(currentPhotoUrl)
      return
    }

    const objectUrl = URL.createObjectURL(selectedFile)

    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [selectedFile, currentPhotoUrl])

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    setError('')
    setSuccess('')

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      event.target.value = ''
      return
    }

    const maxSize = 5 * 1024 * 1024

    if (file.size > maxSize) {
      setError('Image size must be 5 MB or less.')
      event.target.value = ''
      return
    }

    const objectUrl = URL.createObjectURL(file)

    setCropSourceUrl(objectUrl)

    setCrop({
      x: 0,
      y: 0,
    })

    setZoom(1)

    setCroppedAreaPixels(null)

    setShowCropper(true)

    event.target.value = ''
  }

  const handleCropComplete = (
    _: Area,
    croppedPixels: Area,
  ) => {
    setCroppedAreaPixels(croppedPixels)
  }

  const handleApplyCrop = async () => {
    if (!cropSourceUrl || !croppedAreaPixels) {
      setError('Please select a crop area.')
      return
    }

    try {
      setError('')

      const croppedBlob = await createCroppedImage(
        cropSourceUrl,
        croppedAreaPixels,
      )

      const maxSize = 5 * 1024 * 1024

      if (croppedBlob.size > maxSize) {
        setError(
          'The cropped image is larger than 5 MB. Please crop a smaller area.',
        )
        return
      }

      const croppedFile = new File(
        [croppedBlob],
        `team-group-photo-${Date.now()}.jpg`,
        {
          type: 'image/jpeg',
        },
      )

      setSelectedFile(croppedFile)

      URL.revokeObjectURL(cropSourceUrl)

      setCropSourceUrl(null)
      setCroppedAreaPixels(null)
      setShowCropper(false)

      setSuccess(
        'Crop applied. Your photo is ready to upload.',
      )
    } catch (err) {
      console.error('Failed to crop image:', err)

      setError(
        'Unable to crop this image. Please try another image.',
      )
    }
  }

  const handleCancelCrop = () => {
    if (cropSourceUrl) {
      URL.revokeObjectURL(cropSourceUrl)
    }

    setCropSourceUrl(null)
    setCroppedAreaPixels(null)
    setShowCropper(false)
    setError('')
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first.')
      return
    }

    try {
      setUploading(true)
      setError('')
      setSuccess('')

      const formData = new FormData()

      formData.append('photo', selectedFile)

      const response = await api.post<UploadResponse>(
        '/teams/me/group-photo',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      )

      setSuccess(response.data.message)

      setSelectedFile(null)

      onUploadSuccess(response.data.group_photo_path)
    } catch (err: any) {
      console.error('Failed to upload group photo:', err)

      setError(
        err?.response?.data?.detail ||
          'Unable to upload the group photo.',
      )
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setError('')
    setSuccess('')
  }

  const hasPhoto = Boolean(previewUrl)

  return (
    <>
      {/* GROUP PHOTO SECTION */}

      <section className="rounded-2xl border border-white/10 bg-[#111827] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Team Group Photo
            </p>

            <h2 className="mt-2 text-lg font-semibold text-white">
              {hasPhoto
                ? 'Update group photo'
                : 'Upload group photo'}
            </h2>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              Choose and crop your team photo before uploading.
              This photo will also be used as your team avatar.
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
            <Camera
              size={18}
              className="text-gray-400"
            />
          </div>
        </div>

        {/* 1:1 PHOTO PREVIEW */}

        <div className="mt-6 flex justify-center">
          {previewUrl ? (
            <div className="relative aspect-square w-full max-w-[520px] overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <img
                src={previewUrl}
                alt="Team group"
                className="h-full w-full object-cover"
              />

              {selectedFile && (
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-lg bg-black/70 px-3 py-2 backdrop-blur-sm">
                  <Crop
                    size={14}
                    className="text-white"
                  />

                  <span className="text-xs text-white">
                    Cropped photo ready
                  </span>
                </div>
              )}
            </div>
          ) : (
            <label
              htmlFor="group-photo"
              className="flex aspect-square w-full max-w-[520px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] transition-colors hover:border-white/25 hover:bg-white/[0.04]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05]">
                <ImagePlus
                  size={21}
                  className="text-gray-400"
                />
              </div>

              <p className="mt-4 text-sm font-medium text-gray-300">
                Choose a group photo
              </p>

              <p className="mt-1 text-xs text-gray-600">
                JPG, PNG or other image • Max 5 MB
              </p>
            </label>
          )}

          <input
            id="group-photo"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </div>

        {/* SELECTED FILE */}

        {selectedFile && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-300">
                {selectedFile.name}
              </p>

              <p className="mt-1 text-xs text-gray-600">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              disabled={uploading}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed"
              aria-label="Remove selected photo"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-sm text-gray-300">
              {error}
            </p>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <CheckCircle2
              size={16}
              className="shrink-0 text-gray-300"
            />

            <p className="text-sm text-gray-300">
              {success}
            </p>
          </div>
        )}

        {/* ACTION BUTTONS */}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label
            htmlFor="group-photo"
            className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 text-sm font-medium text-gray-300 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            {hasPhoto ? (
              <>
                <RefreshCw size={16} />
                Choose New Photo
              </>
            ) : (
              <>
                <ImagePlus size={16} />
                Choose Photo
              </>
            )}
          </label>

          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-[#111827] transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {uploading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#111827]/20 border-t-[#111827]" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} />
                {hasPhoto
                  ? 'Replace Photo'
                  : 'Upload Photo'}
              </>
            )}
          </button>
        </div>
      </section>

      {/* 1:1 CROP MODAL */}

      {showCropper && cropSourceUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-500">
                  Image Editor
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  Crop your group photo
                </h2>
              </div>

              <button
                type="button"
                onClick={handleCancelCrop}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/[0.05] hover:text-white"
                aria-label="Close crop editor"
              >
                <X size={18} />
              </button>
            </div>

            {/* CROP AREA */}

            <div className="relative h-[55vh] min-h-[320px] w-full bg-black">
              <Cropper
                image={cropSourceUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
                objectFit="contain"
                showGrid
              />
            </div>

            {/* CONTROLS */}

            <div className="border-t border-white/10 px-5 py-5">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ZoomIn
                      size={15}
                      className="text-gray-400"
                    />

                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      Zoom
                    </p>
                  </div>

                  <span className="text-xs text-gray-500">
                    {zoom.toFixed(1)}x
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <ZoomOut
                    size={15}
                    className="shrink-0 text-gray-600"
                  />

                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(event) =>
                      setZoom(
                        Number(event.target.value),
                      )
                    }
                    className="w-full accent-white"
                  />

                  <ZoomIn
                    size={15}
                    className="shrink-0 text-gray-400"
                  />
                </div>
              </div>

              {/* CANCEL / APPLY */}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancelCrop}
                  className="flex h-11 items-center justify-center rounded-xl border border-white/10 px-6 text-sm font-medium text-gray-400 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-[#111827] transition-colors hover:bg-gray-200"
                >
                  <CheckCircle2 size={16} />
                  Apply Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}