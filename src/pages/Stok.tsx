import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowCircleDown,
  ArrowCircleUp,
  ArrowsClockwise,
  CaretRight,
  ClockCounterClockwise,
  MagnifyingGlass,
  Package,
  PencilSimple,
  Plus,
  Printer,
  Tag,
} from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import {
  useCategories,
  useCreateProduct,
  useGenerateBarcode,
  useProduct,
  useProducts,
  useUpdateProduct,
} from '@/hooks/useProducts'
import { useAddStockMovement, useStockMovements } from '@/hooks/useStockMovements'
import { useSessionStore } from '@/store/session'
import { getUsers } from '@/lib/api'
import { getStockStatus, stockStatusLabel } from '@/lib/stock'
import { cn } from '@/lib/utils'
import { BarcodeLabel } from '@/components/BarcodeLabel'
import { CategoryManager } from '@/components/CategoryManager'
import type { StockStatus } from '@/types'

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusBadgeClass: Record<StockStatus, string> = {
  aman: 'bg-status-aman-bg text-status-aman-fg',
  menipis: 'bg-status-menipis-bg text-status-menipis-fg',
  habis: 'bg-status-habis-bg text-status-habis-fg',
}

type AdjustReason = 'rusak' | 'hilang' | 'koreksi_tambah' | 'koreksi_kurang'

const adjustReasonLabel: Record<AdjustReason, string> = {
  rusak: 'Rusak',
  hilang: 'Hilang',
  koreksi_tambah: 'Koreksi Tambah (stok fisik lebih)',
  koreksi_kurang: 'Koreksi Kurang (stok fisik kurang)',
}

const adjustReasonSign: Record<AdjustReason, 1 | -1> = {
  rusak: -1,
  hilang: -1,
  koreksi_tambah: 1,
  koreksi_kurang: -1,
}

