import { Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'

const PhotoUpload = ({ onPhotoSelected, currentPhoto = null }) => {
  const [preview, setPreview] = useState(currentPhoto)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  const processFile = (file) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target.result
        setPreview(result)
        onPhotoSelected(result)
      }
      reader.readAsDataURL(file)
    } else {
      alert('Please select an image file')
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onPhotoSelected(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-sky-500 bg-sky-500/10'
              : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-3"
          >
            <Upload className="w-10 h-10 text-slate-400 mx-auto" />
            <div>
              <p className="text-slate-200 font-medium">Drag and drop your photo here</p>
              <p className="text-slate-400 text-sm">or click to browse</p>
            </div>
            <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
      ) : (
        <div className="relative inline-block w-full">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-cover rounded-lg border border-slate-600"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-2 right-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <Upload className="w-4 h-4" />
            Change Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}

export default PhotoUpload
