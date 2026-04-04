import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SubscriptionService } from '../core/services/subscription.service';
import { AuthService } from '../core/services/auth.service';
import { LoggerService } from '../core/services/logger.service';

export interface RouteItem {
  icon: string;
  name: string;
  path: string;
  requiresPremium: boolean;
}

export interface Receipt {
  name: string;
  card: string;
  date: string;
  folio: string;
}

function cardNumberValidator(control: AbstractControl) {
  const val = (control.value ?? '').replace(/\s/g, '');
  return /^\d{16}$/.test(val) ? null : { invalidCardNumber: true };
}
function expiryValidator(control: AbstractControl) {
  return /^(0[1-9]|1[0-2])\/\d{2}$/.test(control.value ?? '')
    ? null : { invalidExpiry: true };
}
function nameValidator(control: AbstractControl) {
  return /^[A-Za-záéíóúÁÉÍÓÚñÑüÜ ]{3,}$/.test(control.value ?? '')
    ? null : { invalidName: true };
}

@Component({
  selector: 'app-premium',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './premium.component.html',
  styleUrls: ['./premium.component.scss'],
})
export class PremiumComponent implements OnInit, OnDestroy {

  get currentPlan(): 'basic' | 'premium' {
    return this.auth.isPremium() ? 'premium' : 'basic';
  }
  get activePlanName(): string {
    return this.currentPlan === 'premium' ? 'Premium 👑' : 'Básico Gratuito';
  }
  get activePlanDesc(): string {
    return this.currentPlan === 'premium'
      ? 'Acceso ilimitado a toda la biblioteca digital.'
      : 'Acceso a 1 libro al mes con vista previa incluida.';
  }
  get bannerIcon(): string {
    return this.currentPlan === 'premium' ? '👑' : '📖';
  }

  activeFilter: 'all' | 'basic' | 'premium' = 'all';
  statusActive = true;

  routes: RouteItem[] = [
    { icon: '🏠', name: 'Inicio', path: '/home', requiresPremium: false },
    { icon: '📚', name: 'Catálogo', path: '/catalog', requiresPremium: false },
    { icon: '👁️', name: 'Vista previa', path: '/book/preview', requiresPremium: false },
    { icon: '📖', name: 'Leer completo', path: '/book/read', requiresPremium: true },
    { icon: '⬇️', name: 'Descargar', path: '/book/download', requiresPremium: true },
    { icon: '🤖', name: 'Recomendaciones IA', path: '/recommendations', requiresPremium: true },
    { icon: '📊', name: 'Historial completo', path: '/history', requiresPremium: false },
    { icon: '⚙️', name: 'Perfil / Config', path: '/profile', requiresPremium: false },
  ];

  getRouteStatusClass(route: RouteItem): string {
    if (!route.requiresPremium) return 'rs-open';
    return this.currentPlan === 'premium' ? 'rs-premium' : 'rs-locked';
  }
  getRouteStatusLabel(route: RouteItem): string {
    if (!route.requiresPremium) return '🟢 Libre';
    return this.currentPlan === 'premium' ? '👑 Desbloqueado' : '🔒 Premium';
  }

  modalOpen = false;
  isProcessing = false;
  paymentSuccess = false;
  cardFlipped = false;
  cancelModalOpen = false;
  receipt: Receipt = { name: '', card: '', date: '', folio: '' };

  paymentForm!: FormGroup;

