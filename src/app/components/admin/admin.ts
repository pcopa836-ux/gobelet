import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';
import { DatabaseService } from '../../services/data-base-service';
import { Reserva, ServicioSalon } from '../../model/reserva';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-admin',
  styleUrl: './admin.css',
  templateUrl: './admin.html',
})
export class Admin implements OnInit {
  seccionActual: 'reservas' | 'servicios' | 'config' = 'reservas';

  private auth = inject(Auth);
  private router = inject(Router);
  public dbService = inject(DatabaseService);

  reservas: Reserva[] = [];
  servicios: ServicioSalon[] = [];
  searchTerm: string = '';
  filtroEstado: string = 'Todos';

  paginaActual: number = 1;
  itemsPorPagina: number = 10;

  nuevaHora: string = '';

  mostrarModalServicio = false;
  nuevoServicio: ServicioSalon = {
    nombre: '', precio: 0, duracion: '30 min', imagenUrl: '', descripcion: ''
  };
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    this.dbService.getReservas().subscribe({
      next: (data) => this.reservas = data || [],
      error: (err) => console.error('Error al cargar reservas:', err)
    });

    this.dbService.getServicios().subscribe({
      next: (data) => this.servicios = data || [],
      error: (err) => console.error('Error al cargar servicios:', err)
    });
  }

  get reservasFiltradas(): Reserva[] {
    let filtradas = this.reservas;

    if (this.filtroEstado !== 'Todos') {
      filtradas = filtradas.filter(r => r.estado === this.filtroEstado);
    }

    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      filtradas = filtradas.filter(r => 
        (r.cliente && r.cliente.toLowerCase().includes(term)) || 
        String(r.telefono || '').includes(term) ||
        (r.servicioNombre && r.servicioNombre.toLowerCase().includes(term))
      );
    }
    
    return filtradas.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
  }
  async confirmarReserva(id?: string): Promise<void> {
    if (id) {
      await this.dbService.actualizarEstadoReserva(id, 'Confirmada');
    }
  }

  cambiarSeccion(seccion: 'reservas' | 'servicios' | 'config'): void {
    this.seccionActual = seccion;
  }

  enviarWhatsApp(reserva: Reserva): void {
    let mensaje = '';

    if (reserva.estado === 'Cancelada') {
      const motivo = prompt('Ingrese el motivo de la cancelación para informar al cliente:');
      if (motivo === null) return; 
      mensaje = `Hola ${reserva.cliente}, nos comunicamos de Gobelet. Lamentamos informarte que tu reserva para el servicio de ${reserva.servicioNombre} del ${reserva.fechaHora} ha sido cancelada. Motivo: ${motivo}. Si tienes dudas, puedes responder a este mensaje.`;
    } else {
      mensaje = `Hola ${reserva.cliente}, nos comunicamos de Gobelet para confirmar tu reserva del servicio de ${reserva.servicioNombre} para la fecha ${reserva.fechaHora}.`;
    }
    const url = `https://wa.me/591${reserva.telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  async cancelarReserva(id?: string): Promise<void> {
    if (id && confirm('¿Estás seguro de cancelar esta reserva?')) {
      await this.dbService.actualizarEstadoReserva(id, 'Cancelada');
    }
  }
  async guardarServicio(): Promise<void> {
    try {
      const payload = {
        nombre: this.nuevoServicio.nombre,
        precio: Number(this.nuevoServicio.precio),
        duracion: this.nuevoServicio.duracion || '',
        imagenUrl: this.nuevoServicio.imagenUrl || '',
        descripcion: this.nuevoServicio.descripcion || '',
        horariosDisponibles: this.nuevoServicio.horariosDisponibles || []
      };
      const servicioLimpio = JSON.parse(JSON.stringify(payload));

      if (this.nuevoServicio.id) {
        await this.dbService.actualizarServicio(this.nuevoServicio.id, servicioLimpio);
      } else {
        await this.dbService.crearServicio(servicioLimpio);
      }
      
      this.cerrarModalServicio();
    } catch (error) {
      console.error('Error al guardar el servicio:', error);
      alert('Hubo un error al guardar.');
    }
  }

  eliminarServicio(id?: string): void {
    if (id && confirm('¿Estás seguro de eliminar este servicio?')) {
      this.dbService.eliminarServicio(id);
    }
  }

  abrirModalServicio(): void {
    this.nuevoServicio = { 
      nombre: '', precio: 0, duracion: '30 min', imagenUrl: '', descripcion: '', horariosDisponibles: [] 
    };
    this.nuevaHora = '';
    this.mostrarModalServicio = true;
  }
  abrirModalEditarServicio(servicio: ServicioSalon): void {
    this.nuevoServicio = { 
      ...servicio, 
      horariosDisponibles: servicio.horariosDisponibles ? [...servicio.horariosDisponibles] : [] 
    };
    this.nuevaHora = '';
    this.mostrarModalServicio = true;
  }
  agregarHora(): void {
    if (this.nuevaHora) {
      if (!this.nuevoServicio.horariosDisponibles) {
        this.nuevoServicio.horariosDisponibles = [];
      }
      if (!this.nuevoServicio.horariosDisponibles.includes(this.nuevaHora)) {
        this.nuevoServicio.horariosDisponibles.push(this.nuevaHora);
        this.nuevoServicio.horariosDisponibles.sort(); 
      }
      this.nuevaHora = ''; 
    }
  }
  eliminarHora(horaAElminar: string): void {
    if (this.nuevoServicio.horariosDisponibles) {
      this.nuevoServicio.horariosDisponibles = this.nuevoServicio.horariosDisponibles.filter(h => h !== horaAElminar);
    }
  }

  cerrarModalServicio(): void {
    this.mostrarModalServicio = false;
  }

  async cerrarSesion(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }


  get totalPaginas(): number {
    return Math.ceil(this.reservasFiltradas.length / this.itemsPorPagina);
  }

  get reservasPaginadas(): Reserva[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.reservasFiltradas.slice(inicio, fin);
  }

  cambiarPagina(direccion: number): void {
    const nuevaPagina = this.paginaActual + direccion;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
    }
  }
  
}