// Datos en memoria - Escuelita Lo Miranda FC

export const categories = [
  { id: 'sub6', name: 'Sub-6', label: 'Mini', ageRange: '4-6 años', color: '#22c55e' },
  { id: 'sub8', name: 'Sub-8', label: 'Pre-Infantil', ageRange: '7-8 años', color: '#3b82f6' },
  { id: 'sub10', name: 'Sub-10', label: 'Infantil', ageRange: '9-10 años', color: '#38bdf8' },
  { id: 'sub12', name: 'Sub-12', label: 'Pre-Juvenil', ageRange: '11-12 años', color: '#f59e0b' },
  { id: 'sub14', name: 'Sub-14', label: 'Juvenil', ageRange: '13-14 años', color: '#ef4444' },
  { id: 'sub16', name: 'Sub-16', label: 'Cadetes', ageRange: '15-16 años', color: '#a855f7' },
  { id: 'adultos', name: 'Adultos', label: 'Honor', ageRange: '17+ años', color: '#f5c542' },
];

// Helper para generar avatares (Personalizable)
const getAvatar = (seed) => `/images/avatares/ramos.png`;

export const staff = {
  sub10: [
    { id: 'dt1', name: 'CARLOS MIRANDA', role: 'Director Técnico', image: getAvatar('Carlos') },
    { id: 'dt2', name: 'RODRIGO SOTO', role: 'Asistente Técnico', image: getAvatar('Rodrigo') },
  ],
  sub6: [
    { id: 'dt3', name: 'MARCO SILVA', role: 'Director Técnico', image: getAvatar('Marco') },
  ],
  sub8: [
    { id: 'dt4', name: 'PEDRO LAGOS', role: 'Director Técnico', image: getAvatar('Pedro') },
  ],
  sub12: [
    { id: 'dt5', name: 'JAVIER REYES', role: 'Director Técnico', image: getAvatar('Javier') },
  ],
  sub14: [
    { id: 'dt6', name: 'ANDRÉS VEGA', role: 'Director Técnico', image: getAvatar('Andres') },
  ],
  sub16: [
    { id: 'dt7', name: 'FELIPE CONTRERAS', role: 'Director Técnico', image: getAvatar('Felipe') },
  ],
  adultos: [
    { id: 'dt8', name: 'LUIS MORALES', role: 'Director Técnico', image: getAvatar('Luis') },
  ],
};

