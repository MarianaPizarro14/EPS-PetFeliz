<div align="center">

# 🐾💕 PetFeliz — EPS Veterinaria 🌸

### *Cuidando a tus mejores amigos, un ladrido y un maullido a la vez* ✨🐶🐱

![Status](https://img.shields.io/badge/status-en%20desarrollo-ffb6c1?style=for-the-badge)
![Made with love](https://img.shields.io/badge/hecho%20con-%F0%9F%92%95-ffc0cb?style=for-the-badge)
![React](https://img.shields.io/badge/frontend-React%20%2B%20Vite-fce4ec?style=for-the-badge)
![Laravel](https://img.shields.io/badge/backend-Laravel%2012-f8d7e3?style=for-the-badge)

</div>

---

## 🌷 ¿Qué es PetFeliz?

PetFeliz es una plataforma de **EPS (plan de salud) veterinaria** pensada para las familias peluditas de Medellín 🏡🐾. Aquí los clientes pueden agendar citas, pagar sus servicios y tener a la mano todos los documentos de su mascota (carné EPS, historial de atenciones, facturas) — todo bonito, todo organizado, todo fácil 💗

> ⚠️ Proyecto académico en desarrollo activo — SENA, Tecnología en Análisis y Desarrollo de Software (ADSO) 🎓✨

---

## 🌸 Estado actual del proyecto

Esto es lo que ya está brillando ✅ y lo que sigue en camino 🌟

- ✅ Autenticación completa (registro, login, recuperar/restablecer contraseña) con Sanctum
- ✅ Dashboard del cliente con rutas protegidas
- ✅ Módulo de Servicios (catálogo + historial) 🩺
- ✅ Módulo de Pagos y Facturación (con recibo imprimible) 💳
- ✅ Módulo de Documentos (carné EPS, resumen de atenciones, facturas) 📄
- ✅ Base de datos relacional normalizada (30+ tablas)
- 🔧 En construcción: CRUD de Mascotas 🐹, ajustes finales de UI/UX
- ⏳ Por empezar: CRUD del panel de Administrador 👩‍💻
- ⏳ Por empezar: CRUD del panel de Veterinario 🩺

---

## 🎀 Stack tecnológico

**💻 Frontend**
- React + Vite
- React Router
- Framer Motion
- FontAwesome
- Cloudinary (hosting de imágenes) ☁️

**⚙️ Backend**
- Laravel 12
- Laravel Sanctum (autenticación por tokens)
- MySQL
- Consumo y desarrollo de API REST propia para la comunicación entre frontend y backend 🔗

---

## 📂 Estructura del proyecto

```
petfeliz/
├── frontend/     # Aplicación React (Vite) 💅
└── backend/      # API REST en Laravel ⚙️
```

---

## 🚀 Instalación y ejecución local

### ⚙️ Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Configura tu conexión a MySQL en .env
php artisan migrate
php artisan serve
```

### 💅 Frontend (React/Vite)

```bash
cd frontend
npm install
npm run dev
```

---

## 👯‍♀️ Equipo

Proyecto desarrollado con mucho cariño en equipo, como parte de la formación SENA ADSO (ficha 3115970, CTM Itagüí) 💕

| 🌸 Integrante | 💼 Rol | 🔗 GitHub |
|---|---|---|
| **Mariana Pizarro** | Desarrollo completo: Frontend, Backend y Base de Datos | [@MarianaPizarro14](https://github.com/MarianaPizarro14) |
| **Jahela Ariza** | Documentación y manuales del proyecto | [@jahelaariza06-ctrl](https://github.com/jahelaariza06-ctrl) |
| **Eliannis Hernández** | Pruebas finales y documentación | [@eliannishernandez09](https://github.com/eliannishernandez09) |

---

## 📄 Licencia

Proyecto académico — uso educativo 🎓🌷

<div align="center">

*Hecho con 💗 y muchas ganas de que las mascotas estén felices y sanas* 🐾

</div>