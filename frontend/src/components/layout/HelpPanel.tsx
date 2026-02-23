import { useLocation } from 'react-router-dom'
import { X, ExternalLink } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/useUIStore'
import { HELP_FAQ } from '@/lib/data/helpContent'
import { getSourcesForRoute } from '@/lib/data/sources'

export function HelpPanel() {
  const { pathname } = useLocation()
  const toggleHelpPanel = useUIStore((s) => s.toggleHelpPanel)

  const faqItems = HELP_FAQ[pathname] ?? []
  const sources = getSourcesForRoute(pathname)

  return (
    <div className="h-full flex flex-col bg-muted/30 border-l">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h2 className="text-sm font-semibold">Help</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleHelpPanel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {faqItems.length > 0 ? (
          <Accordion type="multiple" className="w-full">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-sm text-muted-foreground">No help content for this page.</p>
        )}

        {/* Data Sources */}
        {sources.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Data Sources
            </h3>
            <ul className="space-y-1.5">
              {sources.map((src, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    {src.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <span className="ml-1 text-muted-foreground/60">({src.period})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
