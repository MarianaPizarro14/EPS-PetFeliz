-- ========================================================
-- EPS PETFELIZ - ESQUEMA ESTRUCTURAL DE BASE DE DATOS
-- Generado para reconstrucción / migración de estructura limpia
-- Compatible con MySQL Workbench y Railway MySQL 8.x
-- ========================================================

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `cache`;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cache_locks`;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cita`;
CREATE TABLE `cita` (
  `id_cita` bigint unsigned NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `motivo` text COLLATE utf8mb4_unicode_ci,
  `id_servicio` int DEFAULT NULL,
  `id_estado` bigint unsigned NOT NULL,
  `observacion` text COLLATE utf8mb4_unicode_ci,
  `medicamentos` json DEFAULT NULL,
  `metodo_pago` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Pago en línea',
  `estado_pago` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `monto_pago` decimal(10,2) DEFAULT NULL,
  `id_cliente` bigint unsigned NOT NULL,
  `id_mascota` bigint unsigned NOT NULL,
  `id_veterinario` bigint unsigned NOT NULL,
  `id_sede` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `slot_activo` varchar(150) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (if((`id_estado` <> 3),concat(`id_veterinario`,_utf8mb4'_',`fecha`,_utf8mb4'_',`hora`),NULL)) STORED,
  PRIMARY KEY (`id_cita`),
  UNIQUE KEY `cita_slot_activo_unique` (`slot_activo`),
  KEY `cita_id_estado_foreign` (`id_estado`),
  KEY `cita_id_cliente_foreign` (`id_cliente`),
  KEY `cita_id_mascota_foreign` (`id_mascota`),
  KEY `cita_id_veterinario_foreign` (`id_veterinario`),
  KEY `cita_id_sede_foreign` (`id_sede`),
  CONSTRAINT `cita_id_cliente_foreign` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`) ON DELETE CASCADE,
  CONSTRAINT `cita_id_estado_foreign` FOREIGN KEY (`id_estado`) REFERENCES `estado_cita` (`id_estado`),
  CONSTRAINT `cita_id_mascota_foreign` FOREIGN KEY (`id_mascota`) REFERENCES `mascota` (`id_mascota`) ON DELETE CASCADE,
  CONSTRAINT `cita_id_sede_foreign` FOREIGN KEY (`id_sede`) REFERENCES `sede` (`id_sede`) ON DELETE SET NULL,
  CONSTRAINT `cita_id_veterinario_foreign` FOREIGN KEY (`id_veterinario`) REFERENCES `veterinario` (`id_veterinario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cliente`;
CREATE TABLE `cliente` (
  `id_cliente` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` bigint unsigned NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cedula` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `departamento` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ciudad` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contacto_emergencia_nombre` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contacto_emergencia_telefono` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notificaciones_email` tinyint(1) NOT NULL DEFAULT '1',
  `recordatorios_citas` tinyint(1) NOT NULL DEFAULT '1',
  `es_afiliado` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_afiliacion` date DEFAULT NULL,
  `foto_perfil` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `cliente_id_usuario_unique` (`id_usuario`),
  CONSTRAINT `cliente_id_usuario_foreign` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `estado_cita`;
CREATE TABLE `estado_cita` (
  `id_estado` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_estado`),
  UNIQUE KEY `estado_cita_nombre_unique` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `failed_jobs`;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `historias_cuidadores`;
CREATE TABLE `historias_cuidadores` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nombre_cuidador` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_mascota` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `historia` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('pendiente','aprobado','rechazado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `job_batches`;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mascota`;
CREATE TABLE `mascota` (
  `id_mascota` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `especie` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `raza` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sexo` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `peso` decimal(5,2) DEFAULT NULL,
  `alergias` text COLLATE utf8mb4_unicode_ci,
  `vacunas` text COLLATE utf8mb4_unicode_ci,
  `foto_mascota` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_cliente` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_mascota`),
  KEY `mascota_id_cliente_foreign` (`id_cliente`),
  CONSTRAINT `mascota_id_cliente_foreign` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `notificacion`;
CREATE TABLE `notificacion` (
  `id_notificacion` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_cliente` int DEFAULT NULL,
  `id_usuario` bigint unsigned DEFAULT NULL,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `leida` tinyint(1) NOT NULL DEFAULT '0',
  `icono` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'fa-regular fa-bell',
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_notificacion`),
  KEY `notificacion_id_usuario_index` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `pagos`;
CREATE TABLE `pagos` (
  `id_pago` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_cita` int DEFAULT NULL,
  `id_cliente` int NOT NULL,
  `monto` decimal(10,2) NOT NULL DEFAULT '0.00',
  `monto_recibido` decimal(10,2) DEFAULT NULL,
  `cambio_devuelto` decimal(10,2) DEFAULT NULL,
  `recibido_por` bigint unsigned DEFAULT NULL,
  `fecha_recepcion_pago` timestamp NULL DEFAULT NULL,
  `observacion_pago` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_cobertura` enum('eps','particular','copago') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'eps',
  `metodo_pago` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tarjeta',
  `estado` enum('confirmado','fallido','reembolsado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'confirmado',
  `referencia_transaccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wompi_transaction_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_pago`),
  UNIQUE KEY `pagos_wompi_transaction_id_unique` (`wompi_transaction_id`),
  KEY `pagos_recibido_por_foreign` (`recibido_por`),
  CONSTRAINT `pagos_recibido_por_foreign` FOREIGN KEY (`recibido_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `personal_access_tokens`;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `recepcionista`;
CREATE TABLE `recepcionista` (
  `id_recepcionista` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` bigint unsigned DEFAULT NULL,
  `id_sede` bigint unsigned DEFAULT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_perfil` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_recepcionista`),
  KEY `recepcionista_id_usuario_foreign` (`id_usuario`),
  KEY `recepcionista_id_sede_foreign` (`id_sede`),
  CONSTRAINT `recepcionista_id_sede_foreign` FOREIGN KEY (`id_sede`) REFERENCES `sede` (`id_sede`) ON DELETE SET NULL,
  CONSTRAINT `recepcionista_id_usuario_foreign` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `reserva_temporal`;
CREATE TABLE `reserva_temporal` (
  `id_reserva` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_veterinario` int NOT NULL,
  `fecha` date NOT NULL,
  `hora` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_usuario` bigint unsigned NOT NULL,
  `id_servicio` bigint unsigned DEFAULT NULL,
  `id_mascota` bigint unsigned DEFAULT NULL,
  `id_cliente` bigint unsigned DEFAULT NULL,
  `id_sede` bigint unsigned DEFAULT NULL,
  `motivo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referencia_pago` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `es_usada` tinyint(1) NOT NULL DEFAULT '0',
  `token_reserva` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_reserva`),
  UNIQUE KEY `reserva_temporal_token_reserva_unique` (`token_reserva`),
  KEY `reserva_temporal_id_veterinario_fecha_hora_index` (`id_veterinario`,`fecha`,`hora`),
  KEY `reserva_temporal_referencia_pago_index` (`referencia_pago`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sede`;
CREATE TABLE `sede` (
  `id_sede` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `es_principal` tinyint(1) NOT NULL DEFAULT '0',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_sede`),
  UNIQUE KEY `sede_nombre_unique` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `servicio`;
CREATE TABLE `servicio` (
  `id_servicio` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `precio_base` decimal(10,2) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `precio_afiliado` decimal(10,2) DEFAULT NULL,
  `incluido_en_plan` tinyint(1) NOT NULL DEFAULT '0',
  `limite_mensual_incluido` int DEFAULT NULL,
  PRIMARY KEY (`id_servicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `usuario`;
CREATE TABLE `usuario` (
  `id_usuario` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cliente',
  `contrasena_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_temporal` tinyint(1) NOT NULL DEFAULT '0',
  `activo` tinyint(1) DEFAULT '1',
  `token_reset` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_reset_expira` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `usuario_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `veterinario`;
CREATE TABLE `veterinario` (
  `id_veterinario` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` bigint unsigned NOT NULL,
  `id_sede` bigint unsigned DEFAULT NULL,
  `id_sucursal` int NOT NULL DEFAULT '1',
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `especialidad` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_tarjeta` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_perfil` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_veterinario`),
  UNIQUE KEY `veterinario_id_usuario_unique` (`id_usuario`),
  KEY `veterinario_id_sede_foreign` (`id_sede`),
  CONSTRAINT `veterinario_id_sede_foreign` FOREIGN KEY (`id_sede`) REFERENCES `sede` (`id_sede`) ON DELETE SET NULL,
  CONSTRAINT `veterinario_id_usuario_foreign` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