export const playersByCategory = {
  sub10: [
    { id: 1,  name: 'TOMÁS DÍAZ',      overall: 78, dorsal: 1,  position: 'POR', pace: 60, shooting: 40, passing: 65, dribbling: 55, defense: 75, physical: 70, image: getAvatar('Tomas') },
    { id: 2,  name: 'MATÍAS ROJAS',     overall: 80, dorsal: 4,  position: 'DFC', pace: 68, shooting: 45, passing: 70, dribbling: 60, defense: 82, physical: 78, image: getAvatar('Matias') },
    { id: 3,  name: 'DIEGO FUENTES',    overall: 79, dorsal: 3,  position: 'DFC', pace: 65, shooting: 42, passing: 72, dribbling: 58, defense: 80, physical: 76, image: getAvatar('Diego') },
    { id: 4,  name: 'LUCAS NAVARRETE',  overall: 77, dorsal: 14, position: 'LI',  pace: 80, shooting: 50, passing: 68, dribbling: 72, defense: 70, physical: 65, image: getAvatar('Lucas') },
    { id: 5,  name: 'FELIPE ARÁNGUIZ',  overall: 78, dorsal: 2,  position: 'LD',  pace: 78, shooting: 48, passing: 66, dribbling: 70, defense: 72, physical: 68, image: getAvatar('FelipeA') },
    { id: 6,  name: 'SANTIAGO MUÑOZ',   overall: 85, dorsal: 8,  position: 'MC',  pace: 72, shooting: 70, passing: 85, dribbling: 80, defense: 65, physical: 68, image: getAvatar('Santi') },
    { id: 7,  name: 'JOAQUÍN PARRA',    overall: 82, dorsal: 6,  position: 'MC',  pace: 75, shooting: 68, passing: 82, dribbling: 78, defense: 60, physical: 70, image: getAvatar('Joaquin') },
    { id: 8,  name: 'NICOLÁS BARRA',    overall: 80, dorsal: 10, position: 'MCO', pace: 70, shooting: 75, passing: 78, dribbling: 82, defense: 50, physical: 62, image: getAvatar('Nico') },
    { id: 9,  name: 'MARTÍN SALAZAR',   overall: 83, dorsal: 11, position: 'EI',  pace: 88, shooting: 72, passing: 70, dribbling: 85, defense: 40, physical: 60, image: getAvatar('Martin') },
    { id: 10, name: 'BENJAMÍN LÓPEZ',   overall: 81, dorsal: 7,  position: 'ED',  pace: 85, shooting: 70, passing: 68, dribbling: 82, defense: 38, physical: 58, image: getAvatar('Benja') },
    { id: 11, name: 'MATEO MIRANDA',    overall: 88, dorsal: 9,  position: 'DC',  pace: 82, shooting: 88, passing: 75, dribbling: 80, defense: 35, physical: 72, image: getAvatar('Mateo') },
  ],

  sub6: [
    { id: 12, name: 'SANTIAGO SILVA',   overall: 65, dorsal: 9, position: 'DC', pace: 70, shooting: 60, passing: 55, dribbling: 75, defense: 30, physical: 45, image: getAvatar('SantiS') },
  ],
  sub8: [
    { id: 13, name: 'JUAN PÉREZ JR',    overall: 72, dorsal: 10, position: 'MC', pace: 65, shooting: 58, passing: 75, dribbling: 70, defense: 50, physical: 60, image: getAvatar('JuanJr') },
  ],
  sub12: [
    { id: 14, name: 'LUCAS REYES', overall: 81, position: 'MCO', pace: 75, shooting: 78, passing: 82, dribbling: 85, defense: 45, physical: 65, image: getAvatar('LucasR') },
    { id: 15, name: 'PEDRO LAGOS', overall: 79, position: 'DFC', pace: 68, shooting: 45, passing: 70, dribbling: 60, defense: 85, physical: 82, image: getAvatar('PedroL') },
  ],
  sub14: [],
  sub16: [],
  adultos: [],
};

// Eventos del calendario
export const events = [
  { id: 1, type: 'training', title: 'Entrenamiento Sub-10', date: '2026-03-30', time: '16:00', location: 'Cancha Lo Miranda' },
  { id: 2, type: 'match', title: 'vs Club Deportivo Rancagua', date: '2026-04-02', time: '10:00', location: 'Estadio Municipal', category: 'sub10' },
  { id: 3, type: 'training', title: 'Entrenamiento Sub-12', date: '2026-03-31', time: '17:00', location: 'Cancha Lo Miranda' },
  { id: 4, type: 'match', title: 'vs Escuela Machalí FC', date: '2026-04-05', time: '11:00', location: 'Cancha Lo Miranda', category: 'sub10' },
];

// Finanzas (solo visible para Admin/DT/Contador)
export const finances = [
  { id: 1, type: 'income', description: 'Cuotas mensuales marzo', amount: 450000, date: '2026-03-01' },
  { id: 2, type: 'expense', description: 'Compra balones', amount: 85000, date: '2026-03-05' },
  { id: 3, type: 'income', description: 'Auspicio local', amount: 200000, date: '2026-03-10' },
  { id: 4, type: 'expense', description: 'Arriendo cancha', amount: 120000, date: '2026-03-15' },
  { id: 5, type: 'expense', description: 'Indumentaria infantil', amount: 350000, date: '2026-03-20' },
];
