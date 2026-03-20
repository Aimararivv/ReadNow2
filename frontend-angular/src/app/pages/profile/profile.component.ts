import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AutoLogoutService } from '../../core/services/auto-logout.service';

// Forzar la importación para evitar problemas de cache
type UserInterface = User;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {

  isEditMode = false;
  editForm!: FormGroup;
  showEditPassword = false;
  showDeleteModal = false;

  // Validador personalizado para contraseña fuerte
  strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    
    if (!value) {
      return null; // Permitir contraseña vacía (para mantener actual)
    }

    const errors: ValidationErrors = {};
    
    if (value.length < 12) {
      errors['minlength'] = { requiredLength: 12, actualLength: value.length };
    }
    
    if (!/[A-Z]/.test(value)) {
      errors['noUpperCase'] = true;
    }
    
    if (!/[!#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      errors['noSpecialChar'] = true;
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }

  constructor(
    public auth: AuthService, 
    private messageService: MessageService, 
    private router: Router,
    private fb: FormBuilder,
    private autoLogoutService: AutoLogoutService
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(8)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.strongPasswordValidator]
    });
  }

  // Obtener información del usuario
  get userInfo(): User | null {
    return this.auth.getUser();
  }

  // Verificar si es premium
  get isPremium() {
    return this.auth.isPremium();
  }

  // Verificar si es admin
  get isAdmin() {
    return this.auth.isAdmin();
  }

  // Formatear fecha de registro
  getFormattedDate(): string {
    const user = this.userInfo;
    if (user && (user as UserInterface).createdAt) {
      return new Date((user as UserInterface).createdAt as string).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Obtener iniciales del nombre
  getInitials(name?: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  // Navegar hacia atrás
  goBack() {
    window.history.back();
  }

  // Navegar a inicio
  goToHome() {
    this.router.navigate(['/home']);
  }

  // Eliminar cuenta
  deleteAccount() {
    this.showDeleteModal = true;
  }

  // Confirmar eliminación de cuenta
  confirmDeleteAccount() {
    this.showDeleteModal = false;
    this.messageService.add({
      severity: 'info',
      summary: 'Eliminando cuenta...',
      detail: 'Por favor espera mientras eliminamos tus datos',
      life: 3000
    });

    this.auth.deleteAccount().subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Cuenta eliminada',
          detail: 'Tu cuenta ha sido eliminada exitosamente. Toda tu información personal, historial de lectura y datos han sido eliminados permanentemente.',
          life: 5000
        });

        // Cerrar sesión y redirigir al home
        setTimeout(() => {
          this.auth.logout();
          window.location.href = '/home';
        }, 2000);
      },
      error: (error) => {
        console.error('Error al eliminar cuenta:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al eliminar cuenta',
          detail: 'No se pudo eliminar tu cuenta. Inténtalo nuevamente.',
          life: 3000
        });
      }
    });
  }

  // Cancelar eliminación
  cancelDeleteAccount() {
    this.showDeleteModal = false;
  }

  // Cerrar sesión
  logout() {
    this.auth.logout();
    
    // Mostrar notificación de cierre de sesión
    this.messageService.add({
      severity: 'success',
      summary: 'Sesión cerrada',
      detail: 'Has cerrado sesión correctamente',
      life: 3000
    });

    // Redirigir a inicio después de un breve retraso
    setTimeout(() => {
      window.location.href = '/home';
    }, 1000);
  }

  // Toggle modo de edición
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      // Cargar datos actuales en el formulario
      this.editForm.patchValue({
        name: this.userInfo?.name || '',
        email: this.userInfo?.email || '',
        password: ''
      });
    }
  }

  // Guardar perfil
  saveProfile() {
    // Validar que al menos un campo tenga cambios
    if (!this.editForm.value.name && !this.editForm.value.email && !this.editForm.value.password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin cambios',
        detail: 'No hay cambios para guardar',
        life: 3000
      });
      return;
    }

    // Validar formulario
    if (this.editForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Formulario inválido',
        detail: 'Por favor corrige los errores',
        life: 3000
      });
      return;
    }

    // Detectar cambios reales comparando con datos actuales
    const currentName = this.userInfo?.name || '';
    const currentEmail = this.userInfo?.email || '';
    
    console.log('Datos actuales del usuario:', {
      name: currentName,
      email: currentEmail
    });
    
    const updateData: any = {};
    
    // Solo agregar campos que realmente cambiaron
    if (this.editForm.value.name && this.editForm.value.name !== currentName) {
      updateData.name = this.editForm.value.name;
      console.log('Se detectó cambio de nombre');
    }
    
    if (this.editForm.value.email && this.editForm.value.email !== currentEmail) {
      updateData.email = this.editForm.value.email;
      console.log('Se detectó cambio de email');
    }
    
    if (this.editForm.value.password) {
      updateData.password = this.editForm.value.password;
      console.log('Se detectó cambio de password');
    }
    
    console.log('UpdateData final:', updateData);
    console.log('Object.keys(updateData).length:', Object.keys(updateData).length);

    // Si no hay cambios reales
    if (Object.keys(updateData).length === 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'Sin cambios',
        detail: 'Los datos son iguales a los actuales',
        life: 3000
      });
      this.isEditMode = false;
      return;
    }

    // Mostrar loading
    this.messageService.add({
      severity: 'info',
      summary: 'Guardando...',
      detail: 'Actualizando tu perfil',
      life: 2000
    });

    // Enviar al backend
    this.auth.updateProfile(updateData).subscribe({
      next: (response) => {
        // Actualizar datos del usuario en el frontend
        if (response.user) {
          // Actualizar el usuario en el AuthService con el nuevo token
          this.auth.saveSession(response.user, this.auth.getToken()!);
          
          // Si hay cambios reales, cerrar sesión automáticamente por seguridad
        if (Object.keys(updateData).length > 0) {
          console.log('Se detectaron cambios - cerrando sesión');
          this.messageService.add({
            severity: 'info',
            summary: 'Sesión cerrada',
            detail: 'Por seguridad, debes iniciar sesión nuevamente',
            life: 3000
          });

          // Cerrar sesión y redirigir al login
          setTimeout(() => {
            this.auth.logout();
            window.location.href = '/home';
          }, 3500);
        } else {
          console.log('No se detectaron cambios - manteniendo sesión');
          // Salir del modo edición solo si no se cambió correo/contraseña
          this.isEditMode = false;
        }
        }
      },
      error: (error) => {
        console.error('Error al actualizar perfil:', error);
        
        let errorMessage = 'Error al actualizar el perfil';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 3000
        });
      }
    });
  }

  // Cancelar edición
  cancelEdit() {
    this.isEditMode = false;
    this.editForm.patchValue({
      name: '',
      email: '',
      password: ''
    });
  }
}

