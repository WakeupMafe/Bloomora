import { Link } from 'react-router-dom'
import { BloomoraLogo } from '@/components/brand/BloomoraLogo'
import { BloomyPose } from '@/components/brand/BloomyPose'
import iconCheck from '@/assets/svg/icon_check.svg'
import iconHabit from '@/assets/svg/icon_habit.svg'
import iconProgress from '@/assets/svg/icon_progress.svg'
import iconTask from '@/assets/svg/icon_task.svg'
import tulip from '@/assets/svg/tulip.svg'
import '@/styles/welcome-hero.css'

const dayItems = [
  {
    title: 'Tareas diarias',
    desc: 'Anota lo importante y táchalo al terminar.',
    icon: iconTask,
  },
  {
    title: 'Hábitos',
    desc: 'Repite pequeñas acciones cada día.',
    icon: iconHabit,
  },
  {
    title: 'Progreso',
    desc: 'Mira cuánto has avanzado esta semana.',
    icon: iconProgress,
  },
]

export function WelcomePage() {
  return (
    <div className="welcome-site">
      <section className="welcome-screen" aria-labelledby="welcome-title">
        <div className="welcome-hero-shell">
          <header className="welcome-header">
            <Link to="/" className="welcome-brand-link" aria-label="Bloomora, inicio">
              <BloomoraLogo size="md" priority className="welcome-brand-logo" />
              <span className="welcome-beta">BETA</span>
            </Link>
            <Link to="/entrar" className="welcome-header-login">
              Ya tengo cuenta
            </Link>
          </header>

          <main className="welcome-main">
            <div className="welcome-hero-art" aria-hidden>
              <BloomyPose pose="hero" sizePx={232} priority className="welcome-bloomy" />
              <div className="welcome-float welcome-float--task">
                <img src={iconCheck} alt="" />
                <p>
                  <strong>Leer 15 min</strong>
                  <span>Tarea completada</span>
                </p>
              </div>
              <div className="welcome-float welcome-float--goal">
                <img src={iconProgress} alt="" />
                <p>
                  <strong>3 de 5 metas</strong>
                  <span>¡Vas muy bien!</span>
                </p>
              </div>
            </div>

            <div className="welcome-copy">
              <p className="welcome-kicker">
                <img src={tulip} alt="" aria-hidden />
                Tu planner diario
              </p>
              <h1 id="welcome-title" className="welcome-title">
                Organiza tu día con <span className="welcome-mark">calma</span> y
                propósito
              </h1>
              <p className="welcome-subtitle">
                <span className="welcome-subtitle-short">
                  Pequeñas tareas, grandes logros.
                  <br />
                  A tu ritmo.
                </span>
                <span className="welcome-subtitle-long">
                  Pequeñas tareas, grandes logros. Planea tu día, cumple tus metas y
                  avanza a tu ritmo.
                </span>
              </p>

              <div className="welcome-actions">
                <Link to="/phone" className="welcome-button welcome-button--primary">
                  Comenzar gratis
                </Link>
                <Link
                  to="/entrar"
                  className="welcome-button welcome-button--outline welcome-header-login-mobile"
                >
                  Ya tengo cuenta
                </Link>
              </div>

              <ul className="welcome-trust" aria-label="Ventajas">
                <li className="welcome-trust-item welcome-trust-item--compact">
                  <img src={iconCheck} alt="" aria-hidden />
                  Gratis y sin tarjeta
                </li>
                <li className="welcome-trust-item welcome-trust-item--split">
                  <img src={iconCheck} alt="" aria-hidden />
                  Gratis
                </li>
                <li className="welcome-trust-item welcome-trust-item--split">
                  <img src={iconCheck} alt="" aria-hidden />
                  Sin tarjeta
                </li>
                <li className="welcome-trust-item welcome-trust-item--split">
                  <img src={iconCheck} alt="" aria-hidden />
                  Con tu cédula o celular
                </li>
              </ul>
            </div>
          </main>

          <a
            href="#welcome-day"
            className="welcome-scroll"
            aria-label="Ver más contenido"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
              <path
                d="M6 9l6 6 6-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>

        <section
          id="welcome-day"
          className="welcome-day-section"
          aria-labelledby="day-title"
        >
          <p className="welcome-day-kicker">UN DÍA A LA VEZ</p>
          <h2 id="day-title" className="welcome-day-title">
            Todo lo que necesitas,
            <br />
            nada más
          </h2>
          <div className="welcome-day-list">
            {dayItems.map((item) => (
              <article key={item.title} className="welcome-day-item">
                <div className="welcome-day-icon">
                  <img src={item.icon} alt="" aria-hidden />
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="welcome-footer">
          <img src={tulip} alt="" aria-hidden />
          Hecho con calma · Bloomora 2026
        </footer>
      </section>
    </div>
  )
}
