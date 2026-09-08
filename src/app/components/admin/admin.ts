import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';
import { DatabaseService } from '../../services/data-base-service';
import { Reserva, ServicioSalon } from '../../model/reserva';

@Component({
  imports: [CommonModule,FormsModule],
  selector: 'app-admin',
  styleUrl: './admin.css',
  templateUrl: './admin.html',
})
export class Admin implements OnInit {
  seccionActual: 'reservas' | 'servicios' | 'config' = 'reservas';

  private auth = inject(Auth);
  private router = inject(Router);
  private dbService = inject(DatabaseService);

  // Listas reactivas
  reservas: Reserva[] = [];
  servicios: ServicioSalon[] = [];

  // Control del modal/formulario para crear servicio
  mostrarModalServicio = false;
  nuevoServicio: ServicioSalon = {
    nombre: '',
    precio: 0,
    duracion: '30 min',
    imagenUrl: '',
    descripcion: ''
  };
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    
    // Cargar reservas desde Firebase
    this.dbService.getReservas().subscribe({
      next: (data) => this.reservas = data || [],
      error: (err) => console.error('Error al cargar reservas:', err)
    });

    // Cargar servicios del salón desde Firebase
    this.dbService.getServicios().subscribe({
      next: (data) => this.servicios = data || [],
      error: (err) => console.error('Error al cargar servicios:', err)
    });
  }

  cambiarSeccion(seccion: 'reservas' | 'servicios' | 'config'): void {
    this.seccionActual = seccion;
  }

  async guardarServicio(): Promise<void> {
    // 1. Validaciones básicas
    /*if (!this.nuevoServicio.nombre || this.nuevoServicio.precio <= 0) {
      alert('Por favor, ingresa al menos un nombre y un precio válido.');
      return;
    }*/

    try {
      // 2. Extraemos ÚNICAMENTE los valores primitivos (aislamos a Angular)
      const payload = {
        nombre: this.nuevoServicio.nombre,
        precio: Number(this.nuevoServicio.precio), // Forzamos a que sea un número real
        duracion: this.nuevoServicio.duracion || '',
        imagenUrl: this.nuevoServicio.imagenUrl || '',
        descripcion: this.nuevoServicio.descripcion || ''
      };

      // 3. LA MAGIA: Forzamos la creación de un JSON 100% puro y plano.
      // Esto elimina instantáneamente cualquier Proxy, __ngContext__ o función oculta que Angular haya inyectado.
      const servicioLimpio = JSON.parse(JSON.stringify(payload));

      // 4. Enviamos el objeto sanitizado a Firebase
      await this.dbService.crearServicio(servicioLimpio);
      
      // 5. Cerramos el modal y limpiamos el formulario
      this.cerrarModalServicio();

    } catch (error) {
      console.log(JSON.stringify(this.nuevoServicio))
      console.error('Error al guardar el servicio:', error);
      alert('Hubo un error al guardar. Revisa la consola para más detalles.');
    }
  }

  eliminarServicio(id?: string): void {
    if (id && confirm('¿Estás seguro de eliminar este servicio?')) {
      this.dbService.eliminarServicio(id);
    }
  }

  abrirModalServicio(): void {
    this.nuevoServicio = { nombre: '', precio: 0, duracion: '30 min', imagenUrl: '', descripcion: '' };
    this.mostrarModalServicio = true;
  }

  cerrarModalServicio(): void {
    this.mostrarModalServicio = false;
  }

  async cerrarSesion(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }
}