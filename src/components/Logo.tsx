export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight select-none ${className}`}>
      Bubble<span className="text-[var(--c-purple)]"> MCP</span>
    </span>
  )
}