export default function Stok() {
  const currentRole = useSessionStore((s) => s.currentRole)
  const currentUserName = useSessionStore((s) => s.currentUserName)
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const currentUser = users?.find((u) => u.nama === currentUserName)
  // Product edit (incl. harga_modal) is available to both roles that can reach this screen.
  const canEditProduct = currentRole === 'owner' || currentRole === 'staff_gudang'
  const canSeeModal = canEditProduct

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<StockStatus | 'all'>('all')

  const { data: categories } = useCategories()
  const { data: products, isLoading } = useProducts({
    search: search.trim() || undefined,
    category_id: categoryId === 'all' ? undefined : categoryId,
  })
  const filteredProducts = (products ?? []).filter(
    (p) => statusFilter === 'all' || getStockStatus(p) === statusFilter,
  )

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const { data: selectedProduct } = useProduct(selectedProductId ?? undefined)
  const { data: movements } = useStockMovements(selectedProductId ?? undefined)

  const [movementOpen, setMovementOpen] = useState(false)
  const [movementMode, setMovementMode] = useState<'in' | 'adjust'>('in')
  const [qtyInput, setQtyInput] = useState('')
  const [catatanInput, setCatatanInput] = useState('')
  const [adjustReason, setAdjustReason] = useState<AdjustReason>('rusak')
  const addStockMovement = useAddStockMovement()
  const updateProduct = useUpdateProduct()

  const [editOpen, setEditOpen] = useState(false)
  const [editNama, setEditNama] = useState('')
  const [editHargaModal, setEditHargaModal] = useState('')
  const [editHargaJual, setEditHargaJual] = useState('')
  const [editStok, setEditStok] = useState('')

  const [barcodeOpen, setBarcodeOpen] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [createNama, setCreateNama] = useState('')
  const [createBarcode, setCreateBarcode] = useState('')
  const [createCategoryId, setCreateCategoryId] = useState('')
  const [createHargaModal, setCreateHargaModal] = useState('')
  const [createHargaJual, setCreateHargaJual] = useState('')
  const [createStok, setCreateStok] = useState('0')
  const [createStokMin, setCreateStokMin] = useState('5')
  const createProduct = useCreateProduct()
  const generateBarcode = useGenerateBarcode()

  function regenerateBarcode() {
    setCreateBarcode('')
    generateBarcode.mutate(undefined, {
      onSuccess: (barcode) => setCreateBarcode(barcode),
    })
  }

  function openCreateDialog() {
    setCreateNama('')
    setCreateCategoryId(categories?.[0]?.id ?? '')
    setCreateHargaModal('')
    setCreateHargaJual('')
    setCreateStok('0')
    setCreateStokMin('5')
    setCreateOpen(true)
    regenerateBarcode()
  }

  async function handleSubmitCreate() {
    if (!currentUser) {
      toast.error('Sesi pengguna tidak ditemukan', { description: 'Silakan login ulang.' })
      return
    }
    const nama = createNama.trim()
    const barcode = createBarcode.trim()
    const hargaModal = Number(createHargaModal)
    const hargaJual = Number(createHargaJual)
    const stok = Number(createStok)
    const stokMin = Number(createStokMin)

    if (!nama) {
      toast.error('Nama produk tidak boleh kosong')
      return
    }
    if (!barcode) {
      toast.error('Barcode belum siap', { description: 'Tunggu sebentar atau tekan acak ulang.' })
      return
    }
    if (!createCategoryId) {
      toast.error('Pilih kategori produk')
      return
    }
    if (!Number.isFinite(hargaModal) || hargaModal < 0 || !Number.isFinite(hargaJual) || hargaJual < 0) {
      toast.error('Harga modal dan harga jual harus berupa angka yang valid')
      return
    }
    if (!Number.isInteger(stok) || stok < 0 || !Number.isInteger(stokMin) || stokMin < 0) {
      toast.error('Stok dan stok minimum harus berupa angka bulat, minimal 0')
      return
    }

    try {
      await createProduct.mutateAsync({
        nama,
        barcode,
        category_id: createCategoryId,
        harga_modal: hargaModal,
        harga_jual: hargaJual,
        stok,
        stok_min: stokMin,
        user_id: currentUser.id,
      })
      toast.success('Produk ditambahkan', { description: nama })
      setCreateOpen(false)
    } catch (err) {
      toast.error('Gagal menambah produk', {
        description: err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.',
      })
    }
  }

  function openEditDialog() {
    if (!selectedProduct) return
    setEditNama(selectedProduct.nama)
    setEditHargaModal(String(selectedProduct.harga_modal))
    setEditHargaJual(String(selectedProduct.harga_jual))
    setEditStok(String(selectedProduct.stok))
    setEditOpen(true)
  }

  async function handleSubmitEdit() {
    if (!selectedProduct || !currentUser) {
      toast.error('Sesi pengguna tidak ditemukan', { description: 'Silakan login ulang.' })
      return
    }
    const nama = editNama.trim()
    const hargaModal = Number(editHargaModal)
    const hargaJual = Number(editHargaJual)
    const stokBaru = Number(editStok)

    if (!nama) {
      toast.error('Nama produk tidak boleh kosong')
      return
    }
    if (!Number.isFinite(hargaModal) || hargaModal < 0 || !Number.isFinite(hargaJual) || hargaJual < 0) {
      toast.error('Harga modal dan harga jual harus berupa angka yang valid')
      return
    }
    if (!Number.isInteger(stokBaru) || stokBaru < 0) {
      toast.error('Stok harus berupa angka bulat, minimal 0')
      return
    }

    try {
      await updateProduct.mutateAsync({
        id: selectedProduct.id,
        nama,
        harga_modal: hargaModal,
        harga_jual: hargaJual,
      })

      const stokDelta = stokBaru - selectedProduct.stok
      if (stokDelta !== 0) {
        await addStockMovement.mutateAsync({
          product_id: selectedProduct.id,
          tipe: 'adjust',
          qty: stokDelta,
          user_id: currentUser.id,
          catatan: 'Koreksi via edit produk',
        })
      }

      toast.success('Produk diperbarui', { description: nama })
      setEditOpen(false)
    } catch (err) {
      toast.error('Gagal menyimpan perubahan', {
        description: err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.',
      })
    }
  }

  function handlePrintBarcode() {
    window.print()
  }

  function openMovementDialog(mode: 'in' | 'adjust') {
    setMovementMode(mode)
    setQtyInput('')
    setCatatanInput('')
    setAdjustReason('rusak')
    setMovementOpen(true)
  }

  async function handleSubmitMovement() {
    if (!selectedProduct || !currentUser) {
      toast.error('Sesi pengguna tidak ditemukan', { description: 'Silakan login ulang.' })
      return
    }
    const magnitude = Number(qtyInput)
    if (!magnitude || magnitude <= 0) {
      toast.error('Jumlah harus lebih dari 0')
      return
    }

    const signedQty = movementMode === 'in' ? magnitude : magnitude * adjustReasonSign[adjustReason]
    const catatan =
      movementMode === 'in'
        ? catatanInput.trim() || 'Barang masuk'
        : adjustReasonLabel[adjustReason]

    try {
      await addStockMovement.mutateAsync({
        product_id: selectedProduct.id,
        tipe: movementMode === 'in' ? 'in' : 'adjust',
        qty: signedQty,
        user_id: currentUser.id,
        catatan,
      })
      toast.success(movementMode === 'in' ? 'Stok masuk dicatat' : 'Penyesuaian stok dicatat', {
        description: `${selectedProduct.nama}: ${signedQty > 0 ? '+' : ''}${signedQty} pcs`,
      })
      setMovementOpen(false)
    } catch (err) {
      toast.error('Gagal menyimpan', {
        description: err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.',
      })
    }
  }

  const statusFilters: { value: StockStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Semua' },
    { value: 'aman', label: 'Aman' },
    { value: 'menipis', label: 'Menipis' },
    { value: 'habis', label: 'Habis' },
  ]

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-semibold text-foreground">Stok</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Daftar produk, status stok, dan pencatatan pergerakan barang.
      </p>

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={16}
            weight="bold"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau barcode…"
            className="pl-9"
            aria-label="Cari produk"
          />
        </div>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-32 shrink-0" aria-label="Filter kategori">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'shrink-0 rounded-4xl border px-3 py-1 text-xs font-medium transition-colors',
              statusFilter === f.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {canEditProduct && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button type="button" onClick={openCreateDialog}>
            <Plus size={18} weight="bold" data-icon="inline-start" />
            Tambah Produk
          </Button>
          <CategoryManager />
        </div>
      )}

      <div className="mt-4">
        <Card>
          <CardContent className="flex flex-col gap-0">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Memuat…</p>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Package size={20} weight="bold" className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Tidak ada produk yang cocok.</p>
              </div>
            ) : (
              filteredProducts.map((product, idx) => {
                const status = getStockStatus(product)
                return (
                  <div key={product.id}>
                    {idx > 0 && <Separator />}
                    <button
                      type="button"
                      onClick={() => setSelectedProductId(product.id)}
                      className="flex w-full items-center gap-3 py-2.5 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {product.nama}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRupiah(product.harga_jual)} &middot; Stok {product.stok}
                        </p>
                      </div>
                      <Badge className={cn('shrink-0 border-0', statusBadgeClass[status])}>
                        {stockStatusLabel[status]}
                      </Badge>
                      <CaretRight size={16} weight="bold" className="shrink-0 text-muted-foreground" />
                    </button>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product detail sheet */}
      <Sheet open={selectedProductId !== null} onOpenChange={(open) => !open && setSelectedProductId(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
          {selectedProduct && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedProduct.nama}</SheetTitle>
                <SheetDescription>Barcode {selectedProduct.barcode}</SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-4 px-4 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border p-3">
                    <p className="text-xs text-muted-foreground">Harga Jual</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {formatRupiah(selectedProduct.harga_jual)}
                    </p>
                  </div>
                  {canSeeModal && (
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs text-muted-foreground">Harga Modal</p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        {formatRupiah(selectedProduct.harga_modal)}
                      </p>
                    </div>
                  )}
                  <div className="rounded-xl border border-border p-3">
                    <p className="text-xs text-muted-foreground">Stok Saat Ini</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {selectedProduct.stok} pcs
                    </p>
                  </div>
                  <div className="rounded-xl border border-border p-3">
                    <p className="text-xs text-muted-foreground">Stok Minimum</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {selectedProduct.stok_min} pcs
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="secondary" onClick={() => openMovementDialog('in')}>
                    <ArrowCircleUp size={18} weight="bold" data-icon="inline-start" />
                    Barang Masuk
                  </Button>
                  <Button type="button" variant="outline" onClick={() => openMovementDialog('adjust')}>
                    <PencilSimple size={18} weight="bold" data-icon="inline-start" />
                    Penyesuaian
                  </Button>
                  {canEditProduct && (
                    <Button type="button" variant="outline" onClick={openEditDialog}>
                      <Tag size={18} weight="bold" data-icon="inline-start" />
                      Edit Produk
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={() => setBarcodeOpen(true)}>
                    <Printer size={18} weight="bold" data-icon="inline-start" />
                    Cetak Barcode
                  </Button>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <ClockCounterClockwise size={16} weight="bold" className="text-foreground" />
                    <h3 className="text-sm font-medium text-foreground">Riwayat Pergerakan</h3>
                  </div>
                  <div className="mt-2 flex flex-col gap-0">
                    {!movements || movements.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        Belum ada riwayat.
                      </p>
                    ) : (
                      movements.slice(0, 15).map((m, idx) => (
                        <div key={m.id}>
                          {idx > 0 && <Separator />}
                          <div className="flex items-center gap-2.5 py-2">
                            {m.tipe === 'in' ? (
                              <ArrowCircleUp
                                size={18}
                                weight="bold"
                                className="shrink-0 text-status-aman-fg"
                              />
                            ) : m.tipe === 'out' ? (
                              <ArrowCircleDown
                                size={18}
                                weight="bold"
                                className="shrink-0 text-status-habis-fg"
                              />
                            ) : (
                              <PencilSimple
                                size={18}
                                weight="bold"
                                className="shrink-0 text-status-menipis-fg"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-foreground">
                                {m.catatan ?? '—'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatTanggal(m.created_at)}
                              </p>
                            </div>
                            <p
                              className={cn(
                                'shrink-0 text-sm font-medium tabular-nums',
                                m.tipe === 'out' || (m.tipe === 'adjust' && m.qty < 0)
                                  ? 'text-status-habis-fg'
                                  : 'text-status-aman-fg',
                              )}
                            >
                              {m.tipe === 'out' ? '-' : m.qty > 0 ? '+' : ''}
                              {m.qty}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Stock-in / adjustment dialog */}
      <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movementMode === 'in' ? 'Barang Masuk' : 'Penyesuaian Stok'}
            </DialogTitle>
            <DialogDescription>{selectedProduct?.nama}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {movementMode === 'adjust' && (
              <div>
                <Label htmlFor="adjust-reason">Alasan</Label>
                <Select value={adjustReason} onValueChange={(v) => setAdjustReason(v as AdjustReason)}>
                  <SelectTrigger id="adjust-reason" className="mt-1.5 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(adjustReasonLabel) as AdjustReason[]).map((r) => (
                      <SelectItem key={r} value={r}>
                        {adjustReasonLabel[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="qty">Jumlah (pcs)</Label>
              <Input
                id="qty"
                type="number"
                inputMode="numeric"
                min={1}
                className="mt-1.5"
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                placeholder="0"
              />
              {movementMode === 'adjust' && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Stok akan {adjustReasonSign[adjustReason] === 1 ? 'bertambah' : 'berkurang'} sebesar
                  jumlah ini.
                </p>
              )}
            </div>

            {movementMode === 'in' && (
              <div>
                <Label htmlFor="catatan">Catatan (opsional)</Label>
                <Input
                  id="catatan"
                  className="mt-1.5"
                  value={catatanInput}
                  onChange={(e) => setCatatanInput(e.target.value)}
                  placeholder="Mis. dari supplier A"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              className="w-full"
              disabled={addStockMovement.isPending}
              onClick={handleSubmitMovement}
            >
              {addStockMovement.isPending ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit product dialog — nama, harga_modal, harga_jual, stok */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Produk</DialogTitle>
            <DialogDescription>Barcode {selectedProduct?.barcode}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div>
              <Label htmlFor="edit-nama">Nama Produk</Label>
              <Input
                id="edit-nama"
                className="mt-1.5"
                value={editNama}
                onChange={(e) => setEditNama(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-modal">Harga Modal</Label>
                <Input
                  id="edit-modal"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="mt-1.5"
                  value={editHargaModal}
                  onChange={(e) => setEditHargaModal(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-jual">Harga Jual</Label>
                <Input
                  id="edit-jual"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="mt-1.5"
                  value={editHargaJual}
                  onChange={(e) => setEditHargaJual(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-stok">Stok</Label>
              <Input
                id="edit-stok"
                type="number"
                inputMode="numeric"
                min={0}
                className="mt-1.5"
                value={editStok}
                onChange={(e) => setEditStok(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Perubahan stok di sini otomatis tercatat sebagai penyesuaian di riwayat
                pergerakan.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              className="w-full"
              disabled={updateProduct.isPending || addStockMovement.isPending}
              onClick={handleSubmitEdit}
            >
              {updateProduct.isPending || addStockMovement.isPending ? 'Menyimpan…' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode label — printable via .print-barcode-label isolation in index.css */}
      <Dialog open={barcodeOpen} onOpenChange={setBarcodeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Barcode Produk</DialogTitle>
            <DialogDescription>
              Cetak dan tempel label ini pada kemasan produk.
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <BarcodeLabel value={selectedProduct.barcode} productName={selectedProduct.nama} />
          )}

          <DialogFooter>
            <Button type="button" className="w-full" onClick={handlePrintBarcode}>
              <Printer size={18} weight="bold" data-icon="inline-start" />
              Cetak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create product dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Produk</DialogTitle>
            <DialogDescription>Isi data produk baru.</DialogDescription>
          </DialogHeader>

          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
            <div>
              <Label htmlFor="create-nama">Nama Produk</Label>
              <Input
                id="create-nama"
                className="mt-1.5"
                value={createNama}
                onChange={(e) => setCreateNama(e.target.value)}
                placeholder="Mis. Casing Silikon iPhone 15"
              />
            </div>
            <div>
              <Label htmlFor="create-barcode">Barcode</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <div
                  id="create-barcode"
                  className="flex h-11 flex-1 items-center rounded-sm border border-input bg-muted px-2.5 text-sm text-foreground tabular-nums"
                >
                  {createBarcode || 'Membuat barcode…'}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={regenerateBarcode}
                  disabled={generateBarcode.isPending}
                  aria-label="Acak ulang barcode"
                >
                  <ArrowsClockwise size={18} weight="bold" />
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Dibuat otomatis agar tidak bentrok dengan barcode produk lain.
              </p>
            </div>
            <div>
              <Label htmlFor="create-kategori">Kategori</Label>
              <Select value={createCategoryId} onValueChange={setCreateCategoryId}>
                <SelectTrigger id="create-kategori" className="mt-1.5 w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!categories || categories.length === 0) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Belum ada kategori — tambah lewat "Kelola Kategori" dahulu.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="create-modal">Harga Modal</Label>
                <Input
                  id="create-modal"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="mt-1.5"
                  value={createHargaModal}
                  onChange={(e) => setCreateHargaModal(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="create-jual">Harga Jual</Label>
                <Input
                  id="create-jual"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="mt-1.5"
                  value={createHargaJual}
                  onChange={(e) => setCreateHargaJual(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="create-stok">Stok Awal</Label>
                <Input
                  id="create-stok"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="mt-1.5"
                  value={createStok}
                  onChange={(e) => setCreateStok(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="create-stok-min">Stok Minimum</Label>
                <Input
                  id="create-stok-min"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="mt-1.5"
                  value={createStokMin}
                  onChange={(e) => setCreateStokMin(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              className="w-full"
              disabled={createProduct.isPending || generateBarcode.isPending || !createBarcode}
              onClick={handleSubmitCreate}
            >
              {createProduct.isPending ? 'Menyimpan…' : 'Tambah Produk'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
