interface IngestionGuideCardProps {
  title?: string
  subtitle?: string
  steps: string[]
}

export default function IngestionGuideCard({
  title = "Tahapan Penggunaan",
  subtitle,
  steps,
}: IngestionGuideCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 dark:border-white/5 dark:bg-white/3">
      <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3>
      {subtitle && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
      <ol className="mt-3 space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300 list-decimal">
        {steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </div>
  )
}
