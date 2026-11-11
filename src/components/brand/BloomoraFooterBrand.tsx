import footerLogo from '@/assets/logos/bloomora_footer.png'

/** Wordmark horizontal oficial para el pie de páginas públicas. */
export function BloomoraFooterBrand() {
  return (
    <footer className="flex justify-center py-1" aria-label="Marca Bloomora">
      <img
        src={footerLogo}
        alt="Bloomora"
        className="h-7 w-auto max-w-[min(40vw,180px)] object-contain opacity-90"
        loading="lazy"
        decoding="async"
      />
    </footer>
  )
}
