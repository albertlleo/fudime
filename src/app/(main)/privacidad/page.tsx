import BackButton from '@/components/back-button'

export default function PrivacidadPage() {
  return (
    <div className="min-h-dvh pb-28 overflow-y-auto" style={{ background: 'var(--cream)' }}>
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <BackButton fallback="/perfil/configuracion" />
        <h1 className="text-xl font-black" style={{ color: 'var(--brown-900)' }}>Política de privacidad</h1>
      </div>

      <div className="px-5 space-y-6 pb-8">
        <p className="text-xs" style={{ color: 'var(--brown-400)' }}>Última actualización: julio 2025</p>

        <Section title="1. Responsable del tratamiento">
          <p>FUDIME es responsable del tratamiento de los datos personales que recopila a través de su aplicación. Puedes contactarnos en <strong>hola@fudime.com</strong>.</p>
        </Section>

        <Section title="2. Datos que recopilamos">
          <p>Recopilamos los datos que nos proporcionas al registrarte: nombre, correo electrónico, nombre de usuario, fecha de nacimiento, país y ciudad. También almacenamos el contenido que publicas (recetas, comentarios) y tus interacciones dentro de la app (me gusta, guardados, seguidos).</p>
        </Section>

        <Section title="3. Finalidad del tratamiento">
          <p>Utilizamos tus datos para:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Gestionar tu cuenta y acceso a la plataforma.</li>
            <li>Mostrarte contenido personalizado.</li>
            <li>Enviarte notificaciones relacionadas con tu actividad.</li>
            <li>Mejorar nuestros servicios mediante métricas agregadas y anónimas.</li>
          </ul>
        </Section>

        <Section title="4. Base legal">
          <p>El tratamiento se basa en la ejecución del contrato de uso de la plataforma (términos aceptados al registrarte) y, en su caso, en tu consentimiento expreso.</p>
        </Section>

        <Section title="5. Conservación de datos">
          <p>Conservamos tus datos mientras mantengas una cuenta activa. Si eliminas tu cuenta, borraremos tus datos personales en un plazo máximo de 30 días, salvo obligación legal de conservarlos.</p>
        </Section>

        <Section title="6. Compartición con terceros">
          <p>No vendemos tus datos. Podemos compartirlos con proveedores de servicio (almacenamiento, autenticación) exclusivamente para operar la plataforma, siempre bajo acuerdos de confidencialidad.</p>
        </Section>

        <Section title="7. Tus derechos">
          <p>Tienes derecho a acceder, rectificar, suprimir y portar tus datos, así como a oponerte a su tratamiento. Puedes ejercerlos escribiendo a <strong>hola@fudime.com</strong>.</p>
        </Section>

        <Section title="8. Cambios en esta política">
          <p>Podemos actualizar esta política puntualmente. Te notificaremos los cambios relevantes dentro de la app.</p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--brown-900)' }}>{title}</h2>
      <div className="text-sm leading-relaxed space-y-1" style={{ color: 'var(--brown-600)' }}>
        {children}
      </div>
    </div>
  )
}
