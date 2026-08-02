import { useState } from 'react'
import { toast } from 'sonner'
import { Check, PencilSimple, Plus, Tag, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useCategories, useCreateCategory, useUpdateCategory } from '@/hooks/useProducts'

/**
 * Self-contained "Kelola Kategori" dialog — owns its own trigger and state,
 * so callers just drop <CategoryManager /> in wherever the button belongs.
 */
export function CategoryManager() {
  const { data: categories, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()

  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  async function handleAdd() {
    const nama = newName.trim()
    if (!nama) return
    try {
      await createCategory.mutateAsync({ nama })
      toast.success('Kategori ditambahkan', { description: nama })
      setNewName('')
    } catch (err) {
      toast.error('Gagal menambah kategori', {
        description: err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.',
      })
    }
  }

  function startEdit(id: string, currentName: string) {
    setEditingId(id)
    setEditingName(currentName)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingName('')
  }

  async function handleSaveEdit() {
    const nama = editingName.trim()
    if (!editingId || !nama) return
    try {
      await updateCategory.mutateAsync({ id: editingId, nama })
      toast.success('Kategori diperbarui')
      cancelEdit()
    } catch (err) {
      toast.error('Gagal memperbarui kategori', {
        description: err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.',
      })
    }
  }

  return (
    <Dialog onOpenChange={(open) => !open && cancelEdit()}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Tag size={18} weight="bold" data-icon="inline-start" />
          Kelola Kategori
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kelola Kategori</DialogTitle>
          <DialogDescription>Tambah atau ubah nama kategori produk.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-0">
          {isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Memuat…</p>
          ) : !categories || categories.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Belum ada kategori.</p>
          ) : (
            categories.map((c, idx) => (
              <div key={c.id}>
                {idx > 0 && <Separator />}
                <div className="flex items-center gap-2 py-2">
                  {editingId === c.id ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-9 flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleSaveEdit()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleSaveEdit}
                        disabled={updateCategory.isPending || !editingName.trim()}
                        aria-label="Simpan"
                      >
                        <Check size={16} weight="bold" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={cancelEdit}
                        aria-label="Batal"
                      >
                        <X size={16} weight="bold" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="flex-1 truncate text-sm text-foreground">{c.nama}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => startEdit(c.id, c.nama)}
                        aria-label={`Edit ${c.nama}`}
                      >
                        <PencilSimple size={16} weight="bold" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <Separator />

        <div className="flex items-center gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nama kategori baru…"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAdd()
              }
            }}
          />
          <Button
            type="button"
            onClick={handleAdd}
            disabled={createCategory.isPending || !newName.trim()}
          >
            <Plus size={18} weight="bold" data-icon="inline-start" />
            Tambah
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
