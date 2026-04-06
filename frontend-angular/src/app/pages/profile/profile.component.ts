import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { LoggerService } from '../../core/services/logger.service';
import {
  ReadingHistoryService,
  ReadingHistoryItem
} from '../../core/services/reading-history.service';

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

  // ================= HISTORIAL =================
  allReadingHistory: ReadingHistoryItem[] = [];
  readingHistory: ReadingHistoryItem[] = [];
  isLoadingHistory = false;

  historyCurrentPage: number = 1;
  historyPerPage: number = 6;

  get historyTotalPages(): number {
    return Math.ceil(this.allReadingHistory.length / this.historyPerPage);
  }

  // ================= FOTO DE PERFIL =================
  selectedFile: File | null = null;
  previewImage: string | ArrayBuffer | null = null;

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
    this.logger.info('Perfil iniciado', { userId: this.userInfo?.id_usuario });
    this.refreshUserData();
    this.loadReadingHistory();
  }

  // ================= REFRESCAR USUARIO =================
  refreshUserData() {
    if (!this.auth.getToken()) return;

    this.auth.getMe().subscribe({
      next: (res) => {
        this.logger.info('Datos de usuario refrescados', { userId: res.user?.id_usuario });
        if (res.user) {
          this.auth.updateUserLocal(res.user);
        }
      },
      error: (err) => {
        this.logger.error('Error al refrescar usuario', err);
      }
    });
  }

  // ================= HISTORIAL =================
  loadReadingHistory() {
    if (!this.auth.getToken()) return;

    this.isLoadingHistory = true;

    this.readingHistoryService.getReadingHistory().subscribe({
      next: (history) => {
        this.allReadingHistory = history;
        this.updateHistoryPage();
        this.isLoadingHistory = false;
        this.logger.info('Historial cargado correctamente', { total: history.length });
      },
      error: (err) => {
        this.isLoadingHistory = false;
        this.logger.error('Error al cargar historial', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar historial',
          life: 3000
        });
      }
    });
  }

  updateHistoryPage() {
    const start = (this.historyCurrentPage - 1) * this.historyPerPage;
    const end = start + this.historyPerPage;
    this.readingHistory = this.allReadingHistory.slice(start, end);
  }

  goToHistoryPage(page: number) {
    if (page < 1 || page > this.historyTotalPages) return;
    this.historyCurrentPage = page;
    this.updateHistoryPage();
  }

  // ================= VALIDACIÓN PASSWORD =================
  strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const hasMinLength = value.length >= 12;

    const errors: ValidationErrors = {};
    if (!hasMinLength) errors['minlength'] = true;
    if (!hasUpperCase) errors['noUpperCase'] = true;
    if (!hasSpecialChar) errors['noSpecialChar'] = true;

    return Object.keys(errors).length ? errors : null;
  }

  // ================= GETTERS =================
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
    const date = this.userInfo?.fecha_creacion;
    return date
      ? new Date(date).toLocaleDateString('es-ES')
      : 'No disponible';
  }

  getInitials(name?: string): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // ================= IMAGEN =================
  onFileSelected(event: any) {
    const file = event.target.files[0];

    if (file) {
      this.selectedFile = file;
      this.logger.info('Foto de perfil seleccionada', { fileName: file.name });

      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // ================= EDITAR =================
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;

    if (this.isEditMode) {
      this.editForm.patchValue({
        nombre: this.userInfo?.nombre || '',
        correo: this.userInfo?.correo || '',
        password: ''
      });
      this.logger.info('Modo edición activado', {});
    }
  }

  cancelEdit() {
    this.isEditMode = false;
    this.previewImage = null;
    this.selectedFile = null;
    this.editForm.reset();
    this.logger.info('Edición cancelada', {});
  }

  // ================= GUARDAR =================
saveProfile() {
  const formData = new FormData();

  if (this.selectedFile) {
    formData.append('foto', this.selectedFile);
  }

  const nombre = this.editForm.get('nombre')?.value;
  const correo = this.editForm.get('correo')?.value;
  const password = this.editForm.get('password')?.value;

  if (nombre) formData.append('nombre', nombre);
  if (correo) formData.append('correo', correo);
  if (password) formData.append('password', password);

  const correoOriginal = this.userInfo?.correo || '';
  const correocambio = correo && correo !== correoOriginal;
  const cambioSensible = !!correocambio || !!password;

  this.logger.info('Guardando perfil', { nombre, correo, tienePassword: !!password, cambioSensible });

  this.auth.updateProfile(formData).subscribe({
    next: (res: any) => {
      if (res.user) {
        this.auth.updateUserLocal(res.user);
      }

      this.previewImage = null;
      this.selectedFile = null;
      this.isEditMode = false;

      this.logger.info('Perfil actualizado correctamente', { userId: res.user?.id_usuario, cambioSensible });

      if (cambioSensible) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Sesión cerrada',
          detail: 'Tus datos fueron actualizados. Por seguridad, inicia sesión nuevamente.',
          life: 4000
        });

        setTimeout(() => {
          this.auth.logout();
          window.location.href = '/home';
        }, 4000);

      } else {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Perfil actualizado correctamente',
          life: 3000
        });
      }
    },
    error: (err) => {
      this.logger.error('Error al actualizar perfil', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err.error?.message || 'Error al actualizar perfil',
        life: 3000
      });
    }
  });
}

  // ================= GUARDAR SOLO FOTO =================
  savePhotoOnly() {
    if (!this.selectedFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay foto seleccionada',
        life: 3000
      });
      return;
    }

    this.logger.info('Guardando foto de perfil', {});

    const formData = new FormData();
    formData.append('foto', this.selectedFile);

    this.auth.updateProfile(formData).subscribe({
      next: (res: any) => {
        if (res.user) {
          this.auth.updateUserLocal(res.user);
        }

        this.previewImage = null;
        this.selectedFile = null;

        this.logger.info('Foto de perfil actualizada correctamente', {});

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Foto de perfil actualizada',
          life: 3000
        });
      },
      error: (err) => {
        this.logger.error('Error al guardar foto de perfil', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error al guardar foto',
          life: 3000
        });
      }
    });
  }

  // ================= NAVEGACIÓN =================
  goBack() {
    window.history.back();
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  logout() {
    this.logger.info('Usuario cerró sesión', { userId: this.userInfo?.id_usuario });
    this.auth.logout();

    this.messageService.add({
      severity: 'success',
      summary: 'Sesión cerrada',
      detail: 'Has cerrado sesión',
      life: 3000
    });

    setTimeout(() => {
      window.location.href = '/home';
    }, 1000);
  }

  // ================= ELIMINAR CUENTA =================
  deleteAccount() {
    this.showDeleteModal = true;
    this.logger.warn('Usuario abrió modal de eliminar cuenta', { userId: this.userInfo?.id_usuario });
  }

  confirmDeleteAccount() {
    this.showDeleteModal = false;
    this.logger.warn('Usuario confirmó eliminación de cuenta', { userId: this.userInfo?.id_usuario });

    this.auth.deleteAccount().subscribe({
      next: () => {
        this.logger.info('Cuenta eliminada correctamente', {});
        this.auth.logout();
        window.location.href = '/home';
      },
      error: (err) => {
        this.logger.error('Error al eliminar cuenta', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar',
          life: 3000
        });
      }
    });
  }

  cancelDeleteAccount() {
    this.showDeleteModal = false;
    this.logger.info('Usuario canceló eliminación de cuenta', {});
  }

  // ================= ERROR IMAGEN =================
  onImageError(event: any) {
    event.target.style.display = 'none';
  }
}