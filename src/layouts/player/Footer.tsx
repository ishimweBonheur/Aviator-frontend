import { Headphones, Plane } from "lucide-react";

import { useGameContext } from "@/features/game/state/game.context";

export function Footer() {
  const { setModal } = useGameContext();

  return (
    <>
      <footer
        role="contentinfo"
        className="
          mt-1
          flex
          items-center
          gap-5
          border-t
          border-[#ffffff07]
          pt-1.5
          pb-1
          text-[9px]
          text-[#625b6b]

          max-[900px]:gap-3.75

          max-[600px]:mt-1
          max-[600px]:gap-2.5
          max-[600px]:pt-1.5
          max-[600px]:pb-1.5

          max-[359px]:gap-1.5
        "
      >
        {/* Brand */}
        <span
          className="
            flex
            shrink-0
            items-center
            gap-1.25
            text-[15px]
            font-bold
            tracking-[-0.4px]
            text-[#797180]

            max-[600px]:text-[13px]

            max-[359px]:text-xs
          "
        >
          <Plane size={15} />

          <span>altitude.</span>
        </span>

        {/* Tagline */}
        <span className="max-[900px]:hidden">
          Built for the thrill. Play for the experience.
        </span>

        {/* Footer actions */}
        <div
          className="
            ml-auto
            flex
            items-center
            gap-3.75

            max-[600px]:gap-2

            max-[359px]:gap-1.5
          "
        >
          {/* 18+ */}
          <span
            className="
              grid
              size-5.5
              shrink-0
              place-items-center
              rounded-full
              border
              border-[#615165]
              text-[8px]
              text-[#a08ca7]

              max-[600px]:size-5
              max-[600px]:text-[7px]
            "
          >
            18+
          </span>

          {/* Responsible play */}
          <button
            type="button"
            className="
              flex
              items-center
              gap-1.25
              whitespace-nowrap
              bg-transparent
              text-[9px]
              text-[#8d8097]
              transition-opacity
              duration-150

              hover:opacity-75

              focus-visible:outline-none
              focus-visible:ring-1
              focus-visible:ring-[#8d8097]/40

              max-[600px]:text-[8px]

              max-[359px]:text-[7px]
            "
            onClick={() => setModal("help")}
          >
            Play responsibly
          </button>

          {/* Separator */}
          <span
            aria-hidden="true"
            className="
              h-3
              w-px
              bg-[#3b303f]

              max-[359px]:hidden
            "
          />

          {/* Help center */}
          <button
            type="button"
            className="
              flex
              items-center
              gap-1.25
              whitespace-nowrap
              bg-transparent
              text-[9px]
              text-[#8d8097]
              transition-opacity
              duration-150

              hover:opacity-75

              focus-visible:outline-none
              focus-visible:ring-1
              focus-visible:ring-[#8d8097]/40

              max-[600px]:text-[8px]

              max-[359px]:text-[7px]
            "
            onClick={() => setModal("help")}
          >
            <Headphones size={13} aria-hidden="true" />

            <span>Help center</span>
          </button>
        </div>
      </footer>

      {/* Backend information */}
      <div
        className="
          pb-1
          text-center
          text-[8px]
          leading-3
          text-[#5c5364]

          max-[600px]:px-3.75
          max-[600px]:text-[7px]
          max-[600px]:leading-3
        "
      >
        Connected to your backend. Balances and bets are server-managed. SANDBOX
        deposits are for local testing; external payments remain pending.
      </div>
    </>
  );
}
