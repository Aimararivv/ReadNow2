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

  readingHistory: ReadingHistoryItem[] = [];
  isLoadingHistory = false;

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
    console.log('👤 USUARIO EN ngOnInit:', this.userInfo);
    console.log('📸 FOTO_PERFIL:', this.userInfo?.foto_perfil);
    
    // Refrescar datos del usuario desde el backend
    this.refreshUserData();
    
    this.loadReadingHistory();
  }
  
  // Refrescar datos del usuario desde el backend
  refreshUserData() {
    if (!this.auth.getToken()) return;
    
    this.auth.getMe().subscribe({
      next: (res) => {
        console.log('🔄 USUARIO REFRESCADO:', res.user);
        if (res.user) {
          this.auth.updateUserLocal(res.user);
        }
      },
      error: (err) => {
        console.error('❌ Error al refrescar usuario:', err);
      }
    });
  }

  // ================= HISTORIAL =================
  loadReadingHistory() {
    if (!this.auth.getToken()) return;

    this.isLoadingHistory = true;

    this.readingHistoryService.getReadingHistory().subscribe({
      next: (history) => {
        this.readingHistory = history;
        this.isLoadingHistory = false;
      },
      error: () => {
        this.isLoadingHistory = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar historial',
          life: 3000
        });
      }
    });
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
    }
  }

  cancelEdit() {
    this.isEditMode = false;
    this.previewImage = null;
    this.selectedFile = null;
    this.editForm.reset();
  }

  // ================= GUARDAR =================
  saveProfile() {
    console.log('🚀 ENVIANDO PERFIL...');

    const formData = new FormData();

    // Agregar foto si existe
    if (this.selectedFile) {
      formData.append('foto', this.selectedFile);
    }

    // Agregar datos del formulario
    const nombre = this.editForm.get('nombre')?.value;
    const correo = this.editForm.get('correo')?.value;
    const password = this.editForm.get('password')?.value;

    if (nombre) formData.append('nombre', nombre);
    if (correo) formData.append('correo', correo);
    if (password) formData.append('password', password);

    this.auth.updateProfile(formData).subscribe({
      next: (res: any) => {
        console.log('✅ RESPUESTA:', res);

        if (res.user) {
          // Actualizar el usuario en el servicio de autenticación
          this.auth.updateUserLocal(res.user);
        }

        // Limpiar preview y archivo seleccionado
        this.previewImage = null;
        this.selectedFile = null;
        this.isEditMode = false;

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Perfil actualizado',
          life: 3000
        });
      },
      error: (err) => {
        console.error('❌ ERROR:', err);
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

    console.log('📸 GUARDANDO SOLO FOTO...');

    const formData = new FormData();
    formData.append('foto', this.selectedFile);

    this.auth.updateProfile(formData).subscribe({
      next: (res: any) => {
        console.log('✅ FOTO GUARDADA:', res);

        if (res.user) {
          this.auth.updateUserLocal(res.user);
        }

        // Limpiar estados
        this.previewImage = null;
        this.selectedFile = null;

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Foto de perfil actualizada',
          life: 3000
        });
      },
      error: (err) => {
        console.error('❌ ERROR al guardar foto:', err);
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
  }

  confirmDeleteAccount() {
    this.showDeleteModal = false;

    this.auth.deleteAccount().subscribe({
      next: () => {
        this.auth.logout();
        window.location.href = '/home';
      },
      error: () => {
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
  }

  // ================= ERROR IMAGEN =================
  onImageError(event: any) {
    event.target.style.display = 'none';
  }
}