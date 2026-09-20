import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

export interface CtaBlockProps {
  title: string
  description?: string
  buttonText: string
  buttonLink?: string
  buttonIcon?: ReactNode
  onButtonClick?: () => void
}

export default function CtaBlock({
  title,
  description,
  buttonText,
  buttonLink,
  buttonIcon,
  onButtonClick,
}: CtaBlockProps) {
  const buttonContent = (
    <>
      <span>{buttonText}</span>

      <span className="ml-3 flex items-center">
        {buttonIcon ?? (
          <ArrowRight
            className="h-5 w-5"
            strokeWidth={2}
          />
        )}
      </span>
    </>
  )

  const buttonClassName =
    'flex h-[60px] w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.10] px-8 text-base font-semibold text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.12),inset_0_-2px_5px_rgba(0,0,0,0.35),0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.14] hover:border-white/20 md:w-auto md:min-w-[276px]'

  return (
    <section className="w-full">
      <div className="relative isolate overflow-hidden rounded-2xl border border-lime-400/25 bg-[#101b09] px-10 py-16 md:px-12 md:py-20">

        {/* MAIN GREEN AMBIENT GLOW */}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 top-1/2 -z-10 h-[420px] w-[620px] -translate-y-1/2 rounded-full bg-lime-400/[0.16] blur-[90px]"
        />

        {/* SECOND GREEN GLOW */}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-1/2 -z-10 h-[360px] w-[520px] -translate-y-1/2 rounded-full bg-lime-400/[0.10] blur-[100px]"
        />

        {/* CENTER DARK OVERLAY */}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_left,rgba(132,204,22,0.12),transparent_48%),radial-gradient(ellipse_at_right,rgba(101,163,13,0.08),transparent_48%)]"
        />

        {/* CONTENT */}

        <div className="relative flex flex-col items-center justify-between gap-10 md:flex-row md:gap-12">

          {/* TEXT */}

          <div className="max-w-[650px] text-center md:text-left">

            <h2 className="text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-[44px]">
              {title}
            </h2>

            {description && (
              <p className="mt-4 max-w-[570px] text-lg leading-7 text-gray-400">
                {description}
              </p>
            )}

          </div>

          {/* BUTTON */}

          <div className="w-full shrink-0 md:w-auto">
            {buttonLink ? (
              <a
                href={buttonLink}
                className={buttonClassName}
              >
                {buttonContent}
              </a>
            ) : (
              <button
                type="button"
                onClick={onButtonClick}
                className={buttonClassName}
              >
                {buttonContent}
              </button>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}