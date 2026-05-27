import {
  BloomoraAlertDialog,
  type BloomoraAlertDialogProps,
  type BloomoraAlertDialogTone,
} from '@/components/ui/BloomoraAlertDialog'

export type BloomoraConfirmDialogProps = Omit<
  BloomoraAlertDialogProps,
  'variant'
>

export type { BloomoraAlertDialogTone }

/**
 * Confirmación modal (cancelar + confirmar). Alias de {@link BloomoraAlertDialog}.
 */
export function BloomoraConfirmDialog(props: BloomoraConfirmDialogProps) {
  return <BloomoraAlertDialog variant="confirm" {...props} />
}
