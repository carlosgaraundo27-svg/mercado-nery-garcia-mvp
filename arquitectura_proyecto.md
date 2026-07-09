# ESPECIFICACIÓN DE ARQUITECTURA DE SOFTWARE
## Proyecto: Aplicación Web Transaccional "Mercado Nery García Zárate" (2026)

Este documento sirve como directriz técnica e input de contexto para el asistente de código (AI Code Assistant) para implementar el sistema bajo el enfoque **Spec-Driven Development (SDD)** y prácticas de **Extreme Programming (XP)**.

---

## 1. Patrón Arquitectónico General
El sistema adopta una arquitectura desacoplada basada en una **API REST (Backend)** y una **Aplicación Web Single Page (Frontend)** optimizada bajo la filosofía **Mobile First**.

```
[Cliente Mobile (React.js)] <--- HTTPS (JSON) ---> [Servidor API (Node.js/Express)] <---> [Base de Datos (MySQL)]
```

### 1.1. Filosofía de Diseño: Mobile First
La interfaz está diseñada específicamente para pantallas de smartphones de 360px a 480px de ancho, considerando que tanto los comerciantes en sus puestos de venta como los compradores locales utilizarán principalmente sus dispositivos móviles en el Mercado Nery García Zárate de Ayacucho. El diseño de escritorio es una adaptación responsiva del layout móvil.

### 1.2. Flujo de Desarrollo Guiado por Especificaciones (Spec-Driven Development - SDD)
Todo desarrollo de software debe seguir estrictamente las fases descritas en el flujo operativo del proyecto:
1. **Fase A (Análisis):** Definición detallada de requisitos y reglas de negocio del Mercado (ej., tipos de productos perecederos, control de stock mínimo).
2. **Fase D (Diseño de Contratos):** Redacción previa de la especificación técnica (esquemas SQL y contratos de endpoints JSON) antes de codificar.
3. **Fase I (Implementación):** Escritura de código limpio y modular en el IDE basado exclusivamente en las especificaciones acordadas.
4. **Fase P (Pruebas de Calidad):** Creación inmediata de pruebas unitarias/integración para garantizar una cobertura mínima del **90%** en la suite de pruebas. No se considera terminada una característica si no pasa este umbral.

---

## 2. Pila Tecnológica (Tech Stack)

### 2.1. Backend (Capa de Servidor y Lógica de Negocio)
* **Entorno de Ejecución:** Node.js v18+.
* **Framework Web:** Express.js.
* **Patrón de Diseño Interno:** Arquitectura en Capas (Rutas, Controladores, Modelos/Servicios), manteniendo un bajo acoplamiento y alta cohesión.
* **Seguridad y Autenticación:** * `jsonwebtoken` (JWT) para gestión de sesiones apátridas (stateless).
    * `bcrypt` para hashing asimétrico de contraseñas de comerciantes.
    * `helmet` y `cors` para la protección de cabeceras HTTP y políticas de origen cruzado.

### 2.2. Base de Datos (Capa de Persistencia)
* **Motor:** MySQL v8.0+ utilizando el motor transaccional **InnoDB** para soportar transacciones ACID (Atomicidad, Consistencia, Aislamiento, Durabilidad).
* **Controlador de Conexión:** `mysql2/promise` para soporte nativo de promesas, Async/Await y Pools de conexión eficientes (evitando cuellos de botella en hardware Core i5 con 16GB de RAM).
* **Estrategia de Concurrencia:** Control estricto de bloqueos (Locks) en el inventario para evitar colisiones cuando varios usuarios compran simultáneamente el mismo corte de carne (ej. "lomo fino").

### 2.3. Frontend (Capa de Interfaz de Usuario)
* **Librería Principal:** React.js (Vite como bundler por su velocidad y ligereza).
* **Estilos:** Tailwind CSS (diseño Mobile First rápido mediante clases utilitarias fluidas).
* **Gestión de Estado:** Context API de React para el manejo global del estado de autenticación y carrito de compras.
* **Consumo de API:** `axios` con interceptores configurados para adjuntar automáticamente el token JWT en las cabeceras de peticiones protegidas.

### 2.4. Suite de Calidad y Pruebas (QA)
* **Framework de Pruebas:** Jest.
* **Simulación de Peticiones HTTP:** Supertest (para testing de endpoints sin levantar el servidor físico).
* **Métricas de Cobertura:** Cobertura de líneas, funciones y ramas de control configurada rígidamente en `jest.config.js` al **90%**.

---

## 3. Estándares de Seguridad de la Arquitectura
1. **Validación de Entradas:** Todas las solicitudes entrantes al Backend deben validarse a nivel de esquema (usando middlewares personalizados) para evitar inyecciones SQL y Cross-Site Scripting (XSS).
2. **Principio de Menor Privilegio:** Los endpoints que modifican el inventario o muestran métricas de ganancias requieren obligatoriamente un token JWT válido con rol de `Vendedor`.
3. **Manejo de Errores Centralizado:** Ningún controlador debe exponer Stack Traces de la base de datos o del sistema operativo al cliente final. Se utiliza un middleware global de captura de errores para retornar respuestas JSON estandarizadas (`{ error: "Mensaje legible" }`).
