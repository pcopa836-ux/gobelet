export interface Reserva {
  id?: string;
  cliente: string;
  telefono: string;
  servicioId: string;
  servicioNombre: string;
  fechaHora: string;
  total: number;
  adelanto: number;
  estado: 'Pendiente' | 'Pagado' | 'Confirmada' | 'Cancelada';
  estilista?: string;
  senaPagada?: boolean;
  esEcologica?: boolean;
}

export interface ServicioSalon {
  id?: string;
  nombre: string;
  precio: number;
  imagenUrl: string;
  duracion: string;
  descripcion?: string;
}