# ESTRUCTURA DEL PROYECTO Y HOJA DE RUTA (ROADMAP)
## Proyecto: Aplicación Web Transaccional "Mercado Nery García Zárate" (2026)

Este documento detalla la distribución de archivos en el espacio de trabajo y define la planificación por Sprints basándose en el enfoque Scrum y las directrices de calidad del proyecto. Use esta estructura para organizar las carpetas y guiar la generación incremental de código.

---

## 1. Árbol de Directorios Estructurado

El proyecto se organiza de forma clara separando el Backend (API) y el Frontend (UI Mobile First). Esto permite un desarrollo paralelo ordenado.

```
mercado-nery-garcia/
├── backend/
│   ├── config/
│   │   └── db.js                 # Pool de conexiones a MySQL (mysql2/promise)
│   ├── controllers/
│   │   ├── authController.js     # Lógica de registro y login de comerciantes
│   │   ├── inventoryController.js# CRUD de stock, alertas y ganancias
│   │   └── orderController.js    # Transacciones, cobros y lógica de recibos
│   ├── middleware/
│   │   ├── authMiddleware.js     # Validación de JWT y control de roles
│   │   └── errorMiddleware.js    # Manejador global de errores de la API
│   ├── models/
│   │   └── (Consulta SQL parametrizadas directas en controladores)
│   ├── routes/
│   │   ├── authRoutes.js         # Rutas de /api/auth
│   │   ├── inventoryRoutes.js    # Rutas de /api/inventory
│   │   └── orderRoutes.js        # Rutas de /api/orders
│   ├── tests/
│   │   ├── auth.test.js          # Pruebas unitarias de autenticación
│   │   ├── inventory.test.js     # Pruebas de lógica de stock
│   │   └── order.test.js         # Pruebas de transacciones de pago y PDF
│   ├── database/
│   │   └── schema.sql            # Script DDL de creación de la base de datos
│   ├── .env                      # Variables de entorno (DB_HOST, JWT_SECRET, PORT)
│   ├── app.js                    # Configuración de Express
│   ├── server.js                 # Punto de entrada de la aplicación backend
│   └── package.json
└── frontend/
    ├── public/
    ├── src/
    │   ├── assets/               # Logotipos e iconos de rubros del mercado
    │   ├── components/           # Componentes atómicos (Botones, Tarjetas, Navbar Móvil)
    │   ├── context/
    │   │   └── AuthContext.jsx   # Proveedor de estado de autenticación global
    │   ├── hooks/
    │   │   └── useFetch.js       # Hook personalizado para peticiones HTTP
    │   ├── pages/
    │   │   ├── Login.jsx         # Pantalla Mobile First de inicio de sesión
    │   │   ├── Register.jsx      # Pantalla de registro de puesto del mercado
    │   │   ├── Dashboard.jsx     # Panel del vendedor (Stock, Ganancias)
    │   │   ├── Catálogo.jsx      # Vista del cliente (Filtros por áreas)
    │   │   └── Checkout.jsx      # Formulario de pago simulado (Yape/Tarjeta)
    │   ├── styles/
    │   │   └── index.css         # Configuración de Tailwind CSS
    │   ├── App.jsx               # Enrutador del frontend (react-router-dom)
    │   └── main.jsx              # Punto de entrada de React
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## 2. Planificación Detallada por Sprints (Roadmap de Implementación)

### Sprint 1: Base de Datos y Autenticación (Fundamentos y Seguridad)
* **Objetivo de Negocio:** Permitir que los comerciantes del Mercado Nery García Zárate creen una cuenta digital segura vinculada a su número de puesto físico y rubro comercial.
* **Entregables Técnicos:**
    * Base de datos relacional inicial configurada en MySQL.
    * Endpoints robustos para `/api/auth/register` y `/api/auth/login`.
    * Pantallas responsivas (Mobile First) de Login y Registro en el Frontend.
* **Métricas QA:** Suite de pruebas funcionales en Jest/Supertest con **90% de cobertura** sobre los controladores de autenticación.

### Sprint 2: Motor de Inventario (El Núcleo del Comerciante)
* **Objetivo de Negocio:** Proporcionar al vendedor el control total de sus productos perecederos (Carnes, Aves, Pescados, Abarrotes) para evitar desorganización y quiebres de stock.
* **Entregables Técnicos:**
    * Tabla `Productos` con relaciones de clave foránea hacia `Vendedores`.
    * Panel de control (Dashboard) en React para agregar, editar stock (ej. si se acaban las "alitas de pollo") y ver gráficas simples de ventas diarias/semanales.
    * Lógica en backend para enviar alertas visuales de "Stock Crítico" cuando un producto baje de 5 unidades.
* **Métricas QA:** Cobertura del 90% verificando que las modificaciones de inventario actualicen la persistencia correctamente y manejen errores lógicos.

### Sprint 3: Experiencia del Cliente (Catálogo en Tiempo Real)
* **Objetivo de Negocio:** Permitir que el comprador de Ayacucho explore los productos disponibles en los pabellones del mercado desde su celular antes o durante su visita.
* **Entregables Técnicos:**
    * Interfaz pública y abierta (sin necesidad de login para el cliente) optimizada para navegación táctil fluida.
    * Filtros dinámicos rápidos por categorías/rubros (ej., hacer clic en "Pescados" y listar los puestos activos con trucha o jurel fresco).
    * Sincronización en tiempo real del stock disponible para evitar que el cliente ordene productos ya agotados.

### Sprint 4: Transacciones y Calidad (Pasarela y Certificación QA)
* **Objetivo de Negocio:** Cerrar el ciclo comercial mediante el pago digitalizado y la emisión instantánea del comprobante de compra, garantizando la total estabilidad del software.
* **Entregables Técnicos:**
    * Integración de un flujo de pago interactivo que simule la transacción por código QR de Yape o pasarela de tarjetas de crédito.
    * Generación automática en el Backend de un recibo en formato PDF descargable para el cliente y archivado para el vendedor.
    * **Consolidación de Calidad:** Refactorización final y expansión de pruebas unitarias/integración de punta a punta hasta certificar que todo el código del repositorio cumple con la cobertura del 90% exigida por el marco de calidad.
