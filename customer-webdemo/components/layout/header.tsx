'use client'

import { MapPin } from 'lucide-react'

interface HeaderProps {
  title: string
  showLocation?: boolean
}

export function Header({ title, showLocation = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
        {showLocation && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="truncate max-w-[120px]">Vĩnh Khánh, Q.4</span>
          </div>
        )}
      </div>
    </header>
  )
}
