import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Barcode,
  CheckCircle,
  Minus,
  Plus,
  ShoppingCartSimple,
  Trash,
} from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import { useProducts } from '@/hooks/useProducts'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { useSessionStore } from '@/store/session'
import { getUsers } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { MetodeBayar, Product } from '@/types'

interface CartItem {
  product: Product
  qty: number
}

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

const metodeBayarLabel: Record<MetodeBayar, string> = {
  tunai: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer',
  kartu_debit: 'Kartu Debit',
}

export default function Jual() {
  const { data: products } = useProducts()
  const currentUserName = useSessionStore((s) => s.currentUserName)
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const currentUser = users?.find((u) => u.nama === currentUserName)
  const createTransaction = useCreateTransaction()

  const [cart, setCart] = useState<CartItem[]>([])
  const cartRef = useRef<CartItem[]>(cart)
  useEffect(() => {
    cartRef.current = cart
  }, [cart])
  const [manualBarcode, setManualBarcode] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [metodeBayar, setMetodeBayar] = useState<MetodeBayar>('tunai')
  const [dibayarInput, setDibayarInput] = useState('')

  const cartTotal = cart.reduce((sum, item) => sum + item.product.harga_jual * item.qty, 0)
  const dibayar = metodeBayar === 'tunai' ? Number(dibayarInput || 0) : cartTotal
  const kembalian = Math.max(dibayar - cartTotal, 0)
  const canConfirm = cart.length > 0 && dibayar >= cartTotal

  function addToCart(product: Product) {
    const existing = cartRef.current.find((i) => i.product.id === product.id)
    const nextQty = (existing?.qty ?? 0) + 1

    if (nextQty > product.stok) {
      toast.error(`Stok ${product.nama} tidak cukup`, { description: `Sisa stok: ${product.stok}` })
      return
    }

    const next = existing
      ? cartRef.current.map((i) => (i.product.id === product.id ? { ...i, qty: nextQty } : i))
      : [...cartRef.current, { product, qty: 1 }]
    cartRef.current = next
    setCart(next)
    toast.success(product.nama, { description: 'Ditambahkan ke keranjang' })
  }

  function handleScan(code: string) {
    const product = products?.find((p) => p.barcode === code)
    if (!product) {
      toast.error('Barcode tidak ditemukan', { description: code })
      return
    }
    addToCart(product)
  }

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault()
    const code = manualBarcode.trim()
    if (!code) return
    handleScan(code)
    setManualBarcode('')
  }

  function incrementQty(productId: string) {
    setCart((prev) =>
      prev.map((i) => {
        if (i.product.id !== productId) return i
        if (i.qty + 1 > i.product.stok) return i
        return { ...i, qty: i.qty + 1 }
      }),
    )
  }

  function decrementQty(productId: string) {
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === productId ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0),
    )
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId))
  }

  function handleOpenCheckout() {
    setMetodeBayar('tunai')
    setDibayarInput(String(cartTotal))
    setCheckoutOpen(true)
  }

  async function handleConfirmPayment() {
    if (!currentUser) {
      toast.error('Sesi pengguna tidak ditemukan', { description: 'Silakan login ulang.' })
      return
    }
    try {
      const tx = await createTransaction.mutateAsync({
        user_id: currentUser.id,
        metode_bayar: metodeBayar,
        dibayar,
        items: cart.map((item) => ({
          product_id: item.product.id,
          qty: item.qty,
          harga: item.product.harga_jual,
        })),
      })
      toast.success(`Transaksi ${tx.no_nota} berhasil`, {
        description: kembalian > 0 ? `Kembalian: ${formatRupiah(kembalian)}` : 'Dibayar pas.',
      })
      setCart([])
      setCheckoutOpen(false)
      setDibayarInput('')
    } catch (err) {
      toast.error('Transaksi gagal', {
        description: err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.',
      })
    }
  }

  return (
    <div className="px-4 py-6 pb-28">
      <h1 className="text-xl font-semibold text-foreground">Jual</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Scan barcode produk, lalu proses pembayaran.
      </p>

      <div className="mt-4">
        <BarcodeScanner active={!checkoutOpen} onScan={handleScan} />
      </div>

      <form onSubmit={handleManualSubmit} className="mt-3 flex gap-2">
        <Input
          value={manualBarcode}
          onChange={(e) => setManualBarcode(e.target.value)}
          placeholder="Atau ketik barcode manual…"
          inputMode="numeric"
          aria-label="Barcode manual"
        />
        <Button type="submit" variant="outline">
          <Barcode size={18} weight="bold" data-icon="inline-start" />
          Tambah
        </Button>
      </form>

      <div className="mt-6">
        <h2 className="text-sm font-medium text-foreground">
          Keranjang{cart.length > 0 ? ` (${cart.length})` : ''}
        </h2>
        <Card className="mt-2">
          <CardContent className="flex flex-col gap-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <ShoppingCartSimple size={20} weight="bold" className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Keranjang masih kosong. Scan produk untuk mulai.
                </p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={item.product.id}>
                  {idx > 0 && <Separator />}
                  <div className="flex items-center gap-2.5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.product.nama}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRupiah(item.product.harga_jual)} / pcs
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => decrementQty(item.product.id)}
                        aria-label={`Kurangi ${item.product.nama}`}
                      >
                        <Minus size={14} weight="bold" />
                      </Button>
                      <span className="w-5 text-center text-sm font-medium tabular-nums">
                        {item.qty}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => incrementQty(item.product.id)}
                        disabled={item.qty >= item.product.stok}
                        aria-label={`Tambah ${item.product.nama}`}
                      >
                        <Plus size={14} weight="bold" />
                      </Button>
                    </div>
                    <p className="w-20 shrink-0 text-right text-sm font-medium text-foreground">
                      {formatRupiah(item.product.harga_jual * item.qty)}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeFromCart(item.product.id)}
                      aria-label={`Hapus ${item.product.nama}`}
                      className="text-destructive"
                    >
                      <Trash size={14} weight="bold" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background px-4 py-3">
          <Button type="button" className="w-full justify-between" size="lg" onClick={handleOpenCheckout}>
            <span>Bayar</span>
            <span>{formatRupiah(cartTotal)}</span>
          </Button>
        </div>
      )}

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
            <DialogDescription>
              {cart.length} item &middot; Total {formatRupiah(cartTotal)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div>
              <Label htmlFor="metode-bayar">Metode Pembayaran</Label>
              <Select
                value={metodeBayar}
                onValueChange={(v) => {
                  setMetodeBayar(v as MetodeBayar)
                  setDibayarInput(String(cartTotal))
                }}
              >
                <SelectTrigger id="metode-bayar" className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(metodeBayarLabel) as MetodeBayar[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {metodeBayarLabel[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {metodeBayar === 'tunai' && (
              <div>
                <Label htmlFor="dibayar">Uang Diterima</Label>
                <Input
                  id="dibayar"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="mt-1.5"
                  value={dibayarInput}
                  onChange={(e) => setDibayarInput(e.target.value)}
                  placeholder={String(cartTotal)}
                />
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium text-foreground">{formatRupiah(cartTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Kembalian</span>
              <span
                className={cn(
                  'font-medium',
                  kembalian > 0 ? 'text-status-aman-fg' : 'text-foreground',
                )}
              >
                {formatRupiah(kembalian)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              className="w-full"
              disabled={!canConfirm || createTransaction.isPending}
              onClick={handleConfirmPayment}
            >
              <CheckCircle size={18} weight="bold" data-icon="inline-start" />
              {createTransaction.isPending ? 'Memproses…' : 'Konfirmasi Pembayaran'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
