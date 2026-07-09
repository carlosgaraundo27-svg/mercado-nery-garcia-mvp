-- Creación de la Base de Datos para "Mercado Nery García Zárate"
CREATE DATABASE IF NOT EXISTS `mercado_nery_garcia` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `mercado_nery_garcia`;

-- 1. TABLA: usuarios (Comerciantes, Vendedores y Administradores)
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `puesto` VARCHAR(50) NULL,
  `rubro` VARCHAR(100) NULL,
  `rol` ENUM('Vendedor', 'Admin') NOT NULL DEFAULT 'Vendedor',
  `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABLA: categorias (Categorías de productos del mercado)
CREATE TABLE IF NOT EXISTS `categorias` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL UNIQUE,
  `descripcion` TEXT NULL,
  `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABLA: productos (Inventario y stock de cada vendedor)
CREATE TABLE IF NOT EXISTS `productos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL,
  `categoria_id` INT NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` TEXT NULL,
  `precio` DECIMAL(10,2) NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `stock_minimo` INT NOT NULL DEFAULT 5,
  `imagen_url` VARCHAR(255) NULL,
  `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_productos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_productos_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABLA: ventas (Transacciones/Órdenes)
CREATE TABLE IF NOT EXISTS `ventas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vendedor_id` INT NOT NULL,
  `cliente_nombre` VARCHAR(100) NULL,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `metodo_pago` ENUM('Yape', 'Tarjeta', 'Efectivo') NOT NULL DEFAULT 'Efectivo',
  `comprobante_url` VARCHAR(255) NULL,
  `estado` ENUM('completado', 'pendiente', 'cancelado') NOT NULL DEFAULT 'pendiente',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ventas_vendedor` FOREIGN KEY (`vendedor_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABLA: detalle_ventas (Líneas de transacción de cada venta)
CREATE TABLE IF NOT EXISTS `detalle_ventas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `venta_id` INT NOT NULL,
  `producto_id` INT NOT NULL,
  `cantidad` INT NOT NULL,
  `precio_unitario` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  CONSTRAINT `fk_detalle_venta` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_detalle_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INDEXADO ADICIONAL PARA OPTIMIZACIÓN DE BÚSQUEDAS
CREATE INDEX `idx_productos_nombre` ON `productos` (`nombre`);
CREATE INDEX `idx_productos_estado` ON `productos` (`estado`);
CREATE INDEX `idx_usuarios_email` ON `usuarios` (`email`);

-- DATOS DE SEMILLA (SEED DATA)
-- Categorías básicas del mercado
INSERT INTO `categorias` (`nombre`, `descripcion`) VALUES 
('Carnes y Aves', 'Cortes de carne de res, cerdo, pollo, alitas y menudencias frescas.'),
('Pescados y Mariscos', 'Pescados frescos de mar y de río, trucha, jurel y mariscos variados.'),
('Frutas y Verduras', 'Verduras frescas de la región y frutas de temporada.'),
('Abarrotes', 'Arroz, azúcar, fideos, aceites y productos no perecederos de primera necesidad.'),
('Lácteos y Embutidos', 'Quesos de la región, leche, mantequilla y embutidos variados.');
