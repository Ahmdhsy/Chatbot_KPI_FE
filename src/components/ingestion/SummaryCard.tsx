import React from "react"
import Badge from "@/components/ui/badge/Badge"

type BadgeColor = "success" | "error" | "warning" | "info" | "primary"

interface SummaryCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  badge?: { label: string; color: BadgeColor }
}

export default function SummaryCard({ title, value, icon, badge }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
        {icon}
      </div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {title}
      </p>
      <div className="flex items-center gap-2">
        {badge ? (
          <Badge size="sm" color={badge.color}>{badge.label}</Badge>
        ) : (
          <span className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {value}
          </span>
        )}
      </div>
    </div>
  )
}
