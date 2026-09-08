export interface Reserva {
      id: string;
  cliente: string;
  telefono: string;
  servicio: string;
  estilista: string;
  fechaHora: string;
  senaPagada: boolean;
  esEcologica: boolean;
  estado: 'Confirmada' | 'En Espera' | 'Cancelada';
}

export interface ServicioSalon {
  id?: string;
  nombre: string;
  precio: number;
  imagenUrl: string;
  duracion: string;
  descripcion?: string;
}