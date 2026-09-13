// src/data/veterinariosNosotrosExtra.js
// Info que SOLO se usa en la página "Nosotros" (tarjetas del equipo).
// No repite nombre, especialidad ni foto — esos vienen de veterinariosData.js.
// La clave de cada objeto es el `id` del veterinario en veterinariosData.js.

export const veterinariosExtra = {
  1: { desc: 'Atención primaria y seguimiento de salud integral para mascotas.', sede: 'Sede Laureles', horario: 'Lun–Vie 8am–4pm', gradient: 'linear-gradient(135deg,#a8e4c4,#63D7FE)', icon: 'fa-solid fa-user-doctor' },
  2: { desc: 'Especialista en medicina preventiva y control de peso animal.', sede: 'Sede Envigado', horario: 'Lun–Sáb 9am–4pm', gradient: 'linear-gradient(135deg,#a8e4c4,#63D7FE)', icon: 'fa-solid fa-user-doctor' },
  3: { desc: 'Consulta general, diagnóstico y tratamiento de enfermedades comunes.', sede: 'Sede Bello', horario: 'Mar–Sáb 8am–4pm', gradient: 'linear-gradient(135deg,#a8e4c4,#63D7FE)', icon: 'fa-solid fa-user-doctor' },
  4: { desc: 'Atención clínica con enfoque en bienestar y calidad de vida animal.', sede: 'Sede Envigado', horario: 'Lun–Vie 10am–6pm', gradient: 'linear-gradient(135deg,#a8e4c4,#63D7FE)', icon: 'fa-solid fa-user-doctor' },
  5: { desc: 'Medicina general con énfasis en geriatría y cuidado de mascotas mayores.', sede: 'Sede Laureles', horario: 'Mié–Dom 8am–4pm', gradient: 'linear-gradient(135deg,#a8e4c4,#63D7FE)', icon: 'fa-solid fa-user-doctor' },

  6: { desc: 'Especialista en alergias, nutrición y calidad de vida cutánea.', sede: 'Sede Laureles · Envigado', horario: 'Lun–Vie 8am–4pm', gradient: 'linear-gradient(135deg,#f9a8d4,#c4b5fd)', icon: 'fa-solid fa-hand-sparkles' },
  7: { desc: 'Tratamiento de enfermedades de piel, pelaje y oídos en pequeños animales.', sede: 'Sede Bello · Laureles', horario: 'Mar–Sáb 9am–5pm', gradient: 'linear-gradient(135deg,#f9a8d4,#c4b5fd)', icon: 'fa-solid fa-hand-sparkles' },

  8: { desc: 'Atención de emergencias críticas y estabilización de pacientes.', sede: 'Todas las sedes', horario: '24/7 · Turno 00:00–06:00', gradient: 'linear-gradient(135deg,#fca5a5,#f87171)', icon: 'fa-solid fa-kit-medical' },
  9: { desc: 'Manejo de trauma, intoxicaciones y urgencias respiratorias animales.', sede: 'Todas las sedes', horario: '24/7 · Turno 06:00–12:00', gradient: 'linear-gradient(135deg,#fca5a5,#f87171)', icon: 'fa-solid fa-kit-medical' },
  10: { desc: 'Especialista en cuidados intensivos y recuperación posquirúrgica.', sede: 'Todas las sedes', horario: '24/7 · Turno 12:00–18:00', gradient: 'linear-gradient(135deg,#fca5a5,#f87171)', icon: 'fa-solid fa-kit-medical' },

  11: { desc: 'Programas de desparasitación interna y externa para toda la familia.', sede: 'Sede Laureles', horario: 'Lun–Sáb 8am–3pm', gradient: 'linear-gradient(135deg,#86efac,#4ade80)', icon: 'fa-solid fa-shield-virus' },
  12: { desc: 'Control de parásitos con tratamientos seguros y personalizados.', sede: 'Sede Bello', horario: 'Mar–Dom 9am–4pm', gradient: 'linear-gradient(135deg,#86efac,#4ade80)', icon: 'fa-solid fa-shield-virus' },
  13: { desc: 'Seguimiento y calendarios de desparasitación adaptados a cada mascota.', sede: 'Sede Envigado', horario: 'Lun–Vie 8am–4pm', gradient: 'linear-gradient(135deg,#86efac,#4ade80)', icon: 'fa-solid fa-shield-virus' },

  14: { desc: 'Esquemas de vacunación completos para perros, gatos y exóticos.', sede: 'Sede Laureles · Envigado', horario: 'Lun–Sáb 8am–3pm', gradient: 'linear-gradient(135deg,#93c5fd,#60a5fa)', icon: 'fa-solid fa-syringe' },
  15: { desc: 'Aplicación de biológicos con seguimiento de reacciones adversas.', sede: 'Sede Bello', horario: 'Mar–Dom 9am–4pm', gradient: 'linear-gradient(135deg,#93c5fd,#60a5fa)', icon: 'fa-solid fa-syringe' },

  16: { desc: 'Co-fundadora y directora médica general de EPS PetFeliz.', sede: 'Sede Laureles', horario: 'Lun–Vie 8am–4pm', gradient: 'linear-gradient(135deg,#fde68a,#fbbf24)', icon: 'fa-solid fa-star' },
  17: { desc: 'Director médico de la sede Bello, con 10 años en clínica veterinaria.', sede: 'Sede Bello', horario: 'Lun–Sáb 8am–3pm', gradient: 'linear-gradient(135deg,#fde68a,#fbbf24)', icon: 'fa-solid fa-star' },
  18: { desc: 'Directora médica de la sede Envigado, especialista en medicina interna.', sede: 'Sede Envigado', horario: 'Lun–Vie 9am–5pm', gradient: 'linear-gradient(135deg,#fde68a,#fbbf24)', icon: 'fa-solid fa-star' },

  19: { desc: 'Especialista en cirugía de tejidos blandos y ortopedia veterinaria.', sede: 'Sede Laureles', horario: 'Lun–Vie 7am–3pm', gradient: 'linear-gradient(135deg,#fde68a,#95F7BB)', icon: 'fa-solid fa-scalpel' },
  20: { desc: 'Cirugía de tejidos blandos, esterilizaciones y procedimientos oncológicos.', sede: 'Sede Envigado', horario: 'Mar–Sáb 7am–2pm', gradient: 'linear-gradient(135deg,#fde68a,#95F7BB)', icon: 'fa-solid fa-scalpel' },
  21: { desc: 'Especialista en neurocirugía y procedimientos mínimamente invasivos.', sede: 'Sede Bello', horario: 'Lun–Vie 7am–3pm', gradient: 'linear-gradient(135deg,#fde68a,#95F7BB)', icon: 'fa-solid fa-scalpel' },

  22: { desc: 'Especialista en salud bucal y tratamiento de enfermedades dentales.', sede: 'Sede Laureles', horario: 'Lun–Jue 9am–3pm', gradient: 'linear-gradient(135deg,#fde68a,#95F7BB)', icon: 'fa-solid fa-scalpel' },

  23: { desc: 'Atención de emergencias en horario nocturno y cuidado crítico.', sede: 'Todas las sedes', horario: '24/7 · Turno 18:00–00:00', gradient: 'linear-gradient(135deg,#fca5a5,#f87171)', icon: 'fa-solid fa-kit-medical' },
  24: { desc: 'Atención de emergencias nocturnas y soporte crítico inicial.', sede: 'Todas las sedes', horario: '24/7 · Turno 00:00–06:00', gradient: 'linear-gradient(135deg,#fca5a5,#f87171)', icon: 'fa-solid fa-kit-medical' },
  25: { desc: 'Atención de urgencias matutinas y estabilización prequirúrgica.', sede: 'Todas las sedes', horario: '24/7 · Turno 06:00–12:00', gradient: 'linear-gradient(135deg,#fca5a5,#f87171)', icon: 'fa-solid fa-kit-medical' },
  26: { desc: 'Manejo de urgencias en horario de mayor afluencia y triage.', sede: 'Todas las sedes', horario: '24/7 · Turno 12:00–18:00', gradient: 'linear-gradient(135deg,#fca5a5,#f87171)', icon: 'fa-solid fa-kit-medical' },
  27: { desc: 'Estabilización de pacientes críticos en el cierre del día.', sede: 'Todas las sedes', horario: '24/7 · Turno 18:00–00:00', gradient: 'linear-gradient(135deg,#fca5a5,#f87171)', icon: 'fa-solid fa-kit-medical' },
  28: { desc: 'Atención integral con calidez y trato cercano a cada paciente y su familia.', sede: 'Sede Bello', horario: 'Mar-Sab 8am-4pm', gradient: 'linear-gradient(135deg,#a8e4c4,#63D7FE)', icon: 'fa-solid fa-user-doctor' },
}

export default veterinariosExtra