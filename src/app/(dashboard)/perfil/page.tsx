'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/authContext'
import { authApi } from '@/lib/api/endpoints/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Lock, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function PerfilPage() {
  const { user, refreshUser } = useAuth()

  // Estado para editar perfil
  const [nombre, setNombre] = useState(user?.nombre || '')
  const [email, setEmail] = useState(user?.email || '')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Estado para cambiar contraseña
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Actualizar perfil
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)

    try {
      const updates: { nombre?: string; email?: string } = {}

      if (nombre !== user?.nombre) updates.nombre = nombre
      if (email !== user?.email) updates.email = email

      if (Object.keys(updates).length === 0) {
        toast.info('No hay cambios para guardar')
        setIsUpdatingProfile(false)
        return
      }

      await authApi.updateProfile(updates)
      await refreshUser()
      toast.success('Perfil actualizado correctamente')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar perfil'
      toast.error(errorMessage)
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Cambiar contraseña
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    // Validar patrón: mayúscula, minúscula, número
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
    if (!passwordPattern.test(newPassword)) {
      toast.error('La contraseña debe tener al menos una mayúscula, una minúscula y un número')
      return
    }

    setIsChangingPassword(true)

    try {
      await authApi.changePassword(currentPassword, newPassword)
      toast.success('Contraseña actualizada correctamente')

      // Limpiar campos
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar contraseña'
      if (errorMessage.includes('incorrecta') || errorMessage.includes('INVALID')) {
        toast.error('La contraseña actual es incorrecta')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="container max-w-2xl px-4 py-4 md:py-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold md:text-3xl">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Administra tu información personal y seguridad
        </p>
      </div>

      {/* Información del perfil */}
      <Card className="mb-4 md:mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
          <CardDescription>
            Actualiza tu nombre y dirección de email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="pl-10"
                  placeholder="Tu nombre"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <Button type="submit" disabled={isUpdatingProfile}>
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <hr className="my-4 md:my-6" />

      {/* Cambiar contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription>
            Asegúrate de usar una contraseña segura que no uses en otros sitios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 6 caracteres, con mayúscula, minúscula y número
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              variant="outline"
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cambiando...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Cambiar Contraseña
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Info adicional */}
      <div className="mt-6 rounded-lg border bg-muted/50 p-4">
        <h3 className="font-medium mb-2">Información de la cuenta</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>ID de usuario: {user?.id}</p>
          <p>Miembro desde: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-AR') : 'N/A'}</p>
        </div>
      </div>
    </div>
  )
}
