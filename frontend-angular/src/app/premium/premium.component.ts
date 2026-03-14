import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SubscriptionService } from '../core/services/subscription.service';
import { AuthService } from '../core/services/auth.service';

// Interfaces
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

// Custom Validators 
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

  // ── Plan state 
  get currentPlan(): 'basic' | 'premium' {
    return this.auth.isPremium() ? 'premium' : 'basic';
  }
  get activePlanName(): string {
    return this.currentPlan === 'premium' ? 'Premium 👑' : 'Básico Gratuito';
  }
  get activePlanDesc(): string {
    return this.currentPlan === 'premium'
      ? 'Acceso ilimitado a toda la biblioteca digital.'
      : 'Acceso a 3 libros al mes con vista previa incluida.';
  }
  get bannerIcon(): string {
    return this.currentPlan === 'premium' ? '👑' : '📖';
  }

  // Filters 
  activeFilter: 'all' | 'basic' | 'premium' = 'all';
  statusActive = true;

  // Routes
  routes: RouteItem[] = [
    { icon: '🏠', name: 'Inicio', path: '/home', requiresPremium: false },
    { icon: '📚', name: 'Catálogo', path: '/catalog', requiresPremium: false },
    { icon: '👁️', name: 'Vista previa', path: '/book/preview', requiresPremium: false },
    { icon: '📖', name: 'Leer completo', path: '/book/read', requiresPremium: true },
    { icon: '⬇️', name: 'Descargar', path: '/book/download', requiresPremium: true },
    { icon: '🤖', name: 'Recomendaciones IA', path: '/recommendations', requiresPremium: true },
    { icon: '📊', name: 'Historial completo', path: '/history', requiresPremium: true },
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

  // Modal
  modalOpen = false;
  isProcessing = false;
  paymentSuccess = false;
  cardFlipped = false;
  cancelModalOpen = false;
  receipt: Receipt = { name: '', card: '', date: '', folio: '' };

  // Reactive form 
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

  // Captcha
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

  constructor(
    public auth: AuthService,   // public → accesible en template
    private fb: FormBuilder,
    private messageService: MessageService,
    private subscriptionService: SubscriptionService,
    private router: Router
  ) { }

  goToHome() {
    this.router.navigate(['/home']);
  }

  goToCatalog() {
    this.router.navigate(['/catalog']);
  }

  ngOnInit(): void {
    this.buildForm();
    this.newCaptcha();
  }

  ngOnDestroy(): void {
    clearTimeout(this.payTimer);
  }

  // Form 
  private buildForm(): void {
  this.paymentForm = this.fb.group({
    cardName: ['', [Validators.required, nameValidator]],
    cardNumber: ['', [Validators.required, cardNumberValidator]],
    cardExpiry: ['', [Validators.required, expiryValidator]],
    cardCvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
  });

  // ─────────────────────────────
  // Nombre → SOLO LETRAS
  // ─────────────────────────────
  this.paymentForm.get('cardName')!.valueChanges.subscribe((v: string) => {
    if (!v) return;

    const clean = v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');

    if (clean !== v) {
      this.paymentForm.get('cardName')!.setValue(clean, { emitEvent: false });
    }
  });

  // ─────────────────────────────
  // Número de tarjeta → SOLO NÚMEROS
  // ─────────────────────────────
  this.paymentForm.get('cardNumber')!.valueChanges.subscribe((v: string) => {
    if (!v) return;

    const clean = v.replace(/\D/g, '').slice(0, 16);
    const formatted = clean.replace(/(\d{4})(?=\d)/g, '$1 ');

    if (formatted !== v) {
      this.paymentForm.get('cardNumber')!.setValue(formatted, { emitEvent: false });
    }
  });

  // ─────────────────────────────
  // Fecha → SOLO NÚMEROS (MM/AA)
  // ─────────────────────────────
  this.paymentForm.get('cardExpiry')!.valueChanges.subscribe((v: string) => {
    if (!v) return;

    let clean = v.replace(/\D/g, '').slice(0, 4);

    if (clean.length >= 3) {
      clean = clean.slice(0, 2) + '/' + clean.slice(2);
    }

    if (clean !== v) {
      this.paymentForm.get('cardExpiry')!.setValue(clean, { emitEvent: false });
    }
  });

  // ─────────────────────────────
  // CVV → SOLO NÚMEROS
  // ─────────────────────────────
  this.paymentForm.get('cardCvv')!.valueChanges.subscribe((v: string) => {
    if (!v) return;

    const clean = v.replace(/\D/g, '').slice(0, 3);

    if (clean !== v) {
      this.paymentForm.get('cardCvv')!.setValue(clean, { emitEvent: false });
    }
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

    this.currentStep = (cardOk && this.captchaCorrect) ? 3
      : cardOk ? 2
        : 1;
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

  // Modal
  openModal(): void {
    if (!this.auth.getUser()) {
      this.messageService.add({
        severity: 'warn',
        summary: '⚠️ Acceso requerido',
        detail: 'Debes iniciar sesión primero',
        life: 3000,
      });
      return;
    }
    this.modalOpen = true;
    this.cardFlipped = false;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.modalOpen = false;
    document.body.style.overflow = '';
    this.resetModal();
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

  // Pago
  processPayment(): void {
    this.paymentForm.markAllAsTouched();
    if (this.paymentForm.invalid) return;
    if (this.isProcessing) return;

    if (!this.captchaCorrect) {
      this.messageService.add({
        severity: 'warn',
        summary: '⚠️ CAPTCHA incompleto',
        detail: 'Completa la verificación antes de continuar',
        life: 3000,
      });
      return;
    }

    this.isProcessing = true;
    this.currentStep = 3;

    const expiry = this.paymentForm.get('cardExpiry')!.value;
    const year = expiry.split('/')[1];

    const name = this.paymentForm.get('cardName')!.value.trim().toUpperCase();
    const num = this.paymentForm.get('cardNumber')!.value.replace(/\s/g, '');

    this.payTimer = setTimeout(() => {
      this.receipt = {
        name,
        card: `•••• •••• •••• ${num.slice(-4)}`,
        date: new Date().toLocaleDateString('es-MX', {
          year: 'numeric', month: 'long', day: 'numeric'
        }),
        folio: 'RN-' + Date.now().toString(36).toUpperCase(),
      };
      this.isProcessing = false;
      this.paymentSuccess = true;
    }, 2200);
  }

  // Activar premium
  activatePremium(): void {

    const user = this.auth.getUser();

    if (!user) {
      this.messageService.add({
        severity: 'warn',
        summary: '⚠️ Acceso requerido',
        detail: 'Debes iniciar sesión primero',
        life: 3000
      });
      return;
    }

    console.log("USER COMPLETO:", user);

    const userId = user.id;

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

    this.subscriptionService.updateRole(
      userId,
      'PREMIUM',
      year,
      cardNumber,
      cvv
    )
      .subscribe({
        next: (res) => {

          this.auth.saveSession(res.user, this.auth.getToken()!);

          this.closeModal();

          this.messageService.add({
            severity: 'success',
            summary: '🎉 ¡Felicidades!',
            detail: 'Ahora eres usuario PREMIUM 👑',
            life: 3000
          });

        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: '⚠️ Error',
            detail: 'No se pudo activar premium',
            life: 3000
          });
        }
      });
  }

  // Degradar plan
  downgrade(): void {

    const user = this.auth.getUser();

    console.log("USER COMPLETO:", user);
    console.log("ID:", user?.id);
    console.log("ID_USUARIO:", user?.id);

    if (!user) return;

    this.subscriptionService.updateRole(user.id, 'FREE')
      .subscribe({
        next: (res) => {
          this.auth.login(res.user);

          this.messageService.add({
            severity: 'info',
            summary: '🚀 Plan cambiado',
            detail: 'Ahora tienes el plan Básico',
            life: 3000
          });
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

  // Modal cancelar suscripción
  openCancelModal(): void {
    if (!this.auth.isPremium()) return;
    this.cancelModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeCancelModal(): void {
    this.cancelModalOpen = false;
    document.body.style.overflow = '';
  }

  cancelOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.closeCancelModal();
    }
  }

  confirmDowngrade(): void {
    this.closeCancelModal();
    this.downgrade();

  }
}