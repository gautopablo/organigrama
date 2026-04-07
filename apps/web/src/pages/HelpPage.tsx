import React from "react";

export function HelpPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 0' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>Instructivo y Ayuda</h2>
      <p style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '3rem' }}>
        Bienvenido al sistema de Organigrama de Taranto. Aquí aprenderás a sacar el máximo provecho de la herramienta.
      </p>

      <section className="help-section" style={{ marginBottom: '3rem' }}>
        <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          1. Uso del Organigrama Interactivo
        </h3>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <ul style={{ lineHeight: '1.8' }}>
            <li><strong>Moverse:</strong> Haz clic y arrastra en cualquier parte del fondo para desplazarte por el gráfico.</li>
            <li><strong>Zoom:</strong> Usa la rueda del ratón o los botones en la esquina inferior izquierda (+/-) para acercarte o alejarte.</li>
            <li><strong>Filtrar por Persona:</strong> Usa el selector en la parte superior para elegir un "empleado raíz". El sistema mostrará solo su rama jerárquica hacia abajo.</li>
            <li><strong>Ver Sub-Rama:</strong> Haz clic en el botón "Ver Rama" de cualquier tarjeta para entrar en la jerarquía específica de ese colaborador.</li>
            <li><strong>Mini-Mapa:</strong> En la esquina inferior derecha tienes una vista en miniatura que te permite navegar rápidamente por organigramas extensos.</li>
          </ul>
        </div>
      </section>

      <section className="help-section" style={{ marginBottom: '3rem' }}>
        <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          2. ¿Cómo se actualizan los datos (Edición)?
        </h3>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <p style={{ marginBottom: '1rem' }}>
            Actualmente, la edición de personas y cargos se realiza de forma masiva a través de los archivos de origen.
          </p>
          <ul style={{ lineHeight: '1.8' }}>
            <li><strong>Archivo Jerárquico:</strong> Se utiliza el archivo <code>reporta a.csv</code> para definir quién reporta a quién.</li>
            <li><strong>Archivo de Datos:</strong> Se utiliza el Excel oficial de Recursos Humanos para obtener nombres, cargos, áreas y correos.</li>
            <li><strong>Sincronización:</strong> Una vez editados los archivos, se corre el proceso de importación que cruza ambos datos, aplicando reglas inteligentes para evitar duplicados y resolver nombres con segundos nombres o variaciones de mayúsculas.</li>
          </ul>
        </div>
      </section>

      <section className="help-section" style={{ marginBottom: '3rem' }}>
        <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          3. Gestión de Conflictos
        </h3>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <p>
            Si detectas que una persona no aparece bajo su jefe correcto, es probable que haya una discrepancia en el archivo de origen. Puedes revisar la sección <strong>"Conflictos"</strong> en el menú superior para ver qué inconsistencias detectó el sistema durante la última carga.
          </p>
        </div>
      </section>

      <div style={{ textAlign: 'center', marginTop: '4rem', padding: '2rem', background: '#e0f2fe', borderRadius: '16px' }}>
        <h4 style={{ margin: 0, color: '#0369a1' }}>¿Necesitas ayuda técnica?</h4>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>Contacta con el equipo de Capital Humano para actualizaciones de base de datos.</p>
      </div>
    </div>
  );
}
