import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { DatabaseService } from '../../services/data-base-service';
import { Reserva, ServicioSalon } from '../../model/reserva';
import { FormsModule } from '@angular/forms';
import { getDatabase, ref, onValue,get } from 'firebase/database';
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

  fechaSeleccionada: string = '';
  horaSeleccionada: string = '';
  horariosOcupados: string[] = [];

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
  console.log('Se hizo clic en el servicio:', servicio);
  this.servicioSeleccionado = servicio;
  this.total = servicio.precio;
  this.adelanto = Math.round(servicio.precio * 0.3);
  this.faseModal = 'formulario';
  this.mostrarModal = true;
}
  cerrarModal(): void {
    this.mostrarModal = false;
    this.nuevaReserva = { cliente: '', telefono: '', fechaHora: '' };
    this.fechaSeleccionada = '';
    this.horaSeleccionada = '';
    this.horariosOcupados = [];
  }
  async pasarAPago(): Promise<void> {
    if (!this.nuevaReserva.cliente || !this.nuevaReserva.telefono || !this.fechaSeleccionada || !this.horaSeleccionada) {
      alert('Por favor llena todos los campos y selecciona una hora disponible.');
      return;
    }

    // Concatenamos fecha y hora para mantener la compatibilidad con tu modelo actual
    this.nuevaReserva.fechaHora = `${this.fechaSeleccionada} ${this.horaSeleccionada}`;

    try {
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
      
      this.reservaIdActual = await this.dbService.crearReserva(JSON.parse(JSON.stringify(reservaAGuardar)));
      const urlPago = `${environment.baseUrl}/pago-simulado/${this.reservaIdActual}`;
      this.qrCodeUrl = await QRCode.toDataURL(urlPago, { width: 300, margin: 2 });
      this.faseModal = 'pago';
      this.escucharEstadoReserva(this.reservaIdActual);

    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al generar la reserva');
    }
  }
  escucharEstadoReserva(id: string): void {
    const reservaRef = ref(this.db, `reservas/${id}`);
    onValue(reservaRef, (snapshot) => {
      const datos = snapshot.val();
      if (datos && datos.estado === 'Pagado') {
        this.faseModal = 'exito';
      }
    });
  }

  async onFechaChange(): Promise<void> {
    this.horaSeleccionada = ''; 
    this.horariosOcupados = [];
    
    if (!this.fechaSeleccionada || !this.servicioSeleccionado?.id) return;

    // Consultamos Firebase para ver qué horas ya están tomadas ese día
    const reservasRef = ref(this.db, 'reservas');
    try {
      const snapshot = await get(reservasRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const ocupadas: string[] = [];
        
        // Iteramos las reservas para extraer las horas ocupadas
        Object.values(data).forEach((res: any) => {
          // Validamos que sea el mismo servicio, que no esté cancelada y coincida la fecha
          if (res.servicioId === this.servicioSeleccionado!.id &&
              res.estado !== 'Cancelada' &&
              res.fechaHora.startsWith(this.fechaSeleccionada)) {
                
                // Como guardaremos la fecha como "YYYY-MM-DD HH:mm", separamos por el espacio
                const horaOcupada = res.fechaHora.split(' ')[1];
                if (horaOcupada) ocupadas.push(horaOcupada);
          }
        });
        this.horariosOcupados = ocupadas;
      }
    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
    }
  }
  seleccionarHora(hora: string): void {
    if (!this.horariosOcupados.includes(hora)) {
      this.horaSeleccionada = hora;
    }
  }

}