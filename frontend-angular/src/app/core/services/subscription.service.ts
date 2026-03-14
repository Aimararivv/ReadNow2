import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {

  private API = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) {}

  updateRole(
    id:number,
    role:string,
    cardYear?:string,
    cardNumber?:string,
    cvv?:string
  ):Observable<any>{

    return this.http.put(`${this.API}/update-role/${id}`,{
      role,
      cardYear,
      cardNumber,
      cvv
    });
  }
}