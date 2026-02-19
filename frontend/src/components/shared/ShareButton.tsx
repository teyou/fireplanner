import { useState } from 'react'
import { Share2, Check, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { generateShareUrl } from '@/lib/shareUrl'

export function ShareButton() {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const { url, tooLong } = generateShareUrl()

    if (tooLong) {
      toast.warning('URL is very long. Consider using JSON export for complex plans.', {
        duration: 5000,
      })
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Share link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select+copy via a temporary textarea
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      toast.success('Share link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      title="Copy shareable link to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Share2 className="h-3.5 w-3.5" />
      )}
      Share
    </button>
  )
}
