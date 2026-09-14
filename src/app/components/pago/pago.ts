import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FirebaseApp } from '@angular/fire/app';
import { getDatabase, ref, onValue, update } from 'firebase/database';

@Component({
  selector: 'app-pago',
  imports: [CommonModule],
  templateUrl: './pago.html',
  styleUrl: './pago.css',
})
export class Pago {
  private route = inject(ActivatedRoute);
  private firebaseApp = inject(FirebaseApp);
  private db = getDatabase(this.firebaseApp);

  reservaId: string = '';
  datosReserva: any = null;
  estadoPago: 'pendiente' | 'procesando' | 'exito' = 'pendiente';

  ngOnInit(): void {
    // Capturamos el ID de la URL
    this.reservaId = this.route.snapshot.paramMap.get('id') || '';
    
    if (this.reservaId) {
      this.cargarReserva();
    }
  }
  cargarReserva(): void {
    const reservaRef = ref(this.db, `reservas/${this.reservaId}`);
    
    // onValue nos trae los datos de Firebase
    onValue(reservaRef, (snapshot) => {
      this.datosReserva = snapshot.val();
    });
  }
  async confirmarPago(): Promise<void> {
    this.estadoPago = 'procesando';
    
    try {
      const reservaRef = ref(this.db, `reservas/${this.reservaId}`);
      
      // Actualizamos el estado en Firebase
      await update(reservaRef, { estado: 'Pagado' });
      
      this.estadoPago = 'exito';
    } catch (error) {
      console.error('Error al procesar el pago', error);
      this.estadoPago = 'pendiente';
      alert('Hubo un error al conectar con el servidor.');
    }
  }
}
