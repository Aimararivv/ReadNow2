import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, User, Stats, LogEntry } from '../../core/services/admin.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  users: User[] = [];
  stats: Stats | null = null;
  isLoading = false;
  
  // Formulario para crear usuario
  newUser = {
    nombre: '',
    correo: '',
    password: '',
    role: 'FREE'
  };
  
  showCreateForm = false;

  // Logs
  logs: LogEntry[] = [];
  isLoadingLogs = false;
  logCount = 0;
  
  // Filtros de logs
  logFilters = {
    level: 'ALL',
    days: undefined as number | undefined,
    limit: 100
  };
  
  logLevels = ['ALL', 'INFO', 'WARN', 'ERROR', 'LOG'];
  activeTab: 'users' | 'logs' = 'users';

  constructor(
    private adminService: AdminService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadStats();
  }

  loadUsers() {
    this.isLoading = true;
    this.adminService.getAllUsers().subscribe({
      next: (response) => {
        this.users = response.users;
        this.isLoading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los usuarios'
        });
        this.isLoading = false;
      }
    });
  }

  loadStats() {
    this.adminService.getStats().subscribe({
      next: (response) => {
        this.stats = response.stats;
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
      }
    });
  }

  createUser() {
    if (!this.newUser.nombre || !this.newUser.correo || !this.newUser.password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Por favor completa todos los campos'
      });
      return;
    }

    this.adminService.createUser(this.newUser).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Usuario creado correctamente'
        });
        this.loadUsers();
        this.resetForm();
        this.showCreateForm = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'No se pudo crear el usuario'
        });
      }
    });
  }

  deleteUser(id_usuario: number, nombre: string) {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${nombre}?`)) {
      return;
    }

    this.adminService.deleteUser(id_usuario).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Usuario eliminado correctamente'
        });
        this.loadUsers();
        this.loadStats();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'No se pudo eliminar el usuario'
        });
      }
    });
  }

  updateRole(id_usuario: number, newRole: string, nombre: string) {
    this.adminService.updateUserRole(id_usuario, newRole).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Rol de ${nombre} actualizado a ${newRole}`
        });
        this.loadUsers();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'No se pudo actualizar el rol'
        });
      }
    });
  }

  resetForm() {
    this.newUser = {
      nombre: '',
      correo: '',
      password: '',
      role: 'FREE'
    };
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'ADMIN': return 'role-admin';
      case 'PREMIUM': return 'role-premium';
      case 'FREE': return 'role-free';
      default: return '';
    }
  }

  // ========== MÉTODOS DE LOGS ==========
  
  loadLogs() {
    this.isLoadingLogs = true;
    this.adminService.getSystemLogs(this.logFilters).subscribe({
      next: (response) => {
        this.logs = response.logs;
        this.logCount = response.count;
        this.isLoadingLogs = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los logs'
        });
        this.isLoadingLogs = false;
      }
    });
  }

  applyLogFilters() {
    this.loadLogs();
  }

  downloadLogs() {
    this.adminService.downloadLogsCSV({
      level: this.logFilters.level,
      days: this.logFilters.days
    });
    
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Reporte de logs descargado'
    });
  }

  getLogLevelClass(level: string): string {
    switch (level) {
      case 'ERROR': return 'level-error';
      case 'WARN': return 'level-warn';
      case 'INFO': return 'level-info';
      default: return 'level-log';
    }
  }

  switchTab(tab: 'users' | 'logs') {
    this.activeTab = tab;
    if (tab === 'logs' && this.logs.length === 0) {
      this.loadLogs();
    }
  }
}
