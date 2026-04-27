# 🌾 Sinfonía de Granos - Guía del Sistema

## Sistema de Roles

El sistema cuenta con 3 roles diferentes:

### 👑 ADMIN
- **Acceso**: Panel de Administración completo
- **Permisos**:
  - Ver todos los módulos (Inventario, Reportes, Usuarios, Pagos)
  - Crear, editar, eliminar productos
  - Cambiar roles de usuarios (Admin, Vendedor, Cliente)
  - Crear, editar, eliminar pagos
  - Ver reportes completos
  - Crear, editar, eliminar pedidos

### 🏪 VENDEDOR
- **Acceso**: Panel de Administración (sin acceso a Usuarios)
- **Permisos**:
  - Crear, editar, eliminar productos
  - Crear, editar, eliminar pagos
  - Ver y editar pedidos
  - Ver reportes (no puede crear usuarios)
  - **NO puede**: Ver tabla de usuarios, cambiar roles

### 👤 CLIENTE
- **Acceso**: Tienda online (principal.html)
- **Permisos**:
  - Ver productos
  - Crear pedidos
  - Ver sus propios pedidos
  - Ver el estado de pagos
  - **NO puede**: Acceder al panel de administración

---

## Gestión de Productos (Inventario)

### Crear Producto
1. Click en "+ Nuevo Producto" en el módulo Inventario
2. Rellenar formulario:
   - **Nombre**: Nombre del producto
   - **Stock**: Cantidad disponible
   - **Precio**: Precio unitario
   - **Descripción**: Detalles del producto
3. Click "Guardar"

### Editar Producto
1. Click en botón "✏️ Editar" en la tabla de productos
2. Modificar los datos necesarios
3. Click "Guardar"

### Eliminar Producto
1. Click en botón "🗑️ Eliminar" en la tabla de productos
2. Confirmar eliminación

### Buscar Productos
- Usar la barra de búsqueda para filtrar por nombre

---

## Gestión de Pagos

### Crear Pago
1. Click en "+ Nuevo Pago" en el módulo Pagos
2. Rellenar formulario:
   - **ID Pedido**: Número del pedido relacionado
   - **Monto**: Cantidad a pagar
   - **Método**: 
     - 🏦 Transferencia Bancaria
     - 💵 Contraentrega (Efectivo)
   - **Estado**: 
     - Pendiente (aún no se recibió el pago)
     - Completado (pago recibido)
3. Click "Guardar"

### Editar Pago
1. Click en botón "✏️ Editar" en la tabla de pagos
2. Modificar estado o método de pago
3. Click "Guardar"

### Eliminar Pago
1. Click en botón "🗑️ Eliminar" en la tabla de pagos
2. Confirmar eliminación

---

## Gestión de Pedidos

### Crear Pedido
1. Click en "+ Nuevo Pedido" en pedidos.html
2. Rellenar formulario:
   - **Fecha Pedido**: Fecha del pedido
   - **Total**: Monto total
   - **Estado**: Pendiente/Completado/Cancelado
   - **Método de Pago**: Transferencia o Contraentrega
   - **¿Pagado?**: Marcar si ya fue pagado
   - **ID Cliente**: ID del cliente que hace el pedido
3. Click "Guardar"

### Editar Pedido
1. Click en botón "✏️ Editar" en la tabla de pedidos
2. Cambiar estado del pedido, marcar como pagado, etc.
3. Click "Actualizar"

### Buscar Pedidos
- Usar barra de búsqueda para filtrar por ID, fecha o estado

---

## Gestión de Usuarios (Solo Admin)

### Ver Usuarios
- Módulo "👤 Usuarios" muestra todos los usuarios del sistema
- Cada usuario tiene un color de rol:
  - 🔴 Admin (Rojo)
  - 🟡 Vendedor (Amarillo)
  - 🟢 Cliente (Verde)

### Cambiar Rol de Usuario
1. Click en "+ Cambiar Rol de Usuario"
2. Seleccionar usuario en dropdown
3. Seleccionar nuevo rol
4. Click "Guardar"

### Eliminar Usuario
1. Click en botón "🗑️ Eliminar" (solo visible para no-admins)
2. Confirmar eliminación
3. **Nota**: No se pueden eliminar usuarios con rol Admin

---

## Reportes

El módulo de reportes muestra:
- **Total Ingresos**: Suma de todos los pagos completados
- **Por Transferencia**: Ingresos vía transferencia bancaria
- **Por Contraentrega**: Ingresos vía efectivo en contraentrega
- **Pagos Completados**: Cantidad de pagos confirmados
- **Pagos Pendientes**: Cantidad de pagos esperando
- **Total Pedidos**: Cantidad de pedidos en el sistema

---

## Métodos de Pago

### 🏦 Transferencia Bancaria
- Pago realizado antes de la entrega
- Se marca como "Completado" cuando se recibe la transferencia
- Ideal para clientes que confían o tienen cuenta de banco

### 💵 Contraentrega (Efectivo)
- Pago realizado al momento de la entrega
- Se marca como "Pendiente" hasta que se entrega y cobra
- Se marca como "Completado" cuando el vendedor confirma la entrega y cobro

---

## Funcionalidades de Búsqueda

Todos los módulos tienen barras de búsqueda con emoji 🔍:

- **Inventario**: Busca por nombre de producto
- **Usuarios**: Busca por email o nombre
- **Pagos**: Busca por ID de pago, ID de pedido, monto, etc.
- **Pedidos**: Busca por ID, fecha, estado, cliente

---

## Estadísticas

### En Inventario
- **Total Productos**: Cantidad de productos disponibles
- **Stock Total**: Sumatoria de todo el stock
- **Productos Bajos**: Productos con stock menor a 5 unidades ⚠️

### En Reportes
- Se actualiza automáticamente según los pagos registrados
- Útil para análisis de ingresos

---

## Acciones Rápidas

| Acción | Admin | Vendedor | Cliente |
|--------|-------|----------|---------|
| Ver Inventario | ✅ | ✅ | ✅ (Tienda) |
| Editar Productos | ✅ | ✅ | ❌ |
| Crear Pagos | ✅ | ✅ | ❌ |
| Ver Usuarios | ✅ | ❌ | ❌ |
| Cambiar Roles | ✅ | ❌ | ❌ |
| Ver Reportes | ✅ | ✅ | ❌ |
| Crear Pedidos | ✅ | ✅ | ✅ |
| Editar Pedidos | ✅ | ✅ | ❌ |

---

## Consejos y Mejores Prácticas

1. **Mantener Stock Actualizado**: Revisa regularmente los productos con stock bajo
2. **Confirmar Pagos**: Marca los pagos como completados solo cuando hayas recibido el dinero
3. **Documentar Métodos de Pago**: Asegúrate de registrar correctamente si fue transferencia o contraentrega
4. **Revisar Reportes**: Usa los reportes para entender tus ingresos y tendencias
5. **Gestionar Accesos**: Cambia roles según necesites (no des acceso Admin innecesariamente)

---

## Soporte y Errores

Si encuentras algún error:
1. Verifica tu conexión a internet
2. Recarga la página (F5)
3. Asegúrate de tener los permisos correctos para la acción
4. Prueba en otro navegador si el problema persiste

---

**Versión**: 1.0  
**Última actualización**: 2026-04-27  
**Sistema**: Sinfonía de Granos
