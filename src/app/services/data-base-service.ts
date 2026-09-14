import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import { listVal } from '@angular/fire/database';
import { getDatabase, ref, push, remove, update } from 'firebase/database';
import { Observable } from 'rxjs';
import { Reserva, ServicioSalon } from '../model/reserva';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private firebaseApp = inject(FirebaseApp);
  private db = getDatabase(this.firebaseApp);
  private injector = inject(Injector);

  // ==================== RESERVAS ====================
  
  getReservas(): Observable<Reserva[]> {
    const reservasRef = ref(this.db, 'reservas');
    return runInInjectionContext(this.injector, () => {
      return listVal<Reserva>(reservasRef, { keyField: 'id' });
    });
  }

  async crearReserva(reserva: Reserva): Promise<string> {
    const reservasRef = ref(this.db, 'reservas');
    const nuevaReservaRef = await push(reservasRef, reserva);
    return nuevaReservaRef.key as string;
  }

  async actualizarEstadoReserva(id: string, nuevoEstado: string): Promise<void> {
    const reservaRef = ref(this.db, `reservas/${id}`);
    await update(reservaRef, { estado: nuevoEstado });
  }

  // ==================== SECCIÓN SERVICIOS DEL SALÓN ====================

  getServicios(): Observable<ServicioSalon[]> {
    const serviciosRef = ref(this.db, 'servicios');
    return runInInjectionContext(this.injector, () => {
      return listVal<ServicioSalon>(serviciosRef, { keyField: 'id' });
    });
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