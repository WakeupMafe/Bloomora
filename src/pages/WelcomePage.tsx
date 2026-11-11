import { Link } from 'react-router-dom'
import { BloomoraLogo } from '@/components/brand/BloomoraLogo'
import { MascotAvatar } from '@/components/brand/MascotAvatar'
import '@/styles/welcome-hero.css'

function CheckIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.2" /><path d="m6.7 10.1 2.1 2.1 4.5-4.6" /></svg>
}

function RoseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21v-8m0 2c-4 0-6-2-6-5 3 0 5 1 6 4m0-1c0-3 2-5 5-5 0 3-1 5-5 6m0-7c-2-1-3-3-2-5 2 1 3 2 3 4 1-2 3-3 5-2 0 2-2 4-5 4m-3-1C8 6 9 3 12 2c3 1 4 4 2 7-1 1-2 2-2 2s-1-1-2-2Z" /></svg>
}

function HabitIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V9m0 5c-4 0-6-2-6-6 3 0 5 1 6 4m0 0c0-4 2-6 6-6 0 4-2 6-6 7M8 21h8" /></svg>
}

function ProgressIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16M6 16v-4m6 4V6m6 10V9" /><path d="m5 9 5-4 4 2 5-4" /></svg>
}

const features = [
  { label: 'Tareas diarias', icon: <RoseIcon /> },
  { label: 'Hábitos', icon: <HabitIcon /> },
  { label: 'Progreso', icon: <ProgressIcon /> },
]

export function WelcomePage() {
  return (
    <div className="welcome-site">
      <section className="welcome-screen" aria-labelledby="welcome-title">
        <header className="welcome-header">
          <Link to="/" className="welcome-brand-link" aria-label="Bloomora, inicio">
            <BloomoraLogo size="md" priority className="welcome-brand-logo" />
          </Link>

          <nav className="welcome-nav" aria-label="Navegación principal">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#beneficios">Beneficios</a>
            <a href="#contacto">Contacto</a>
          </nav>

          <div className="welcome-auth-links">
            <Link to="/entrar" className="welcome-login-link">Ingresar</Link>
            <Link to="/phone" className="welcome-register-link">Crear cuenta</Link>
          </div>
        </header>

        <main className="welcome-main">
          <div className="welcome-hero">
            <div className="welcome-copy">
              <div className="welcome-beta"><span>BETA</span><i aria-hidden="true">·</i>Tu planner diario</div>
              <h1 id="welcome-title" className="welcome-title">
                Organiza tu día con<br className="welcome-title-break" /> <em>calma</em> y propósito.
              </h1>
              <p className="welcome-subtitle">Convierte pequeñas tareas en grandes<br className="welcome-subtitle-break" /> logros, a tu ritmo.</p>

              <div className="welcome-actions">
                <Link to="/phone" className="welcome-button welcome-button--primary">
                  Comenzar gratis <span aria-hidden="true">→</span>
                </Link>
                <Link to="/entrar" className="welcome-button welcome-button--outline">Ya tengo cuenta</Link>
              </div>

              <ul className="welcome-trust" aria-label="Ventajas de Bloomora">
                <li><CheckIcon />Sin tarjeta</li>
                <li><span className="welcome-trust-dot" aria-hidden="true">·</span>Ingresa con tu cédula o celular</li>
                <li><CheckIcon />Gratis</li>
              </ul>

              <div className="welcome-feature-list" aria-label="Herramientas de Bloomora">
                {features.map((feature) => (
                  <div className="welcome-feature" key={feature.label}>
                    <span className="welcome-feature-icon">{feature.icon}</span>
                    <span>{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="welcome-art" aria-hidden="true">
              <div className="welcome-art-halo" />
              <MascotAvatar className="welcome-mascot" priority alt="" />
            </div>
          </div>
        </main>
      </section>

      <section id="como-funciona" className="welcome-info-section" aria-labelledby="how-title">
        <p className="welcome-section-kicker">A tu manera, un día a la vez</p>
        <h2 id="how-title">Un espacio para avanzar con calma</h2>
        <div className="welcome-info-grid">
          <article><span>01</span><h3>Organiza tus tareas</h3><p>Reúne tus pendientes del día en un solo lugar y decide qué va primero.</p></article>
          <article><span>02</span><h3>Construye hábitos</h3><p>Convierte las pequeñas acciones en una rutina que se sienta posible.</p></article>
          <article><span>03</span><h3>Reconoce tu progreso</h3><p>Marca tus avances y celebra cada paso, a tu propio ritmo.</p></article>
        </div>
      </section>

      <section id="beneficios" className="welcome-benefits-section" aria-labelledby="benefits-title">
        <p className="welcome-section-kicker">Menos ruido, más intención</p>
        <h2 id="benefits-title">Todo lo que necesitas para cuidar tu día</h2>
        <p>Tareas, hábitos y progreso en una experiencia sencilla y amable.</p>
        <div className="welcome-benefit-pills">
          {features.map((feature) => <span key={feature.label}>{feature.icon}{feature.label}</span>)}
        </div>
      </section>

      <footer id="contacto" className="welcome-contact-section">
        <div><p className="welcome-section-kicker">Empieza cuando quieras</p><h2>Tu día puede sentirse más ligero.</h2></div>
        <Link to="/phone" className="welcome-button welcome-button--primary">Crear cuenta <span aria-hidden="true">→</span></Link>
        <span className="welcome-contact-brand">Bloomora · Tu planner diario</span>
      </footer>
    </div>
  )
}
