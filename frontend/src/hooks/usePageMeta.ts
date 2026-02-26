import { useEffect } from 'react'

export function usePageMeta({ title, description }: { title: string; description?: string }) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    let prevDesc = ''
    const descTag = document.querySelector('meta[name="description"]')
    if (descTag && description) {
      prevDesc = descTag.getAttribute('content') ?? ''
      descTag.setAttribute('content', description)
    }

    return () => {
      document.title = prevTitle
      if (descTag && description) descTag.setAttribute('content', prevDesc)
    }
  }, [title, description])
}
