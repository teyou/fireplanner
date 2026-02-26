import { useEffect } from 'react'

const BASE_URL = 'https://sgfireplanner.com'

interface PageMeta {
  title: string
  description?: string
  /** Route path, e.g. '/reference'. Defaults to '/' */
  path?: string
}

function setMetaContent(selector: string, content: string): string {
  const el = document.querySelector(selector)
  if (!el) return ''
  const prev = el.getAttribute('content') ?? ''
  el.setAttribute('content', content)
  return prev
}

export function usePageMeta({ title, description, path = '/' }: PageMeta) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    const canonicalUrl = `${BASE_URL}${path}`

    // Description
    let prevDesc = ''
    if (description) {
      prevDesc = setMetaContent('meta[name="description"]', description)
    }

    // Canonical
    const canonicalEl = document.querySelector('link[rel="canonical"]')
    const prevCanonical = canonicalEl?.getAttribute('href') ?? ''
    canonicalEl?.setAttribute('href', canonicalUrl)

    // Open Graph
    const prevOgTitle = setMetaContent('meta[property="og:title"]', title)
    const prevOgDesc = description
      ? setMetaContent('meta[property="og:description"]', description)
      : ''
    const prevOgUrl = setMetaContent('meta[property="og:url"]', canonicalUrl)

    // Twitter
    const prevTwitterTitle = setMetaContent('meta[name="twitter:title"]', title)
    const prevTwitterDesc = description
      ? setMetaContent('meta[name="twitter:description"]', description)
      : ''

    return () => {
      document.title = prevTitle
      if (description) {
        setMetaContent('meta[name="description"]', prevDesc)
        setMetaContent('meta[property="og:description"]', prevOgDesc)
        setMetaContent('meta[name="twitter:description"]', prevTwitterDesc)
      }
      canonicalEl?.setAttribute('href', prevCanonical)
      setMetaContent('meta[property="og:title"]', prevOgTitle)
      setMetaContent('meta[property="og:url"]', prevOgUrl)
      setMetaContent('meta[name="twitter:title"]', prevTwitterTitle)
    }
  }, [title, description, path])
}
