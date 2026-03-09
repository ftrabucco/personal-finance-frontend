'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Tag, Wallet, Lock, Eye, EyeOff, LayoutGrid } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
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
import { useModulosDisponibles, useToggleModulo, usePreferencias } from '@/lib/hooks/usePreferencias'
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
  const [activeTab, setActiveTab] = useState('modulos')
  const [showInactive, setShowInactive] = useState(true)

  // Categorias state
  const [isCategoriaDialogOpen, setIsCategoriaDialogOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [categoriaForm, setCategoriaForm] = useState<CategoriaFormData>({ nombre_categoria: '', icono: '' })

  // Fuentes state
  const [isFuenteDialogOpen, setIsFuenteDialogOpen] = useState(false)
  const [editingFuente, setEditingFuente] = useState<FuenteIngreso | null>(null)
  const [fuenteForm, setFuenteForm] = useState<FuenteFormData>({ nombre: '', icono: '' })

  // Queries - always fetch all items (includeInactive=true) so we can show/hide them in UI
  const { data: allCategorias = [], isLoading: loadingCategorias } = useCategoriasEditables(true)
  const { data: allFuentes = [], isLoading: loadingFuentes } = useFuentesIngresoEditables(true)

  // Filter based on showInactive toggle (visual filter only)
  const categorias = showInactive ? allCategorias : allCategorias.filter(cat => cat.visible ?? cat.activo)
  const fuentes = showInactive ? allFuentes : allFuentes.filter(f => f.visible ?? f.activo)

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

  // Modulos
  const { data: modulosDisponibles, isLoading: loadingModulos } = useModulosDisponibles()
  const { data: preferencias } = usePreferencias()
  const toggleModuloMutation = useToggleModulo()

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
    try {
      await toggleCategoriaMutation.mutateAsync(categoria.id)
      const isCurrentlyVisible = categoria.visible ?? categoria.activo
      toast.success(isCurrentlyVisible ? 'Categoria ocultada' : 'Categoria visible')
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
    try {
      await toggleFuenteMutation.mutateAsync(fuente.id)
      const isCurrentlyVisible = fuente.visible ?? fuente.activo
      toast.success(isCurrentlyVisible ? 'Fuente ocultada' : 'Fuente visible')
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

  // Modulos handler
  const handleToggleModulo = async (modulo: string, activo: boolean) => {
    try {
      await toggleModuloMutation.mutateAsync({ modulo, activo })
      toast.success(activo ? 'Modulo activado' : 'Modulo desactivado')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar modulo'
      toast.error(errorMessage)
    }
  }

  // Check if a module is active
  const isModuloActivo = (modulo: string): boolean => {
    if (!modulosDisponibles || !preferencias) return true
    if (modulosDisponibles[modulo]?.core) return true
    return preferencias.modulos_activos.includes(modulo)
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
        {(activeTab === 'categorias' || activeTab === 'fuentes') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {showInactive ? 'Ocultar inactivos' : 'Mostrar inactivos'}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="modulos" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Modulos
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="fuentes" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Fuentes
          </TabsTrigger>
        </TabsList>

        {/* Modulos Tab */}
        <TabsContent value="modulos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                Modulos de la Aplicacion
              </CardTitle>
              <CardDescription>
                Activa o desactiva funciones para simplificar tu experiencia. Los modulos core siempre estan visibles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingModulos ? (
                <div className="text-center py-8">Cargando...</div>
              ) : modulosDisponibles ? (
                <div className="space-y-6">
                  {/* Core Modules */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Modulos Principales (siempre activos)</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {Object.entries(modulosDisponibles)
                        .filter(([, config]) => config.core)
                        .map(([key, config]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between rounded-lg border p-4 bg-muted/30"
                          >
                            <div className="space-y-1">
                              <div className="font-medium">{config.nombre}</div>
                              <div className="text-sm text-muted-foreground">{config.descripcion}</div>
                            </div>
                            <Badge variant="secondary">
                              <Lock className="mr-1 h-3 w-3" />
                              Core
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Optional Modules */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Modulos Opcionales</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {Object.entries(modulosDisponibles)
                        .filter(([, config]) => !config.core)
                        .map(([key, config]) => {
                          const activo = isModuloActivo(key)
                          return (
                            <div
                              key={key}
                              className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${activo ? 'bg-background' : 'bg-muted/30 opacity-60'}`}
                            >
                              <div className="space-y-1 flex-1 mr-4">
                                <div className="font-medium">{config.nombre}</div>
                                <div className="text-sm text-muted-foreground">{config.descripcion}</div>
                              </div>
                              <Switch
                                checked={activo}
                                onCheckedChange={(checked) => handleToggleModulo(key, checked)}
                                disabled={toggleModuloMutation.isPending}
                              />
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Tip:</strong> Empieza con pocos modulos activos y ve habilitando mas a medida que los necesites.
                      Esto mantendra la aplicacion simple y facil de usar.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No se pudieron cargar los modulos
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                    {categorias.map((cat) => {
                      const isVisible = cat.visible ?? cat.activo
                      return (
                      <div
                        key={cat.id}
                        className={`flex items-center justify-between rounded-lg border p-3 ${!isVisible ? 'opacity-50' : ''}`}
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
                              {!isVisible && <Badge variant="outline" className="text-xs">Oculta</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleToggleCategoria(cat)} title={isVisible ? 'Ocultar' : 'Mostrar'}>
                            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          {!cat.es_sistema && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleEditCategoria(cat)} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteCategoria(cat)} title="Eliminar">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )})}
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
                        {categorias.map((cat) => {
                          const isVisible = cat.visible ?? cat.activo
                          return (
                          <TableRow key={cat.id} className={!isVisible ? 'opacity-50' : ''}>
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
                              <Badge variant={isVisible ? 'default' : 'secondary'}>
                                {isVisible ? 'Activa' : 'Oculta'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleToggleCategoria(cat)} title={isVisible ? 'Ocultar' : 'Mostrar'}>
                                  {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                {!cat.es_sistema && (
                                  <>
                                    <Button variant="ghost" size="sm" onClick={() => handleEditCategoria(cat)} title="Editar">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteCategoria(cat)} title="Eliminar">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )})}
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
                    {fuentes.map((fuente) => {
                      const isVisible = fuente.visible ?? fuente.activo
                      return (
                      <div
                        key={fuente.id}
                        className={`flex items-center justify-between rounded-lg border p-3 ${!isVisible ? 'opacity-50' : ''}`}
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
                              {!isVisible && <Badge variant="outline" className="text-xs">Oculta</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleToggleFuente(fuente)} title={isVisible ? 'Ocultar' : 'Mostrar'}>
                            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          {!fuente.es_sistema && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleEditFuente(fuente)} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteFuente(fuente)} title="Eliminar">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )})}
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
                        {fuentes.map((fuente) => {
                          const isVisible = fuente.visible ?? fuente.activo
                          return (
                          <TableRow key={fuente.id} className={!isVisible ? 'opacity-50' : ''}>
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
                              <Badge variant={isVisible ? 'default' : 'secondary'}>
                                {isVisible ? 'Activa' : 'Oculta'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleToggleFuente(fuente)} title={isVisible ? 'Ocultar' : 'Mostrar'}>
                                  {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                {!fuente.es_sistema && (
                                  <>
                                    <Button variant="ghost" size="sm" onClick={() => handleEditFuente(fuente)} title="Editar">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteFuente(fuente)} title="Eliminar">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )})}
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
