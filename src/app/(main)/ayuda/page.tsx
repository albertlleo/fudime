import BackButton from '@/components/back-button'

export default function AyudaPage() {
  return (
    <div className="min-h-dvh pb-28 overflow-y-auto" style={{ background: 'var(--cream)' }}>
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <BackButton fallback="/perfil/configuracion" />
        <h1 className="text-xl font-black" style={{ color: 'var(--brown-900)' }}>Centro de ayuda</h1>
      </div>

      <div className="px-5 space-y-3 pb-8">

        <FaqItem
          q="¿Cómo puedo subir una receta?"
          a="Para subir una receta necesitas tener una cuenta de creador activa. Ve a tu perfil, solicita ser creador y, una vez aprobado, podrás usar el botón '+' para grabar y publicar tus recetas en vídeo."
        />

        <FaqItem
          q="¿Cómo me convierto en creador?"
          a="En tu perfil ve a Configuración → Solicitar ser creador y rellena el formulario. Revisaremos tu solicitud y te notificaremos por la app."
        />

        <FaqItem
          q="¿Puedo guardar recetas para verlas después?"
          a="Sí. Toca el icono de marcador en cualquier receta para guardarla. Encontrarás todas tus recetas guardadas en la sección Guardados de tu perfil."
        />

        <FaqItem
          q="¿Cómo cambio mi contraseña?"
          a="Ve a Configuración → Cambiar contraseña e introduce tu contraseña actual y la nueva."
        />

        <FaqItem
          q="¿Cómo elimino mi cuenta?"
          a="Ve a Configuración → Eliminar cuenta. Ten en cuenta que esta acción es irreversible y se eliminarán todos tus datos y recetas."
        />

        <FaqItem
          q="¿Puedo desactivar los comentarios en mis recetas?"
          a="Sí. En Configuración encontrarás la opción de activar o desactivar los comentarios en tus recetas."
        />

        <FaqItem
          q="¿Con quién puedo contactar si tengo un problema?"
          a="Escríbenos a hola@fudime.com y te responderemos lo antes posible."
        />

      </div>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1.5px solid var(--brown-100)' }}>
      <p className="text-sm font-bold mb-1.5" style={{ color: 'var(--brown-900)' }}>{q}</p>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--brown-500)' }}>{a}</p>
    </div>
  )
}
