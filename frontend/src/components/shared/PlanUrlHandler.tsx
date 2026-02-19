import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { getPlanFromUrl, decodeStoresFromUrl, applyStoreData, stripPlanFromUrl } from '@/lib/shareUrl'

export function PlanUrlHandler() {
  const [showDialog, setShowDialog] = useState(false)
  const [storeData, setStoreData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    const compressed = getPlanFromUrl()
    if (!compressed) return

    const data = decodeStoresFromUrl(compressed)
    if (data) {
      setStoreData(data)
      setShowDialog(true)
    } else {
      // Invalid data — just strip the param
      stripPlanFromUrl()
    }
  }, [])

  const handleConfirm = () => {
    if (storeData) {
      applyStoreData(storeData)
      stripPlanFromUrl()
      window.location.reload()
    }
  }

  const handleCancel = () => {
    setShowDialog(false)
    setStoreData(null)
    stripPlanFromUrl()
  }

  return (
    <AlertDialog open={showDialog} onOpenChange={(open) => { if (!open) handleCancel() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Import Shared Plan</AlertDialogTitle>
          <AlertDialogDescription>
            Someone shared a FIRE plan with you. Importing it will replace your current data with theirs.
            You can export your current data first if you want to keep a backup.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Import Plan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
