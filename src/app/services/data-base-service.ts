import { Injectable, inject } from '@angular/core';
// 1. Inyectamos la App inicializada de AngularFire
import { FirebaseApp } from '@angular/fire/app';
// 2. Importamos listVal para observadores reactivos
import { listVal } from '@angular/fire/database';
// 3. Importamos los métodos nativos de Firebase
import { getDatabase, ref, push, remove, update } from 'firebase/database';
import { Observable } from 'rxjs';
import { Reserva, ServicioSalon } from '../model/reserva';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  // Obtenemos la instancia de la app desde el inyector de Angular
  private firebaseApp = inject(FirebaseApp);
  // Obtenemos la base de datos nativa vinculada a esa app
  private db = getDatabase(this.firebaseApp);

  // ==================== SECCIÓN RESERVAS ====================
  
  getReservas(): Observable<Reserva[]> {
    const reservasRef = ref(this.db, 'reservas');
    return listVal<Reserva>(reservasRef, { keyField: 'id' });
  }

  async crearReserva(reserva: Reserva): Promise<void> {
    const reservasRef = ref(this.db, 'reservas');
    await push(reservasRef, reserva);
  }

  async actualizarEstadoReserva(id: string, nuevoEstado: string): Promise<void> {
    const reservaRef = ref(this.db, `reservas/${id}`);
    await update(reservaRef, { estado: nuevoEstado });
  }

  // ==================== SECCIÓN SERVICIOS DEL SALÓN ====================

  getServicios(): Observable<ServicioSalon[]> {
    const serviciosRef = ref(this.db, 'servicios');
    return listVal<ServicioSalon>(serviciosRef, { keyField: 'id' });
  }

  async crearServicio(servicio: Omit<ServicioSalon, 'id'>): Promise<void> {
    const serviciosRef = ref(this.db, 'servicios');
    await push(serviciosRef, servicio);
  }

  async eliminarServicio(id: string): Promise<void> {
    const servicioRef = ref(this.db, `servicios/${id}`);
    await remove(servicioRef);
  }
}