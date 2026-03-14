import { Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CategoriesComponent } from './categories/categories.component';
import { PremiumComponent } from './premium/premium.component';
import { BookDetailComponent } from './pages/book-detail/book-detail.component';
import { CatalogComponent } from './pages/catalog/catalog.component';
import { ProfileComponent } from './pages/profile/profile.component';

import { premiumGuard } from './core/services/premium.guard';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'home',
    component: DashboardComponent
  },
  {
    path: 'categorias',
    component: CategoriesComponent
  },
  {
    path: 'categories',
    component: CategoriesComponent
  },
  {
    path: 'catalog',
    component: CatalogComponent
  },
  {
    path: 'premium',
    component: PremiumComponent
  },
  {
    path: 'perfil',
    component: ProfileComponent
  },

  // Libro (PROTEGIDO)
  {
    path: 'book/:id',
    component: BookDetailComponent,
    canActivate: [premiumGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];