import { Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CategoriesComponent } from './categories/categories.component';
import { PremiumComponent } from './premium/premium.component';
import { BookDetailComponent } from './pages/book-detail/book-detail.component';
import { CatalogComponent } from './pages/catalog/catalog.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ResultadosComponent } from './Busqueda/Resultados.component';

import { premiumGuard } from './core/services/premium.guard';
import { FavoritesComponent } from './favorites/favorites.component';

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
  {
    path: 'buscar',
    component: ResultadosComponent 
  },
  {
    path: 'favoritos',
    component: FavoritesComponent 
  },
  // Libro (ACCESO PARA TODOS)
  {
    path: 'book/:id',
    component: BookDetailComponent
  },
  {
    path: '**',
    redirectTo: ''
  },
];