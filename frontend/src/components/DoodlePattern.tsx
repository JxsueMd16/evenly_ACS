import {
  Banknote,
  Calculator,
  Coins,
  CreditCard,
  PieChart,
  Receipt,
  ScrollText,
  ShoppingBag,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DoodleItem {
  icon: LucideIcon
  top: string
  left: string
  size: number
  rotate: number
  faint?: boolean
}

/**
 * Mosaic of small money/group doodle icons, one accent color, uniform
 * stroke weight — a repeating decorative texture rather than a single
 * illustrated "scene". Sizes vary deliberately (14–34px) so it reads as
 * a lively scattered pattern instead of a flat grid. Positions are
 * hand-placed (not random) so the layout is stable across renders.
 */
const ITEMS: DoodleItem[] = [
  { icon: Wallet, top: "9%", left: "5%", size: 30, rotate: -12 },
  { icon: Coins, top: "21%", left: "16%", size: 15, rotate: 14, faint: true },
  { icon: Receipt, top: "6%", left: "27%", size: 22, rotate: 5 },
  { icon: PieChart, top: "15%", left: "40%", size: 34, rotate: -6 },
  { icon: Calculator, top: "7%", left: "55%", size: 17, rotate: -16, faint: true },
  { icon: Banknote, top: "19%", left: "65%", size: 26, rotate: 10 },
  { icon: ShoppingBag, top: "5%", left: "78%", size: 19, rotate: -8, faint: true },
  { icon: CreditCard, top: "17%", left: "90%", size: 24, rotate: 12 },

  { icon: Users, top: "38%", left: "10%", size: 20, rotate: 9, faint: true },
  { icon: ScrollText, top: "45%", left: "22%", size: 30, rotate: -10 },
  { icon: Coins, top: "36%", left: "35%", size: 16, rotate: 18, faint: true },
  { icon: Wallet, top: "48%", left: "47%", size: 22, rotate: -14 },
  { icon: PieChart, top: "38%", left: "60%", size: 15, rotate: 8, faint: true },
  { icon: Receipt, top: "46%", left: "72%", size: 28, rotate: -6 },
  { icon: Banknote, top: "37%", left: "85%", size: 18, rotate: 14, faint: true },
  { icon: CreditCard, top: "48%", left: "97%", size: 24, rotate: -10 },

  { icon: ShoppingBag, top: "74%", left: "6%", size: 17, rotate: -12, faint: true },
  { icon: Wallet, top: "83%", left: "18%", size: 32, rotate: 8 },
  { icon: Calculator, top: "73%", left: "32%", size: 20, rotate: -16 },
  { icon: Receipt, top: "85%", left: "46%", size: 15, rotate: 10, faint: true },
  { icon: PieChart, top: "75%", left: "60%", size: 27, rotate: -8 },
  { icon: Coins, top: "86%", left: "74%", size: 19, rotate: 14, faint: true },
  { icon: Banknote, top: "75%", left: "87%", size: 23, rotate: -10 },
  { icon: CreditCard, top: "87%", left: "98%", size: 16, rotate: 12, faint: true },
]

export function DoodlePattern({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative h-44 w-full overflow-hidden bg-linear-to-b from-background to-sky", className)}
      aria-hidden="true"
    >
      {ITEMS.map(({ icon: Icon, top, left, size, rotate, faint }, i) => (
        <Icon
          key={i}
          style={{
            top,
            left,
            width: size,
            height: size,
            transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
          }}
          className={cn("absolute text-primary", faint ? "opacity-25" : "opacity-80")}
          strokeWidth={1.5}
        />
      ))}
    </div>
  )
}
