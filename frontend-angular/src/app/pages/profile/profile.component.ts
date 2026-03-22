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
    this.editForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(8)]],
      correo: ['', [Validators.required, Validators.email]],
      password: ['', this.strongPasswordValidator]
    });
  }

  strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const hasMinLength = value.length >= 12;

    const errors: ValidationErrors = {};
    if (!hasMinLength) errors['minlength'] = { requiredLength: 12, actualLength: value.length };
    if (!hasUpperCase) errors['noUpperCase'] = true;
    if (!hasSpecialChar) errors['noSpecialChar'] = true;

    return Object.keys(errors).length > 0 ? errors : null;
  }

  // No loguear — este getter es llamado por Angular en cada ciclo de detección de cambios
  get userInfo(): User | null {
    return this.auth.getUser();
  }

  get isPremium() {
    return this.auth.isPremium();
  }

  get isAdmin() {
    return this.auth.isAdmin();
  }

  getFormattedDate(): string {
    return new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getInitials(name?: string): string {
    if (!name) return 'U';
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  goBack() {
    window.history.back();
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  deleteAccount() {
    this.showDeleteModal = true;
  }

  confirmDeleteAccount() {
    this.showDeleteModal = false;

    this.logger.info('Usuario solicitó eliminación de cuenta');

    this.messageService.add({
      severity: 'info',
      summary: 'Eliminando cuenta...',
      detail: 'Por favor espera mientras eliminamos tus datos',
      life: 3000
    });

    this.auth.deleteAccount().subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Cuenta eliminada',
          detail: 'Tu cuenta ha sido eliminada exitosamente.',
          life: 5000
        });

        setTimeout(() => {
          this.auth.logout();
          window.location.href = '/home';
        }, 2000);
      },
      error: (error) => {
        this.logger.error('Error al eliminar cuenta', error);

        this.messageService.add({
          severity: 'error',
          summary: 'Error al eliminar cuenta',
          detail: 'No se pudo eliminar tu cuenta. Inténtalo nuevamente.',
          life: 3000
        });
      }
    });
  }

  cancelDeleteAccount() {
    this.showDeleteModal = false;
  }

  logout() {
    this.logger.info('Usuario cerró sesión desde perfil');
    this.auth.logout();

    this.messageService.add({
      severity: 'success',
      summary: 'Sesión cerrada',
      detail: 'Has cerrado sesión correctamente',
      life: 3000
    });

    setTimeout(() => {
      window.location.href = '/home';
    }, 1000);
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;

    if (this.isEditMode) {
      this.editForm.patchValue({
        nombre: this.userInfo?.nombre || '',
        correo: this.userInfo?.correo || '',
        password: ''
      });
    }
  }

  saveProfile() {
    if (!this.editForm.value.nombre && !this.editForm.value.correo && !this.editForm.value.password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin cambios',
        detail: 'No hay cambios para guardar',
        life: 3000
      });
      return;
    }

    if (this.editForm.invalid) {
      this.logger.warn('Formulario de perfil inválido al guardar');

      this.messageService.add({
        severity: 'error',
        summary: 'Formulario inválido',
        detail: 'Por favor corrige los errores',
        life: 3000
      });
      return;
    }

    const currentName = this.userInfo?.nombre || '';
    const currentEmail = this.userInfo?.correo || '';
    const updateData: any = {};

    if (this.editForm.value.nombre && this.editForm.value.nombre !== currentName) {
      updateData.nombre = this.editForm.value.nombre;
    }

    if (this.editForm.value.correo && this.editForm.value.correo !== currentEmail) {
      updateData.correo = this.editForm.value.correo;
    }

    if (this.editForm.value.password) {
      updateData.password = this.editForm.value.password;
    }

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

    this.logger.info('Actualizando perfil de usuario');

    this.messageService.add({
      severity: 'info',
      summary: 'Guardando...',
      detail: 'Actualizando tu perfil',
      life: 2000
    });

    this.auth.updateProfile(updateData).subscribe({
      next: (response) => {
        if (response.user) {
          this.auth.saveSession(response.user, this.auth.getToken()!);

          if (Object.keys(updateData).length > 0) {
            this.messageService.add({
              severity: 'info',
              summary: 'Sesión cerrada',
              detail: 'Por seguridad, debes iniciar sesión nuevamente',
              life: 3000
            });

            setTimeout(() => {
              this.auth.logout();
              window.location.href = '/home';
            }, 3500);

          } else {
            this.isEditMode = false;
          }
        }
      },
      error: (error) => {
        this.logger.error('Error al actualizar perfil', error);

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Error al actualizar el perfil',
          life: 3000
        });
      }
    });
  }

  cancelEdit() {
    this.isEditMode = false;
    this.editForm.patchValue({
      nombre: '',
      correo: '',
      password: ''
    });
  }
}