# 📓 Bitácora de Desarrollo (Dev Log) - Escuelita Lo Miranda FC

> **Nota para el desarrollador:** Este archivo sirve como un respaldo persistente de todo el trabajo realizado en el proyecto. Dado que trabajas en múltiples proyectos, puedes consultar este documento para recordar exactamente en qué quedamos, independientemente de si el historial del IDE se muestra correctamente o no.

---

## 📅 [30 de Abril, 2026] - Sistema de Coordinación de Partidos y Calendario
**Conversación de referencia:** `5fb8d3bc-69d7-4138-91c7-b11061ad89d6`

### ✨ Funcionalidades Implementadas
*   **Módulo de Coordinación de Partidos:** Se añadió un formulario masivo en `Calendar.jsx` que permite agendar encuentros para múltiples series (Sub-8, Sub-10, etc.) simultáneamente contra un club rival.
*   **Adjuntar Flyers:** Capacidad de subir imágenes/flyers a los eventos del calendario.
*   **Gestión de Eventos:** Se añadieron botones de **Editar** y **Eliminar** para los eventos del calendario, con un sistema de confirmación moderno en la interfaz (reemplazando el `window.confirm`).

### 🐛 Corrección de Errores (Bugfixes)
*   **Bug de Zona Horaria (UTC):** Se corrigió un error crítico donde al seleccionar una fecha (ej: 10/05/2026), el calendario la agendaba un día antes (09/05/2026). Se implementó la función `parseLocalDate` para forzar la lectura en hora local.

### 🎨 Mejoras de Interfaz (UI/UX)
*   **Rediseño Premium del Modal:** Se actualizó `Calendar.css` para aplicar el diseño de *Glassmorphism* al formulario de coordinación, con fondos oscuros, botones estilizados e inputs más elegantes.

---

## 📅 [29 de Abril, 2026] - Sistema de Apoderados y Cuentas Shadow
**Conversación de referencia:** `af22d01f-fb10-49d7-832a-78474af06ac8`

### ✨ Funcionalidades Implementadas
*   **Cuentas "Shadow" para Jugadores/Apoderados:** 
    *   Generación automática de usuarios limpios (ej: `sjimenez`) sin sufijos aleatorios.
    *   Asignación de un correo interno (`sjimenez@escuelita.local`) y contraseña temporal igual al usuario.
*   **Vinculación en Formulario:** Se modificó `Players.jsx` para que al momento de crear o editar un jugador, se le pueda asignar un apoderado existente o crear uno nuevo en el mismo paso.

---

## 📅 [28 de Abril, 2026] - Módulo de Reportes de Asistencia
**Conversación de referencia:** `e5f82427-97a5-4d23-9a62-3e2dc0dddcf2`

### ✨ Funcionalidades Implementadas
*   **Exportación PDF:** Implementación de un sistema robusto de reportes en el módulo de asistencia que permite a los entrenadores generar archivos PDF.
*   **Filtros:** Capacidad de filtrar la asistencia por mes o por rangos de fechas personalizados, calculando totales y porcentajes.

---

## 💡 Cómo usar este archivo en el futuro:
Cada vez que finalicemos una tarea importante, **actualizaré automáticamente este archivo**. Así, si el chat del IDE desaparece o pasan semanas sin que toques este proyecto, solo tienes que abrir `DEV_LOG.md` y leer la última entrada para saber exactamente dónde te quedaste.
