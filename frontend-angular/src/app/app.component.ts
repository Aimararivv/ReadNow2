import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConnectionTestService } from './core/services/connection-test.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavbarComponent, RouterOutlet, ToastModule],
  providers: [MessageService, ConnectionTestService],
  template: `
  <p-toast></p-toast>
  <app-navbar></app-navbar>
  <router-outlet></router-outlet>
`
})
export class AppComponent implements OnInit {
  
  constructor(private connectionTest: ConnectionTestService, private messageService: MessageService) {}

  ngOnInit() {
    console.log('🚀 ReadNow App starting...');
    this.connectionTest.testBackendConnection();
  }
}
