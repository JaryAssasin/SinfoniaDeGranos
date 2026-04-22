-- =====================================================
-- ESTRUCTURA DE BASE DE DATOS - SinfoniaDeGranos
-- =====================================================

-- Tabla usuarios (vinculada a auth.users de Supabase)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(100),
    correo VARCHAR(150) UNIQUE,
    rol VARCHAR(20) CHECK (rol IN ('admin', 'vendedor', 'cliente'))
);

-- Tabla producto
CREATE TABLE producto (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10,2) NOT NULL,
    stock INT NOT NULL
);

-- Tabla pedido
CREATE TABLE pedido (
    id_pedido SERIAL PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(10,2),
    estado VARCHAR(50),
    id_cliente UUID REFERENCES usuarios(id),
    id_vendedor UUID REFERENCES usuarios(id)
);

-- Tabla detalle_pedido
CREATE TABLE detalle_pedido (
    id_detalle SERIAL PRIMARY KEY,
    id_pedido INT REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    id_producto INT REFERENCES producto(id_producto),
    cantidad INT NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL
);

-- Tabla pago
CREATE TABLE pago (
    id_pago SERIAL PRIMARY KEY,
    id_pedido INT REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    metodo VARCHAR(50),
    monto NUMERIC(10,2),
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar productos iniciales
INSERT INTO producto (nombre, descripcion, precio, stock)
VALUES 
    ('Café Molido', 'Bolsa de medio kilo de café molido', 200.00, 50),
    ('Café Granulado', 'Bolsa de medio kilo de café granulado', 200.00, 50);

-- Habilitar Row Level Security
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE pago ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Políticas para usuarios
CREATE POLICY "Usuarios pueden ver su propio perfil"
    ON usuarios FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
    ON usuarios FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Solo admins pueden ver todos los usuarios"
    ON usuarios FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Solo admins pueden insertar usuarios"
    ON usuarios FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Políticas para pedidos
CREATE POLICY "Clientes pueden ver sus propios pedidos"
    ON pedido FOR SELECT
    USING (auth.uid() = id_cliente);

CREATE POLICY "Vendedores y admins pueden ver todos los pedidos"
    ON pedido FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid() AND rol IN ('admin', 'vendedor')
        )
    );

CREATE POLICY "Clientes pueden crear pedidos"
    ON pedido FOR INSERT
    WITH CHECK (auth.uid() = id_cliente);

CREATE POLICY "Admins y vendedores pueden actualizar pedidos"
    ON pedido FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid() AND rol IN ('admin', 'vendedor')
        )
    );

-- Políticas para detalle_pedido
CREATE POLICY "Ver detalles de pedidos propios o asignados"
    ON detalle_pedido FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pedido p
            WHERE p.id_pedido = detalle_pedido.id_pedido
            AND (p.id_cliente = auth.uid() OR p.id_vendedor = auth.uid())
        )
    );

CREATE POLICY "Insertar detalles para pedidos propios"
    ON detalle_pedido FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM pedido p
            WHERE p.id_pedido = detalle_pedido.id_pedido
            AND (p.id_cliente = auth.uid() OR p.id_vendedor = auth.uid())
        )
    );

-- Políticas para pagos
CREATE POLICY "Ver pagos de pedidos propios"
    ON pago FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pedido p
            WHERE p.id_pedido = pago.id_pedido
            AND (p.id_cliente = auth.uid() OR p.id_vendedor = auth.uid())
        )
    );

CREATE POLICY "Insertar pagos para pedidos accesibles"
    ON pago FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM pedido p
            WHERE p.id_pedido = pago.id_pedido
            AND (p.id_cliente = auth.uid() OR p.id_vendedor = auth.uid())
        )
    );

-- Políticas para productos (lectura pública, escritura solo admin)
CREATE POLICY "Cualquiera puede ver productos"
    ON producto FOR SELECT
    USING (true);

CREATE POLICY "Solo admins pueden insertar productos"
    ON producto FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Solo admins pueden actualizar productos"
    ON producto FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Solo admins pueden eliminar productos"
    ON producto FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );
