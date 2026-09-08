import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Admin } from './components/admin/admin';
import { Login } from './components/login/login';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    { path : '', component: Home},
    { path : 'login', component:Login},
    { path : 'admin',component: Admin,canActivate: [authGuard]},
    { path : '**', redirectTo: ''}
    
];
