-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'FREE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar usuarios de prueba
INSERT INTO usuarios (nombre, correo, password, role) VALUES 
('Usuario Test', 'test@test.com', 'password123', 'FREE'),
('Usuario Premium', 'premium@test.com', 'password123', 'PREMIUM')
ON CONFLICT (correo) DO NOTHING;
