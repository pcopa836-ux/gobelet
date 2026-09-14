import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { signInWithEmailAndPassword } from 'firebase/auth';

@Component({
  imports: [CommonModule,FormsModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  email = '';
  password = '';
  mensajeError = '';
  cargando = false;

  private auth = inject(Auth);
  private router = inject(Router);

  async ingresar() {
    this.mensajeError = '';
    if (!this.email.trim() || !this.password.trim()) {
      this.mensajeError = 'Por favor, completa ambos campos.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.mensajeError = 'Ingresa un formato de correo válido.';
      return;
    }

    this.cargando = true;

    try {
      await signInWithEmailAndPassword(this.auth, this.email, this.password);
      this.router.navigate(['/admin']);
      
    } catch (error: any) {
      console.error("Código de error de Firebase:", error.code);
      
      switch (error.code) {
        case 'auth/invalid-email':
          this.mensajeError = 'El formato del correo es inválido.';
          break;
        case 'auth/user-not-found':
          this.mensajeError = 'No existe ningún usuario registrado con este correo.';
          break;
        case 'auth/wrong-password':
          this.mensajeError = 'La contraseña es incorrecta.';
          break;
        case 'auth/invalid-credential':
          this.mensajeError = 'El correo o la contraseña son incorrectos.';
          break;
        case 'auth/too-many-requests':
          this.mensajeError = 'Demasiados intentos fallidos. Tu cuenta ha sido bloqueada temporalmente. Intenta más tarde.';
          break;
        case 'auth/network-request-failed':
          this.mensajeError = 'Error de conexión. Por favor, revisa tu conexión a internet.';
          break;
        default:
          this.mensajeError = 'Ocurrió un error inesperado. Inténtalo de nuevo.';
      }
    } finally {
      this.cargando = false;
    }
  }
}