  get cardNameDisplay(): string {
    return (this.paymentForm?.get('cardName')?.value || '').toUpperCase() || 'NOMBRE COMPLETO';
  }
  get cardNumberDisplay(): string {
    const raw = (this.paymentForm?.get('cardNumber')?.value || '').replace(/\D/g, '');
    let s = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) s += ' ';
      s += raw[i] || '•';
    }
    return s;
  }
  get cardExpDisplay(): string {
    return this.paymentForm?.get('cardExpiry')?.value || 'MM/AA';
  }
  get cardCvvDisplay(): string {
    const v = this.paymentForm?.get('cardCvv')?.value || '';
    return v ? '•'.repeat(v.length) : '•••';
  }

  captchaA = 0;
  captchaB = 0;
  captchaInput: number | null = null;
  captchaCorrect: boolean | null = null;
  currentStep = 1;

  getStepClass(step: number): string {
    if (step < this.currentStep) return 'done';
    if (step === this.currentStep) return 'active';
    return '';
  }

  private payTimer: any;
  private inactivityTimer: any;

  constructor(
    public auth: AuthService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private subscriptionService: SubscriptionService,
    private router: Router,
    private logger: LoggerService
  ) { }

  startInactivityTimer(): void {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      this.closeModal();
      this.messageService.add({
        severity: 'info',
        summary: '⏳ Sesión expirada',
        detail: 'El modal se cerró por inactividad',
        life: 3000
      });
    }, 15000);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  ngOnInit(): void {
    this.buildForm();
    this.newCaptcha();
    document.addEventListener('mousemove', () => this.startInactivityTimer());
    document.addEventListener('keydown', () => this.startInactivityTimer());
    document.addEventListener('click', () => this.startInactivityTimer());
  }

  ngOnDestroy(): void {
    clearTimeout(this.payTimer);
  }

  private buildForm(): void {
    this.paymentForm = this.fb.group({
      cardName: ['', [Validators.required, nameValidator]],
      cardNumber: ['', [Validators.required, cardNumberValidator]],
      cardExpiry: ['', [Validators.required, expiryValidator]],
      cardCvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
    });

    this.paymentForm.get('cardName')!.valueChanges.subscribe((v: string) => {
      if (!v) return;
      const clean = v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
      if (clean !== v) this.paymentForm.get('cardName')!.setValue(clean, { emitEvent: false });
    });

    this.paymentForm.get('cardNumber')!.valueChanges.subscribe((v: string) => {
      if (!v) return;
      const clean = v.replace(/\D/g, '').slice(0, 16);
      const formatted = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
      if (formatted !== v) this.paymentForm.get('cardNumber')!.setValue(formatted, { emitEvent: false });
    });

    this.paymentForm.get('cardExpiry')!.valueChanges.subscribe((v: string) => {
      if (!v) return;
      let clean = v.replace(/\D/g, '').slice(0, 4);
      if (clean.length >= 3) clean = clean.slice(0, 2) + '/' + clean.slice(2);
      if (clean !== v) this.paymentForm.get('cardExpiry')!.setValue(clean, { emitEvent: false });
    });

    this.paymentForm.get('cardCvv')!.valueChanges.subscribe((v: string) => {
      if (!v) return;
      const clean = v.replace(/\D/g, '').slice(0, 3);
      if (clean !== v) this.paymentForm.get('cardCvv')!.setValue(clean, { emitEvent: false });
    });

    this.paymentForm.valueChanges.subscribe(() => this.updateStep());
  }

  isFieldValid(field: string): boolean {
    const c = this.paymentForm.get(field);
    return !!(c?.valid && c.dirty);
  }
  isFieldInvalid(field: string): boolean {
    const c = this.paymentForm.get(field);
    return !!(c?.invalid && (c.dirty || c.touched));
  }

  private updateStep(): void {
    const cardOk =
      this.paymentForm.get('cardName')!.valid &&
      this.paymentForm.get('cardNumber')!.valid &&
      this.paymentForm.get('cardExpiry')!.valid &&
      this.paymentForm.get('cardCvv')!.valid;

    this.currentStep = (cardOk && this.captchaCorrect) ? 3 : cardOk ? 2 : 1;
  }

  newCaptcha(): void {
    this.captchaA = Math.floor(Math.random() * 10) + 1;
    this.captchaB = Math.floor(Math.random() * 10) + 1;
    this.captchaInput = null;
    this.captchaCorrect = null;
    this.updateStep();
  }

  checkCaptcha(): void {
    if (this.captchaInput === null) { this.captchaCorrect = null; return; }
    this.captchaCorrect = this.captchaInput === this.captchaA + this.captchaB;
    this.updateStep();
  }

  generateRandomCvv(): void {
    const cvv = Math.floor(100 + Math.random() * 900).toString();
    this.paymentForm.get('cardCvv')?.setValue(cvv);
  }

  openModal(): void {
    const user = this.auth.getUser();
    if (!user) {
      this.logger.warn('Intento de acceso a premium sin login');
      this.messageService.add({
        severity: 'warn',
        summary: '⚠️ Acceso requerido',
        detail: 'Debes iniciar sesión primero',
        life: 3000,
      });
      return;
    }

    this.logger.info('Usuario abrió modal de pago premium');

    this.modalOpen = true;
    this.cardFlipped = false;
    document.body.style.overflow = 'hidden';
    this.startInactivityTimer();
  }

  closeModal(): void {
    this.modalOpen = false;
    document.body.style.overflow = '';
    this.resetModal();
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('overlay'))
      this.closeModal();
  }

  private resetModal(): void {
    this.paymentSuccess = false;
    this.isProcessing = false;
    this.currentStep = 1;
    this.paymentForm.reset();
    this.newCaptcha();
  }

  private validateCvvInput(): boolean {
    const cvvInput = this.paymentForm.get('cardCvv')!.value;
    if (!cvvInput || !/^\d{3}$/.test(cvvInput)) {
      this.messageService.add({
        severity: 'warn',
        summary: '⚠️ CVV inválido',
        detail: 'Ingresa un CVV válido de 3 dígitos.',
        life: 3000
      });
      return false;
    }
    return true;
  }

  processPayment(): void {
    this.paymentForm.markAllAsTouched();

    if (this.paymentForm.invalid) {
      this.logger.warn('Intento de pago con formulario inválido');
      return;
    }

    if (!this.validateCvvInput()) return;
    if (this.isProcessing) return;

    if (!this.captchaCorrect) {
      this.logger.warn('Intento de pago sin verificación CAPTCHA');
      this.messageService.add({
        severity: 'warn',
        summary: '⚠️ CAPTCHA incompleto',
        detail: 'Completa la verificación antes de continuar',
        life: 3000,
      });
      return;
    }

    this.isProcessing = true;

    this.payTimer = setTimeout(() => {
      this.isProcessing = false;
      this.paymentSuccess = true;

      this.receipt = {
        name: this.paymentForm.get('cardName')!.value,
        card: '**** **** **** ' + this.paymentForm.get('cardNumber')!.value.slice(-4),
        date: new Date().toLocaleString(),
        folio: Math.random().toString(36).substring(2, 10).toUpperCase()
      };
    }, 3000);
  }

  activatePremium(): void {
    const user = this.auth.getUser();
    if (!user) {
      this.logger.warn('Intento de activación de premium sin login');
      this.messageService.add({
        severity: 'warn',
        summary: '⚠️ Acceso requerido',
        detail: 'Debes iniciar sesión primero',
        life: 3000
      });
      return;
    }

    const userId = user.id_usuario;
    if (!userId) {
      this.messageService.add({
        severity: 'error',
        summary: '⚠️ Error interno',
        detail: 'No se pudo obtener el usuario',
        life: 3000
      });
      return;
    }

    const expiry = this.paymentForm.get('cardExpiry')!.value;
    const year = expiry.split('/')[1];
    const cardNumber = this.paymentForm.get('cardNumber')!.value;
    const cvv = this.paymentForm.get('cardCvv')!.value;

    this.subscriptionService.updateRole(userId, 'PREMIUM', year, cardNumber, cvv)
      .subscribe({
        next: (res) => {
          const newToken = res.token || this.auth.getToken();
          this.auth.saveSession(res.user, newToken);

          this.logger.info('Usuario activó plan premium');

          this.saveCardData();
          this.closeModal();

          this.messageService.add({
            severity: 'success',
            summary: '🎉 ¡Felicidades!',
            detail: 'Ahora eres Usuario PREMIUM 👑',
            life: 3000
          });
        },
        error: (error: any) => {
          this.logger.error('Error al activar premium', error);

          this.messageService.add({
            severity: 'error',
            summary: '⚠️ Error',
            detail: 'No se pudo activar premium: ' + (error.message || error.error || 'Error desconocido'),
            life: 3000
          });
        }
      });
  }

  downgrade(): void {
    const user = this.auth.getUser();
    if (!user) return;

    this.logger.warn('Usuario canceló suscripción premium', { userId: user.id_usuario });

    this.subscriptionService.updateRole(user.id_usuario, 'FREE')
      .subscribe({
        next: (res) => {
          this.auth.login(res.user);

          this.messageService.add({
            severity: 'info',
            summary: '🚀 Plan cambiado',
            detail: 'Ahora tienes el plan Básico',
            life: 3000
          });
        },
        error: (error: any) => {
          this.logger.error('Error al cancelar suscripción premium', error);
        }
      });
  }

  filterPlans(type: 'all' | 'basic' | 'premium'): void {
    this.activeFilter = type;
    this.messageService.add({
      severity: 'info',
      summary: '✨ Filtro aplicado',
      detail: type === 'all' ? 'Mostrando todos los planes.' : `Filtrando: plan ${type}.`,
      life: 3000,
    });
  }

  toggleStatusFilter(): void {
    this.statusActive = !this.statusActive;
    this.messageService.add({
      severity: 'info',
      summary: '✨ Filtro de estado',
      detail: this.statusActive
        ? 'Mostrando suscripciones activas.'
        : 'Mostrando todas las suscripciones.',
      life: 3000,
    });
  }

  openCancelModal(): void {
    if (!this.auth.isPremium()) {
      this.logger.warn('Intento de cancelar suscripción sin ser premium');
      return;
    }
    this.cancelModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeCancelModal(): void {
    this.cancelModalOpen = false;
    document.body.style.overflow = '';
  }

  cancelOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('overlay'))
      this.closeCancelModal();
  }

  confirmDowngrade(): void {
    this.closeCancelModal();
    this.downgrade();
  }

  saveCardData(): void {
    const user = this.auth.getUser();
    if (!user || !user.id_usuario) return;

    const cardNumber = this.paymentForm.get('cardNumber')!.value;
    const expiry = this.paymentForm.get('cardExpiry')!.value;
    const year = expiry.split('/')[1];

    if (!cardNumber || !year) return;

    this.subscriptionService.saveCardData(user.id_usuario, cardNumber, year)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: '💳 Tarjeta guardada',
            detail: 'Datos de tarjeta guardados exitosamente',
            life: 2000
          });
        },
        error: (error: any) => {
          this.logger.error('Error guardando datos de tarjeta', error);

          this.messageService.add({
            severity: 'warn',
            summary: '⚠️ Tarjeta no guardada',
            detail: 'No se pudieron guardar los datos de tarjeta',
            life: 3000
          });
        }
      });
  }
}