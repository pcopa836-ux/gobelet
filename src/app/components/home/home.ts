import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { DatabaseService } from '../../services/data-base-service';
import { Reserva, ServicioSalon } from '../../model/reserva';
import { FormsModule } from '@angular/forms';
import { getDatabase, ref, onValue } from 'firebase/database';
import * as QRCode from 'qrcode';
import { FirebaseApp } from '@angular/fire/app';
import { environment } from '../../../environments/environment';

@Component({
  imports: [CommonModule,FormsModule],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  scrollY = 0;
  
  servicios: ServicioSalon[] = [];
  private dbService = inject(DatabaseService);
  private firebaseApp = inject(FirebaseApp);
  private db = getDatabase(this.firebaseApp);

  mostrarModal = false;
  faseModal: 'formulario' | 'pago' | 'exito' = 'formulario';
  servicioSeleccionado: ServicioSalon | null = null;
  
  nuevaReserva = {
    cliente: '',
    telefono: '',
    fechaHora: '',
  };
  total: number = 0;
  adelanto: number = 0;
  qrCodeUrl: string = '';
  reservaIdActual: string = '';

  ngOnInit(): void {
    this.dbService.getServicios().subscribe({
      next: (data) => this.servicios = data || [],
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.scrollY = window.scrollY;
  }

  scrollTo(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  abrirModal(servicio: ServicioSalon): void {
  console.log('Se hizo clic en el servicio:', servicio); // <-- Agrega esto
  this.servicioSeleccionado = servicio;
  this.total = servicio.precio;
  this.adelanto = Math.round(servicio.precio * 0.3);
  this.faseModal = 'formulario';
  this.mostrarModal = true;
}
  cerrarModal(): void {
    this.mostrarModal = false;
    this.nuevaReserva = { cliente: '', telefono: '', fechaHora: '' };
  }
  async pasarAPago(): Promise<void> {
    if (!this.nuevaReserva.cliente || !this.nuevaReserva.telefono || !this.nuevaReserva.fechaHora) {
      alert('Por favor llena todos los campos');
      return;
    }

    try {
      // 1. Preparamos el objeto a guardar
      const reservaAGuardar: Reserva = {
        cliente: this.nuevaReserva.cliente,
        telefono: this.nuevaReserva.telefono,
        fechaHora: this.nuevaReserva.fechaHora,
        servicioId: this.servicioSeleccionado!.id || '',
        servicioNombre: this.servicioSeleccionado!.nombre,
        total: this.total,
        adelanto: this.adelanto,
        estado: 'Pendiente'
      };

      // 2. Guardamos en Firebase y obtenemos el ID
      this.reservaIdActual = await this.dbService.crearReserva(JSON.parse(JSON.stringify(reservaAGuardar)));

      // 3. Generamos la URL secreta y el QR
      const urlPago = `${environment.baseUrl}/pago-simulado/${this.reservaIdActual}`;
      this.qrCodeUrl = await QRCode.toDataURL(urlPago, { width: 300, margin: 2 });

      // 4. Cambiamos la vista
      this.faseModal = 'pago';

      // 5. Nos quedamos escuchando cambios en esta reserva
      this.escucharEstadoReserva(this.reservaIdActual);

    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al generar la reserva');
    }
  }
  escucharEstadoReserva(id: string): void {
    const reservaRef = ref(this.db, `reservas/${id}`);
    
    // onValue escucha en tiempo real cualquier cambio en este nodo específico
    onValue(reservaRef, (snapshot) => {
      const datos = snapshot.val();
      if (datos && datos.estado === 'Pagado') {
        this.faseModal = 'exito';
      }
    });
  }

}