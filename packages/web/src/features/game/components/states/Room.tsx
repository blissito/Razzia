import { EVENTS } from "@razzia/common/constants"
import type { Player } from "@razzia/common/types/game"
import type { ManagerStatusDataMap } from "@razzia/common/types/game/status"
import { useBranding } from "@razzia/web/branding"
import Avatar from "@razzia/web/features/game/components/Avatar"
import { useFooterSlot } from "@razzia/web/features/game/contexts/footer-slot"
import { safeGet } from "@razzia/web/lib/storage"
import PlayerConnectionStatus from "@razzia/web/features/game/components/PlayerConnectionStatus"
import {
  useEvent,
  useSocket,
} from "@razzia/web/features/game/contexts/socket-context"
import { useManagerStore } from "@razzia/web/features/game/stores/manager"
import { useOnClickOutside } from "@razzia/web/hooks/useOnClickOutside"
import { Lock, Maximize2, X } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { AlertDialog } from "radix-ui"
import { useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"

interface Props {
  data: ManagerStatusDataMap["SHOW_ROOM"]
}

const Room = ({ data: { text, inviteCode } }: Props) => {
  const { gameId, players, locked } = useManagerStore()
  const { socket } = useSocket()
  const [playerList, setPlayerList] =
    useState<Array<Player & { timedOut?: boolean }>>(players)
  const [qrOpen, setQrOpen] = useState(false)
  const qrContentRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  // Instancias con entrada sólo por identidad firmada: el PIN y el QR no le sirven a nadie.
  // La marca de la partida (si la app anfitriona mandó una) va antes que la de la instancia.
  const joinHint = useBranding()?.joinHint
  const footerSlot = useFooterSlot()
  // The host app's own entry link (see /embed/manager): the QR sends players there.
  const hostJoinUrl = gameId ? safeGet(`embed_join_${gameId}`) : null

  useOnClickOutside({ ref: qrContentRef, handler: () => setQrOpen(false) })

  useEvent(EVENTS.MANAGER.NEW_PLAYER, (player) => {
    setPlayerList([...playerList, player])
  })

  useEvent(EVENTS.MANAGER.REMOVE_PLAYER, (playerId) => {
    setPlayerList(playerList.filter((p) => p.id !== playerId))
  })

  useEvent(EVENTS.MANAGER.PLAYER_KICKED, (playerId) => {
    setPlayerList(playerList.filter((p) => p.id !== playerId))
  })

  useEvent(
    EVENTS.MANAGER.PLAYER_UPDATED,
    ({ previousId, player, timedOut }) => {
      setPlayerList((list) =>
        list.map((p) => (p.id === previousId ? { ...player, timedOut } : p)),
      )
    },
  )

  const handleKick = (playerId: string) => () => {
    if (!gameId) {
      return
    }

    socket.emit(EVENTS.MANAGER.KICK_PLAYER, {
      gameId,
      playerId,
    })
  }

  const handleCloseQrCode = () => setQrOpen(false)

  // "Entra a {{host}} y escribe el PIN": el dominio va resaltado, donde caiga en cada idioma
  const [beforeHost, afterHost] = t("game:joinWithPin", {
    host: "\u0000",
  }).split("\u0000")
  const pin = inviteCode ?? ""
  const pinUrl = `${window.location.origin}?pin=${pin}`

  const chips = (
    <div className="flex max-h-[6.5rem] flex-wrap items-center gap-2 overflow-y-auto py-1">
      {playerList.length === 0 && (
        <p className="text-muted-foreground">{t(text)}</p>
      )}
      {playerList.map((player) => (
        <button
          key={player.id}
          type="button"
          onClick={handleKick(player.id)}
          className="bg-muted text-foreground relative inline-flex items-center gap-[0.4rem] rounded-full py-[0.3rem] pr-[0.75rem] pl-[0.35rem] text-[0.9rem] hover:line-through has-[[data-lost]]:opacity-60"
        >
          <Avatar
            name={player.username}
            className="size-[1.3rem] text-[0.55rem]"
          />
          {player.username}
          {!player.connected && (
            <PlayerConnectionStatus
              key={String(player.timedOut)}
              timedOut={player.timedOut}
            />
          )}
        </button>
      ))}
    </div>
  )

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col items-start justify-center gap-[1.5rem] md:flex-row md:items-center md:gap-[2.5rem]">
        <div className="min-w-0 flex-1">
          {hostJoinUrl ? (
            // Sólo miembros: el PIN no le sirve a nadie, manda el QR de la app anfitriona
            <p className="text-foreground max-w-[24ch] text-[2.4rem] leading-[1.15] font-[650] tracking-[-0.01em]">
              {joinHint ?? t("game:joinInstruction")}
            </p>
          ) : (
            <>
              <p className="text-muted-foreground text-[1.25rem]">
                {beforeHost}
                <b className="text-foreground font-semibold">
                  {window.location.host}
                </b>
                {afterHost}
              </p>
              <p
                aria-label={t("game:gamePinLabel")}
                className="text-foreground mt-[0.7rem] mb-[1.2rem] text-[clamp(3.5rem,9.2vw,13rem)] leading-none font-bold tracking-[0.06em] tabular-nums"
              >
                {locked ? "••• •••" : `${pin.slice(0, 3)} ${pin.slice(3)}`}
              </p>
              {joinHint && <p className="text-muted-foreground">{joinHint}</p>}
            </>
          )}
        </div>

        {hostJoinUrl && (
          <div className="flex size-[11.7rem] shrink-0 rounded-[10px] bg-white p-[0.8rem]">
            <QRCodeSVG className="h-full w-full" value={hostJoinUrl} />
          </div>
        )}

        {!hostJoinUrl && locked && (
          <div className="bg-card border-border text-muted-foreground flex size-[11.7rem] shrink-0 items-center justify-center rounded-[10px] border">
            <Lock className="size-[3.5rem]" />
          </div>
        )}

        {!hostJoinUrl && !locked && (
          <AlertDialog.Root open={qrOpen} onOpenChange={setQrOpen}>
            <AlertDialog.Trigger
              aria-label={t("game:showQrCode")}
              className="group relative flex size-[11.7rem] shrink-0 rounded-[10px] bg-white p-[0.8rem]"
            >
              <QRCodeSVG className="h-full w-full" value={pinUrl} />
              <span className="absolute inset-0 flex items-center justify-center rounded-[10px] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="bg-card text-foreground border-border rounded-full border p-2">
                  <Maximize2 className="size-5" />
                </span>
              </span>
            </AlertDialog.Trigger>

            <AlertDialog.Portal>
              <AlertDialog.Overlay className="bg-background/90 fixed inset-0 z-50" />
              <AlertDialog.Content
                ref={qrContentRef}
                className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-[10px] bg-white p-6"
              >
                <button
                  onClick={handleCloseQrCode}
                  aria-label={t("common:close")}
                  className="bg-card text-foreground border-border hover:bg-muted absolute -top-3 -right-3 rounded-full border p-1.5"
                >
                  <X className="size-5" />
                </button>
                <QRCodeSVG
                  className="size-56 md:size-70 lg:size-95"
                  value={pinUrl}
                />
              </AlertDialog.Content>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        )}
      </div>

      {/* Los nombres van junto al botón «Iniciar»; sin ese hueco, aquí mismo */}
      {footerSlot ? createPortal(chips, footerSlot) : chips}
    </section>
  )
}

export default Room
