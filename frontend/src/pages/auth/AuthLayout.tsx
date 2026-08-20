import type { ReactNode } from "react"
import { DoodlePattern } from "@/components/DoodlePattern"

export function AuthLayout({
  heading,
  subtitle,
  children,
  footer,
}: {
  heading: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="app-shell overflow-y-auto">
      <div className="flex min-h-full flex-col">
        <div className="flex flex-1 flex-col px-8 pb-6 pt-14">
          <div className="text-center">
            <p className="text-4xl font-bold tracking-tight text-primary">Evenly</p>
            <h1 className="mt-4 text-lg font-semibold text-foreground">{heading}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="mt-10">{children}</div>

          <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>
        </div>

        <DoodlePattern className="mt-auto" />
      </div>
    </div>
  )
}
