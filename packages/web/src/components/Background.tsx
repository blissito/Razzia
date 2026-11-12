import defaultLogo from "@razzia/web/assets/logo.svg"
import { imageFallback, useBranding, useGameBrand } from "@razzia/web/branding"
import GithubIcon from "@razzia/web/components/GithubIcon"
import BrandMark, {
  useBrandName,
} from "@razzia/web/features/game/components/BrandMark"
import type { PropsWithChildren } from "react"

const Background = ({ children }: PropsWithChildren) => {
  const branding = useBranding()
  // Con el PIN ya se sabe de quién es la partida: aparece su barra de marca
  const gameBrand = useGameBrand()
  const appName = useBrandName()

  return (
    <section className="bg-background text-foreground relative flex min-h-dvh flex-col">
      {gameBrand && (
        <header className="bg-card border-border flex min-h-13 items-center gap-2.5 border-b px-4">
          <BrandMark />
          <p className="truncate font-semibold">{appName}</p>
        </header>
      )}

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        {!gameBrand && (
          <img
            src={branding?.logo ?? defaultLogo}
            onError={imageFallback(defaultLogo)}
            className="mb-8 h-10"
            alt={appName}
          />
        )}
        {children}
      </div>

      {/* Con marca propia no se muestra el pie del proyecto. */}
      {!branding && (
        <a
          href="https://github.com/Ralex91/Razzia"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 text-sm font-semibold transition-colors"
        >
          <GithubIcon size={14} />
          {/* oxlint-disable-next-line no-undef */}
          Razzia - v{__APP_VERSION__}
        </a>
      )}
    </section>
  )
}

export default Background
