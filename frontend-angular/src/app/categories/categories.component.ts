import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent {

categories = [

{
name:"Children's literature",
icon:"🧸",
color:"child"
},

{
name:"Fiction",
icon:"📖",
color:"fiction"
},

{
name:"Detective and mystery stories",
icon:"🕵️",
color:"mystery"
},

{
name:"Short stories",
icon:"✍️",
color:"stories"
},

{
name:"History",
icon:"🏛️",
color:"history"
},

{
name:"Composers",
icon:"🎼",
color:"music"
},

{
name:"Music appreciation",
icon:"🎵",
color:"music2"
},

{
name:"Philosophy",
icon:"🧠",
color:"philosophy"
}

];

constructor(private router:Router){}

goToCategory(category:any){

this.router.navigate(['/catalog'],{
queryParams:{category:category.name}
});

}

}