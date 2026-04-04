import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { LoggerService } from '../../core/services/logger.service';
import { ReadingHistoryService, ReadingHistoryItem } from '../../core/services/reading-history.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {

  isEditMode = false;
  editForm!: FormGroup;
  showEditPassword = false;
  showDeleteModal = false;
  readingHistory: ReadingHistoryItem[] = [];
  isLoadingHistory = false;
isB: any;

  constructor(
    public auth: AuthService,
    private messageService: MessageService,
    private router: Router,
    private fb: FormBuilder,
    private logger: LoggerService,
    private readingHistoryService: ReadingHistoryService
  ) {
    this.editForm = this.fb.group({
      nombre: ['', [Validators.minLength(8)]],
      correo: ['', [Validators.email]],
      password: ['', this.strongPasswordValidator]
    });
  }

  ngOnInit() {
    this.loadReadingHistory();
  }

  loadReadingHistory() {
    if (!this.auth.getToken()) {
      return;
    }

    this.isLoadingHistory = true;
    this.readingHistoryService.getReadingHistory().subscribe({
      next: (history) => {
        this.readingHistory = history;
        this.isLoadingHistory = false;
        console.log('📚 Historial de lectura cargado:', history.length, 'libros');
      },
      error: (error) => {
        console.error('❌ Error al cargar historial de lectura:', error);
        this.isLoadingHistory = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar tu historial de lectura. Inténtalo nuevamente.',
          life: 3000
        });
      }
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
    const creationDate = this.userInfo?.fecha_creacion;
    if (!creationDate) {
      return 'No disponible';
    }
    
    return new Date(creationDate).toLocaleDateString('es-ES', {
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
    const nombre = this.editForm.value.nombre?.trim();
    const correo = this.editForm.value.correo?.trim();
    const password = this.editForm.value.password;

    // Al menos un campo debe tener valor
    if (!nombre && !correo && !password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin cambios',
        detail: 'Modifica al menos un campo para guardar',
        life: 3000
      });
      return;
    }

    // Validar solo los campos que se llenaron
    if (nombre && this.editForm.get('nombre')?.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Nombre inválido',
        detail: 'El nombre debe tener mínimo 8 caracteres',
        life: 3000
      });
      return;
    }

    if (correo && this.editForm.get('correo')?.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Correo inválido',
        detail: 'Ingresa un correo válido',
        life: 3000
      });
      return;
    }

    if (password && this.editForm.get('password')?.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Contraseña inválida',
        detail: 'Mínimo 12 caracteres, una mayúscula y un carácter especial',
        life: 3000
      });
      return;
    }

    // Solo mandar los campos que realmente cambiaron
    const updateData: any = {};
    if (nombre && nombre !== this.userInfo?.nombre) updateData.nombre = nombre;
    if (correo && correo !== this.userInfo?.correo) updateData.correo = correo;
    if (password) updateData.password = password;

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

          this.messageService.add({
            severity: 'success',
            summary: 'Perfil actualizado',
            detail: 'Por seguridad, debes iniciar sesión nuevamente',
            life: 3000
          });

          setTimeout(() => {
            this.auth.logout();
            window.location.href = '/home';
          }, 3500);
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

  onImageError(event: any) {
    // Si la imagen falla al cargar, mostramos un placeholder
    event.target.style.display = 'none';
    const placeholder = event.target.nextElementSibling;
    if (placeholder && placeholder.classList.contains('no-cover-placeholder')) {
      placeholder.style.display = 'flex';
    }
  }
}