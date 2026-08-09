# 🐾 PetFeliz — EPS Veterinaria

Plataforma de EPS (plan de salud) veterinaria para Medellín. Permite a los clientes gestionar el plan de salud de sus mascotas: agendar citas, pagar servicios, y consultar documentos como carné EPS, historial de atenciones y facturas.

> ⚠️ Proyecto académico en desarrollo activo — SENA, Tecnología en Análisis y Desarrollo de Software (ADSO).

## 📌 Estado actual

El proyecto está en construcción. Actualmente completado:

- ✅ Autenticación completa (registro, login, recuperar/restablecer contraseña) con Sanctum
- ✅ Dashboard del cliente con rutas protegidas
- ✅ Módulo de Servicios (catálogo + historial)
- ✅ Módulo de Pagos y Facturación (con recibo imprimible)
- ✅ Módulo de Documentos (carné EPS, resumen de atenciones, facturas)
- ✅ Base de datos relacional normalizada (30+ tablas)
- 🔧 En construcción: CRUD de Mascotas, ajustes finales de UI/UX

## 🛠️ Stack tecnológico

**Frontend**
- React + Vite
- React Router
- Framer Motion
- FontAwesome
- Cloudinary (hosting de imágenes)

**Backend**
- Laravel 12
- Laravel Sanctum (autenticación por tokens)
- MySQL

## 📂 Estructura del proyecto

```
petfeliz/
├── frontend/     # Aplicación React (Vite)
└── backend/      # API REST en Laravel
```

## 🚀 Instalación y ejecución local

### Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Configura tu conexión a MySQL en .env
php artisan migrate
php artisan serve
```

### Frontend (React/Vite)

```bash
cd frontend
npm install
npm run dev
```

## 👥 Equipo

Proyecto desarrollado en equipo como parte de la formación SENA ADSO (ficha 3115970, CTM Itagüí).

## 📄 Licencia

Proyecto académico — uso educativo.