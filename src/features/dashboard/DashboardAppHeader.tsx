import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BloomoraLogo } from "@/components/brand/BloomoraLogo";
import { useUserPhone } from "@/contexts/UserPhoneContext";
import { useBloomoraProfile } from "@/hooks/useBloomoraProfile";
import {
  formatProfileGreeting,
  profileAvatarSrc,
  profileFirstName,
} from "@/lib/profileAvatarSrc";
import { mockProfileFirstName } from "@/data/dashboardMock";
import { usePopoverDismiss } from "@/hooks/usePopoverDismiss";
import { cn } from "@/utils/cn";

function formatDateRibbon(d: Date) {
  const day = d.getDate();
  const month = d.toLocaleDateString("es-CO", { month: "long" });
  const cap = month.charAt(0).toUpperCase() + month.slice(1);
  const year = d.getFullYear();
  return `${day} - ${cap} - ${year}`;
}

type DashboardAppHeaderProps = {
  firstName?: string;
  avatarSrc?: string;
};

/**
 * Barra superior del dashboard: marca, saludo + fecha centrados, menú de perfil.
 */
export function DashboardAppHeader({
  firstName: firstNameProp,
  avatarSrc: avatarSrcProp,
}: DashboardAppHeaderProps) {
  const { phone, logoutPhone } = useUserPhone();
  const { data: profile } = useBloomoraProfile(phone);

  const displayName =
    firstNameProp != null && String(firstNameProp).trim() !== ""
      ? formatProfileGreeting(String(firstNameProp), mockProfileFirstName)
      : profileFirstName(profile ?? undefined, mockProfileFirstName);
  const avatarUrl = avatarSrcProp ?? profileAvatarSrc(profile ?? undefined);

  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const ribbon = useMemo(() => formatDateRibbon(new Date()), []);

  usePopoverDismiss(menuOpen, triggerRef, menuRef, () => setMenuOpen(false));

  return (
    <header
      className={cn(
        "mb-5 grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-2.5 rounded-[22px] px-4 py-3.5 shadow-[0_6px_24px_-8px_rgba(91,74,140,0.12)] ring-1 ring-bloomora-line/20 sm:mb-7 sm:gap-4 sm:px-5 sm:py-4",
        "bg-gradient-to-r from-bloomora-blush via-bloomora-white to-bloomora-mist",
      )}
    >
      <div className="col-start-1 row-start-1 shrink-0">
        <BloomoraLogo size="sm" />
      </div>

      <div className="col-span-3 row-start-2 flex min-w-0 flex-col items-center justify-center gap-1 text-center sm:col-start-2 sm:row-start-1 sm:col-span-1 sm:gap-2">
        <h1 className="truncate text-base font-bold tracking-tight text-bloomora-violet sm:text-xl md:text-2xl">
          <span className="md:hidden">Hola</span>
          <span className="hidden md:inline">Hola, {displayName}</span>
        </h1>
        <div className="flex w-full max-w-md items-center justify-center gap-2 sm:gap-3">
          <span
            className="h-px min-w-[1.25rem] flex-1 max-w-[5rem] bg-bloomora-text-muted/35 sm:max-w-none"
            aria-hidden
          />
          <p className="shrink-0 text-xs font-medium text-bloomora-text-muted sm:text-sm md:text-base">
            {ribbon}
          </p>
          <span
            className="h-px min-w-[1.25rem] flex-1 max-w-[5rem] bg-bloomora-text-muted/35 sm:max-w-none"
            aria-hidden
          />
        </div>
      </div>

      <div className="relative col-start-3 row-start-1 shrink-0 justify-self-end">
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={`Menú de cuenta de ${displayName}`}
          id="dashboard-profile-trigger"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-full border border-bloomora-line/30 bg-bloomora-lavender-50/95 py-1 pl-1 pr-2 shadow-sm transition hover:border-bloomora-lilac/40 hover:bg-bloomora-lavender-100 min-[390px]:gap-2 sm:gap-2.5 sm:py-1.5 sm:pl-1.5 sm:pr-3"
        >
          <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-bloomora-lavender-50 sm:h-9 sm:w-9">
            <img
              src={avatarUrl}
              alt=""
              aria-hidden
              className="h-full w-full object-cover object-center"
              decoding="async"
            />
          </span>
          <span className="hidden max-w-[7rem] truncate text-sm font-semibold text-bloomora-violet md:inline md:text-[0.9375rem]">
            {displayName}
          </span>
          <svg
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-bloomora-violet/80 transition-transform duration-200 sm:h-4 sm:w-4",
              menuOpen && "rotate-180",
            )}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {menuOpen ? (
          <div
            ref={menuRef}
            id="dashboard-profile-menu"
            role="menu"
            aria-labelledby="dashboard-profile-trigger"
            className="absolute right-0 z-50 mt-2 min-w-[11.5rem] overflow-hidden rounded-xl border border-bloomora-line/20 bg-bloomora-blush/[0.98] py-1 shadow-[0_14px_40px_rgba(91,74,140,0.16)] backdrop-blur-sm"
          >
            <Link
              to="/app/profile"
              role="menuitem"
              className="block px-3 py-2.5 text-sm font-medium text-bloomora-deep transition hover:bg-bloomora-mist/90"
              onClick={() => setMenuOpen(false)}
            >
              Editar perfil
            </Link>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2.5 text-left text-sm font-medium text-bloomora-deep transition hover:bg-bloomora-mist/90"
              onClick={() => {
                setMenuOpen(false);
                logoutPhone();
                window.location.assign("/entrar");
              }}
            >
              Cerrar sesión
            </button>
            <Link
              to="/"
              role="menuitem"
              className="block px-3 py-2.5 text-sm font-medium text-bloomora-deep transition hover:bg-bloomora-mist/90"
              onClick={() => setMenuOpen(false)}
            >
              Inicio
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}
