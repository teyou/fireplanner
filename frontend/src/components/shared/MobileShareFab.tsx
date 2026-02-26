import { useEffect, useRef, useState } from 'react'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { generateShareUrl } from '@/lib/shareUrl'
import { useUIStore } from '@/stores/useUIStore'

export function MobileShareFab() {
  const dismissedNudges = useUIStore((s) => s.dismissedNudges)
  const dismissNudge = useUIStore((s) => s.dismissNudge)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nudgeId = 'share-fab-tooltip'
  const alreadyDismissed = dismissedNudges.includes(nudgeId)

  // Show tooltip once on first encounter
  useEffect(() => {
    if (alreadyDismissed) return

    setTooltipOpen(true)
    timerRef.current = setTimeout(() => {
      setTooltipOpen(false)
      dismissNudge(nudgeId)
    }, 8000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [alreadyDismissed, dismissNudge])

  const handleDismiss = () => {
    setTooltipOpen(false)
    dismissNudge(nudgeId)
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const handleShare = async () => {
    const { url, tooLong } = generateShareUrl()

    if (tooLong) {
      toast.warning('URL is very long. Consider using JSON export for complex plans.', {
        duration: 5000,
      })
    }

    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({ url, title: 'My FIRE Plan' })
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        // Fall through to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Share link copied to clipboard')
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      toast.success('Share link copied to clipboard')
    }
  }

  return (
    <div className="fixed bottom-28 right-4 z-40 md:hidden">
      <Popover open={tooltipOpen} onOpenChange={(v) => { if (!v) handleDismiss() }}>
        <PopoverAnchor asChild>
          <Button
            size="icon"
            className="rounded-full shadow-lg h-10 w-10"
            onClick={handleShare}
            aria-label="Share your plan"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </PopoverAnchor>
        <PopoverContent
          side="left"
          sideOffset={8}
          className="w-auto max-w-[200px] px-3 py-2 text-sm"
        >
          Share your plan to continue on another device
        </PopoverContent>
      </Popover>
    </div>
  )
}
