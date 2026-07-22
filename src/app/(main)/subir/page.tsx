import VideoUploader from '@/components/video-uploader'

export default function SubirPage() {
  return (
    <>
      <div className="hidden lg:flex flex-col items-center justify-center h-dvh text-center px-8">
        <span className="text-5xl mb-4">📱</span>
        <h2 className="text-xl font-black mb-2" style={{ color: 'var(--brown-900)' }}>
          Solo disponible desde el móvil
        </h2>
        <p className="text-sm" style={{ color: 'var(--brown-500)' }}>
          Para subir recetas, abre la app desde tu teléfono.
        </p>
      </div>
      <div className="lg:hidden">
        <VideoUploader />
      </div>
    </>
  )
}
