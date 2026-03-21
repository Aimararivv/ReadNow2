import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { LoggerService } from '../../core/services/logger.service';

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

  constructor(
    public auth: AuthService, 
    private messageService: MessageService, 
    private router: Router,
    private fb: FormBuilder,
    private logger: LoggerService
  ) {

    this.logger.info('ProfileComponent cargado');

    this.editForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(8)]],
      correo: ['', [Validators.required, Validators.email]],
      password: ['', this.strongPasswordValidator]
    });
  }

  // Validador personalizado para contraseña fuerte
  strongPasswordValidator(control: AbstractControl): ValidationErrors | null {

    const value = control.value;

    if (!value) {
      return null; // La contraseña es opcional
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const hasMinLength = value.length >= 12;

    const errors: ValidationErrors = {};

    if (!hasMinLength) {
      errors['minlength'] = { requiredLength: 12, actualLength: value.length };
    }

    if (!hasUpperCase) {
      errors['noUpperCase'] = true;
    }

    if (!hasSpecialChar) {
      errors['noSpecialChar'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  // Obtener información del usuario
  get userInfo(): User | null {

    const user = this.auth.getUser();

    this.logger.log('Información de usuario consultada', user);

    return user;
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

    this.logger.log('Usuario consultó fecha de registro');

    return new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Obtener iniciales del nombre
  getInitials(name?: string): string {

    if (!name) return 'U';

    const initials = name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    this.logger.log('Iniciales generadas para avatar', initials);

    return initials;
  }

  // Navegar hacia atrás
  goBack() {

    this.logger.log('Usuario regresó desde perfil');

    window.history.back();
  }

  // Navegar a inicio
  goToHome() {

    this.logger.log('Usuario navegó a Home desde perfil');

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

    this.logger.warn('Usuario cerró sesión');

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

      this.logger.info('Redirección a Home después de logout');

      window.location.href = '/home';

    }, 1000);
  }

  // Toggle modo de edición
  toggleEditMode() {

    this.isEditMode = !this.isEditMode;

    this.logger.info('Modo edición perfil cambiado', { editMode: this.isEditMode });

    if (this.isEditMode) {

      // Cargar datos actuales en el formulario
      this.editForm.patchValue({
        nombre: this.userInfo?.nombre || '',
        correo: this.userInfo?.correo || '',
        password: ''
      });

      this.logger.log('Formulario de edición cargado con datos actuales');
    }
  }

  // Guardar perfil
  saveProfile() {

    this.logger.info('Intento de actualización de perfil');

  // Validar que al menos un campo tenga cambios
    if (!this.editForm.value.name && !this.editForm.value.email && !this.editForm.value.password) {

      this.logger.warn('Intento de guardar perfil sin cambios');

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

      this.logger.warn('Formulario de perfil inválido');

      this.messageService.add({
        severity: 'error',
        summary: 'Formulario inválido',
        detail: 'Por favor corrige los errores',
        life: 3000
      });

      return;
    }

    // Detectar cambios reales comparando con datos actuales
    const currentName = this.userInfo?.nombre || '';
    const currentEmail = this.userInfo?.correo || '';

    const updateData: any = {};

    // Solo agregar campos que realmente cambiaron
    if (this.editForm.value.nombre && this.editForm.value.nombre !== currentName) {
      updateData.nombre = this.editForm.value.nombre;
    }

    if (this.editForm.value.correo && this.editForm.value.correo !== currentEmail) {
      updateData.correo = this.editForm.value.correo;
    }

    if (this.editForm.value.password) {
      updateData.password = this.editForm.value.password;
      console.log('Se detectó cambio de password');
    }
    
    console.log('UpdateData final:', updateData);
    console.log('Object.keys(updateData).length:', Object.keys(updateData).length);

    // Si no hay cambios reales
    if (Object.keys(updateData).length === 0) {

      this.logger.info('Datos iguales, no se requiere actualización');

      this.messageService.add({
        severity: 'info',
        summary: 'Sin cambios',
        detail: 'Los datos son iguales a los actuales',
        life: 3000
      });

      this.isEditMode = false;

      return;
    }

    this.logger.log('Datos enviados para actualizar perfil', updateData);

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

        this.logger.info('Perfil actualizado correctamente', response);

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

            this.logger.info('Logout automático por cambio de seguridad');

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

        this.logger.error('Error al actualizar perfil', error);

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

    this.logger.log('Edición de perfil cancelada');

    this.isEditMode = false;

    this.editForm.patchValue({
      name: '',
      email: '',
      password: ''
    });
  }
}

