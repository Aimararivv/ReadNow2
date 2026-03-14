import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent {
  
  constructor(private router: Router) {}

  goToHome() {
    this.router.navigate(['/home']);
  }

  // Aquí puedes agregar lógica de categorías si es necesario
  categories = [
    { name: 'Ficción', description: 'Novelas y relatos imaginativos', icon: '📚' },
    { name: 'No Ficción', description: 'Ensayos, biografías y textos informativos', icon: '📖' },
    { name: 'Ciencia', description: 'Libros de ciencia y tecnología', icon: '🔬' },
    { name: 'Historia', description: 'Libros de historia y sociedad', icon: '📜' },
    { name: 'Autoayuda', description: 'Crecimiento personal y motivación', icon: '💡' },
    { name: 'Infantil', description: 'Libros para niños y jóvenes', icon: '🧸' }
  ];

  viewBooks(category: string) {
    // Navegar a la página de catálogo con la categoría seleccionada
    this.router.navigate(['/catalog'], { 
      queryParams: { category: category.toLowerCase() } 
    });
  }
}
