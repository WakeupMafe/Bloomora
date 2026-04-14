import { Link } from 'react-router-dom'
import { BloomoraLogo } from '@/components/brand/BloomoraLogo'
import { MascotAvatar } from '@/components/brand/MascotAvatar'
import { buttonClassName } from '@/components/ui/buttonRecipe'
import '@/styles/welcome-hero.css'

const waveSvg = (
  <svg
    viewBox="0 0 1440 560"
    preserveAspectRatio="none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      opacity="0.5"
      d="M0 320C180 280 360 380 540 340C720 300 900 200 1080 240C1260 280 1380 380 1440 360V560H0V320Z"
      fill="currentColor"
    />
    <path
      opacity="0.35"
      d="M0 400C240 340 480 460 720 400C960 340 1200 260 1440 300V560H0V400Z"
      fill="currentColor"
    />
    <path
      opacity="0.25"
      d="M0 180C320 240 640 120 960 200C1120 240 1280 320 1440 280V560H0V180Z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
)

export function WelcomePage() {
  return (
    <div className="welcome-page">
      <div className="welcome-bg">
        <div className="welcome-bg-gradient" />
        <div className="welcome-bg-bloom welcome-bg-bloom--pink" />
        <div className="welcome-bg-bloom welcome-bg-bloom--lavender" />
        <div className="welcome-bg-waves">{waveSvg}</div>
        <div className="welcome-sparkles" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} />
          ))}
        </div>
      </div>

      <header className="welcome-header">
        <div className="welcome-header-brand">
          <BloomoraLogo size="sm" />
          <Link
            to="/phone"
            className="welcome-register"
          >
            Registrarme
          </Link>
        </div>
        <span className="welcome-beta">beta</span>
      </header>

      <main className="welcome-main">
        <div className="welcome-hero">
          <div className="welcome-col-text">
            <div className="welcome-lead">
              <h1 className="welcome-title">
                Organiza tu día con calma y propósito.
              </h1>
              <p className="welcome-subtitle">
                Convierte pequeñas tareas en grandes logros.
              </p>
            </div>

            <div className="welcome-cta">
              <Link
                to="/entrar"
                className={buttonClassName({
                  variant: 'primary',
                  size: 'lg',
                  fullWidth: true,
                  className:
                    'min-h-[clamp(2.75rem,8vw,3.25rem)] text-[clamp(0.9rem,2.2vw,1rem)]',
                })}
              >
                Comenzar
              </Link>
              <p className="welcome-cta-note">
                Comenzar: ingresa con tu cédula o celular. Registrarme: crea tu
                perfil con nombre, cédula y celular.
              </p>
            </div>
          </div>

          <div className="welcome-mascot-wrap">
            <MascotAvatar className="welcome-mascot" />
          </div>
        </div>
      </main>
    </div>
  )
}
