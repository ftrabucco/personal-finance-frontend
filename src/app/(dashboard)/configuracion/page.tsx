'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Tag, Wallet, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  useCategoriasEditables,
  useCreateCategoria,
  useUpdateCategoria,
  useDeleteCategoria,
  useToggleCategoriaActivo,
} from '@/lib/hooks/useCategoriasEditables'
import {
  useFuentesIngresoEditables,
  useCreateFuenteIngreso,
  useUpdateFuenteIngreso,
  useDeleteFuenteIngreso,
  useToggleFuenteIngresoActivo,
} from '@/lib/hooks/useFuentesIngresoEditables'
import type { Categoria, FuenteIngreso } from '@/types'

// Common emoji options for categories
const EMOJI_OPTIONS = ['📦', '🏠', '🛒', '🚗', '💊', '🎯', '🎮', '💳', '👥', '🐕', '💰', '📱', '🎓', '✈️', '🍔', '☕']

interface CategoriaFormData {
  nombre_categoria: string
  icono: string
}

interface FuenteFormData {
  nombre: string
  icono: string
}

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState('categorias')
  const [showInactive, setShowInactive] = useState(false)

  // Categorias state
  const [isCategoriaDialogOpen, setIsCategoriaDialogOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [categoriaForm, setCategoriaForm] = useState<CategoriaFormData>({ nombre_categoria: '', icono: '' })

  // Fuentes state
  const [isFuenteDialogOpen, setIsFuenteDialogOpen] = useState(false)
  const [editingFuente, setEditingFuente] = useState<FuenteIngreso | null>(null)
  const [fuenteForm, setFuenteForm] = useState<FuenteFormData>({ nombre: '', icono: '' })

  // Queries
  const { data: categorias = [], isLoading: loadingCategorias } = useCategoriasEditables(showInactive)
  const { data: fuentes = [], isLoading: loadingFuentes } = useFuentesIngresoEditables(showInactive)

  // Mutations - Categorias
  const createCategoriaMutation = useCreateCategoria()
  const updateCategoriaMutation = useUpdateCategoria()
  const deleteCategoriaMutation = useDeleteCategoria()
  const toggleCategoriaMutation = useToggleCategoriaActivo()

  // Mutations - Fuentes
  const createFuenteMutation = useCreateFuenteIngreso()
  const updateFuenteMutation = useUpdateFuenteIngreso()
  const deleteFuenteMutation = useDeleteFuenteIngreso()
  const toggleFuenteMutation = useToggleFuenteIngresoActivo()

  // Categorias handlers
  const handleCreateCategoria = () => {
    setEditingCategoria(null)
    setCategoriaForm({ nombre_categoria: '', icono: '' })
    setIsCategoriaDialogOpen(true)
  }

  const handleEditCategoria = (categoria: Categoria) => {
    if (categoria.es_sistema) {
      toast.error('Las categorias del sistema no se pueden editar')
      return
    }
    setEditingCategoria(categoria)
    setCategoriaForm({
      nombre_categoria: categoria.nombre_categoria,
      icono: categoria.icono || '',
    })
    setIsCategoriaDialogOpen(true)
  }

  const handleDeleteCategoria = async (categoria: Categoria) => {
    if (categoria.es_sistema) {
      toast.error('Las categorias del sistema no se pueden eliminar')
      return
    }
    if (window.confirm(`¿Eliminar la categoria "${categoria.nombre_categoria}"?`)) {
      try {
        await deleteCategoriaMutation.mutateAsync(categoria.id)
        toast.success('Categoria eliminada')
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error al eliminar'
        toast.error(errorMessage)
      }
    }
  }

  const handleToggleCategoria = async (categoria: Categoria) => {
    if (categoria.es_sistema) {
      toast.error('Las categorias del sistema no se pueden ocultar (por ahora)')
      return
    }
    try {
      await toggleCategoriaMutation.mutateAsync(categoria.id)
      toast.success(categoria.activo ? 'Categoria ocultada' : 'Categoria visible')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar estado'
      toast.error(errorMessage)
    }
  }

  const handleSubmitCategoria = async () => {
    if (!categoriaForm.nombre_categoria.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    try {
      if (editingCategoria) {
        await updateCategoriaMutation.mutateAsync({
          id: editingCategoria.id,
          data: {
            nombre_categoria: categoriaForm.nombre_categoria,
            icono: categoriaForm.icono || undefined,
          },
        })
        toast.success('Categoria actualizada')
      } else {
        await createCategoriaMutation.mutateAsync({
          nombre_categoria: categoriaForm.nombre_categoria,
          icono: categoriaForm.icono || undefined,
        })
        toast.success('Categoria creada')
      }
      setIsCategoriaDialogOpen(false)
      setEditingCategoria(null)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar'
      toast.error(errorMessage)
    }
  }

  // Fuentes handlers
  const handleCreateFuente = () => {
    setEditingFuente(null)
    setFuenteForm({ nombre: '', icono: '' })
    setIsFuenteDialogOpen(true)
  }

  const handleEditFuente = (fuente: FuenteIngreso) => {
    if (fuente.es_sistema) {
      toast.error('Las fuentes del sistema no se pueden editar')
      return
    }
    setEditingFuente(fuente)
    setFuenteForm({
      nombre: fuente.nombre,
      icono: fuente.icono || '',
    })
    setIsFuenteDialogOpen(true)
  }

  const handleDeleteFuente = async (fuente: FuenteIngreso) => {
    if (fuente.es_sistema) {
      toast.error('Las fuentes del sistema no se pueden eliminar')
      return
    }
    if (window.confirm(`¿Eliminar la fuente "${fuente.nombre}"?`)) {
      try {
        await deleteFuenteMutation.mutateAsync(fuente.id)
        toast.success('Fuente eliminada')
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error al eliminar'
        toast.error(errorMessage)
      }
    }
  }

  const handleToggleFuente = async (fuente: FuenteIngreso) => {
    if (fuente.es_sistema) {
      toast.error('Las fuentes del sistema no se pueden ocultar (por ahora)')
      return
    }
    try {
      await toggleFuenteMutation.mutateAsync(fuente.id)
      toast.success(fuente.activo ? 'Fuente ocultada' : 'Fuente visible')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar estado'
      toast.error(errorMessage)
    }
  }

  const handleSubmitFuente = async () => {
    if (!fuenteForm.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    try {
      if (editingFuente) {
        await updateFuenteMutation.mutateAsync({
          id: editingFuente.id,
          data: {
            nombre: fuenteForm.nombre,
            icono: fuenteForm.icono || undefined,
          },
        })
        toast.success('Fuente actualizada')
      } else {
        await createFuenteMutation.mutateAsync({
          nombre: fuenteForm.nombre,
          icono: fuenteForm.icono || undefined,
        })
        toast.success('Fuente creada')
      }
      setIsFuenteDialogOpen(false)
      setEditingFuente(null)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar'
      toast.error(errorMessage)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Configuracion</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Personaliza tus categorias de gastos y fuentes de ingreso
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
          {showInactive ? 'Ocultar inactivos' : 'Mostrar inactivos'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categorias" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="fuentes" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Fuentes de Ingreso
          </TabsTrigger>
        </TabsList>

        {/* Categorias Tab */}
        <TabsContent value="categorias" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Categorias de Gastos
                </CardTitle>
                <CardDescription>
                  Las categorias del sistema no se pueden modificar. Crea las tuyas propias.
                </CardDescription>
              </div>
              <Button onClick={handleCreateCategoria} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nueva
              </Button>
            </CardHeader>
            <CardContent>
              {loadingCategorias ? (
                <div className="text-center py-8">Cargando...</div>
              ) : (
                <>
                  {/* Mobile view */}
                  <div className="space-y-2 md:hidden">
                    {categorias.map((cat) => (
                      <div
                        key={cat.id}
                        className={`flex items-center justify-between rounded-lg border p-3 ${!cat.activo ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{cat.icono || '📦'}</span>
                          <div>
                            <div className="font-medium">{cat.nombre_categoria}</div>
                            <div className="flex items-center gap-2">
                              {cat.es_sistema && (
                                <Badge variant="secondary" className="text-xs">
                                  <Lock className="mr-1 h-3 w-3" />
                                  Sistema
                                </Badge>
                              )}
                              {!cat.activo && <Badge variant="outline" className="text-xs">Oculta</Badge>}
                            </div>
                          </div>
                        </div>
                        {!cat.es_sistema && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleToggleCategoria(cat)}>
                              {cat.activo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditCategoria(cat)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCategoria(cat)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Desktop view */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Icono</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categorias.map((cat) => (
                          <TableRow key={cat.id} className={!cat.activo ? 'opacity-50' : ''}>
                            <TableCell className="text-xl">{cat.icono || '📦'}</TableCell>
                            <TableCell className="font-medium">{cat.nombre_categoria}</TableCell>
                            <TableCell>
                              {cat.es_sistema ? (
                                <Badge variant="secondary">
                                  <Lock className="mr-1 h-3 w-3" />
                                  Sistema
                                </Badge>
                              ) : (
                                <Badge variant="outline">Personalizada</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={cat.activo ? 'default' : 'secondary'}>
                                {cat.activo ? 'Activa' : 'Oculta'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {!cat.es_sistema && (
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleToggleCategoria(cat)}>
                                    {cat.activo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleEditCategoria(cat)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCategoria(cat)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fuentes Tab */}
        <TabsContent value="fuentes" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Fuentes de Ingreso
                </CardTitle>
                <CardDescription>
                  Las fuentes del sistema no se pueden modificar. Crea las tuyas propias.
                </CardDescription>
              </div>
              <Button onClick={handleCreateFuente} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nueva
              </Button>
            </CardHeader>
            <CardContent>
              {loadingFuentes ? (
                <div className="text-center py-8">Cargando...</div>
              ) : (
                <>
                  {/* Mobile view */}
                  <div className="space-y-2 md:hidden">
                    {fuentes.map((fuente) => (
                      <div
                        key={fuente.id}
                        className={`flex items-center justify-between rounded-lg border p-3 ${!fuente.activo ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{fuente.icono || '💰'}</span>
                          <div>
                            <div className="font-medium">{fuente.nombre}</div>
                            <div className="flex items-center gap-2">
                              {fuente.es_sistema && (
                                <Badge variant="secondary" className="text-xs">
                                  <Lock className="mr-1 h-3 w-3" />
                                  Sistema
                                </Badge>
                              )}
                              {!fuente.activo && <Badge variant="outline" className="text-xs">Oculta</Badge>}
                            </div>
                          </div>
                        </div>
                        {!fuente.es_sistema && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleToggleFuente(fuente)}>
                              {fuente.activo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditFuente(fuente)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteFuente(fuente)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Desktop view */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Icono</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fuentes.map((fuente) => (
                          <TableRow key={fuente.id} className={!fuente.activo ? 'opacity-50' : ''}>
                            <TableCell className="text-xl">{fuente.icono || '💰'}</TableCell>
                            <TableCell className="font-medium">{fuente.nombre}</TableCell>
                            <TableCell>
                              {fuente.es_sistema ? (
                                <Badge variant="secondary">
                                  <Lock className="mr-1 h-3 w-3" />
                                  Sistema
                                </Badge>
                              ) : (
                                <Badge variant="outline">Personalizada</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={fuente.activo ? 'default' : 'secondary'}>
                                {fuente.activo ? 'Activa' : 'Oculta'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {!fuente.es_sistema && (
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleToggleFuente(fuente)}>
                                    {fuente.activo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleEditFuente(fuente)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteFuente(fuente)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Categoria Dialog */}
      <Dialog open={isCategoriaDialogOpen} onOpenChange={setIsCategoriaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategoria ? 'Editar Categoria' : 'Nueva Categoria'}
            </DialogTitle>
            <DialogDescription>
              Crea una categoria personalizada para organizar tus gastos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre_categoria">Nombre</Label>
              <Input
                id="nombre_categoria"
                value={categoriaForm.nombre_categoria}
                onChange={(e) => setCategoriaForm({ ...categoriaForm, nombre_categoria: e.target.value })}
                placeholder="Ej: Mascotas, Viajes..."
              />
            </div>
            <div className="space-y-2">
              <Label>Icono</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`text-2xl p-2 rounded-lg hover:bg-accent ${categoriaForm.icono === emoji ? 'bg-accent ring-2 ring-primary' : ''}`}
                    onClick={() => setCategoriaForm({ ...categoriaForm, icono: emoji })}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCategoriaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitCategoria}
                disabled={createCategoriaMutation.isPending || updateCategoriaMutation.isPending}
              >
                {editingCategoria ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fuente Dialog */}
      <Dialog open={isFuenteDialogOpen} onOpenChange={setIsFuenteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFuente ? 'Editar Fuente' : 'Nueva Fuente de Ingreso'}
            </DialogTitle>
            <DialogDescription>
              Crea una fuente personalizada para organizar tus ingresos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre_fuente">Nombre</Label>
              <Input
                id="nombre_fuente"
                value={fuenteForm.nombre}
                onChange={(e) => setFuenteForm({ ...fuenteForm, nombre: e.target.value })}
                placeholder="Ej: Bonos, Propinas..."
              />
            </div>
            <div className="space-y-2">
              <Label>Icono</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`text-2xl p-2 rounded-lg hover:bg-accent ${fuenteForm.icono === emoji ? 'bg-accent ring-2 ring-primary' : ''}`}
                    onClick={() => setFuenteForm({ ...fuenteForm, icono: emoji })}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsFuenteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitFuente}
                disabled={createFuenteMutation.isPending || updateFuenteMutation.isPending}
              >
                {editingFuente ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
