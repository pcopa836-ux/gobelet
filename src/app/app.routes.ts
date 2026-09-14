import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Admin } from './components/admin/admin';
import { Login } from './components/login/login';
import { authGuard } from './guards/auth-guard';
import { Pago } from './components/pago/pago';

export const routes: Routes = [
    { path : '', component: Home},
    { path : 'login', component:Login},
    { path : 'admin',component: Admin,canActivate: [authGuard]},
    { path: 'pago-simulado/:id', component: Pago },
    { path : '**', redirectTo: ''}
    
];
