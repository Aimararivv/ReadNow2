import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import { generateToken } from '../middlewares/auth.middleware.js';

// Obtener todos los usuarios
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id_usuario, nombre, correo, role, foto_perfil, fecha_creacion FROM usuarios ORDER BY id_usuario'
    );
    res.json({
      message: 'Usuarios encontrados',
      users: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ message: 'Error obteniendo usuarios', error: error.message });
  }
};

// Eliminar cualquier usuario 
export const deleteUser = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const adminId = req.user.id_usuario;

    // Evitar que un admin se elimine a sí mismo
    if (parseInt(id_usuario) === adminId) {
      return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta de administrador' });
    }

    
    await pool.query('DELETE FROM favoritos WHERE usuarioId = $1', [id_usuario]);
    await pool.query('DELETE FROM lectura_usuario WHERE id_usuario = $1', [id_usuario]);

    // Eliminar usuario
    const result = await pool.query(
      'DELETE FROM usuarios WHERE id_usuario = $1 RETURNING id_usuario, nombre, correo',
      [id_usuario]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Usuario eliminado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ message: 'Error eliminando usuario', error: error.message });
  }
};

// Cambiar rol de cualquier usuario (solo admin)
export const updateUserRole = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { role } = req.body;

    // Validar roles permitidos
    if (!['FREE', 'PREMIUM', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Rol inválido. Roles permitidos: FREE, PREMIUM, ADMIN' });
    }

    const result = await pool.query(
      'UPDATE usuarios SET role = $1 WHERE id_usuario = $2 RETURNING id_usuario, nombre, correo, role',
      [role, id_usuario]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Rol actualizado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando rol:', error);
    res.status(500).json({ message: 'Error actualizando rol', error: error.message });
  }
};

// Obtener estadísticas de la plataforma (solo admin)
export const getStats = async (req, res) => {
  try {
    // Total de usuarios
    const usersResult = await pool.query('SELECT COUNT(*) as total FROM usuarios');
    
    // Usuarios por rol
    const rolesResult = await pool.query(
      'SELECT role, COUNT(*) as count FROM usuarios GROUP BY role'
    );
    
    // Total de libros en favoritos
    const favoritesResult = await pool.query('SELECT COUNT(*) as total FROM favoritos');
    
    // Total de lecturas
    const lecturasResult = await pool.query('SELECT COUNT(*) as total FROM lectura_usuario');

    res.json({
      message: 'Estadísticas de la plataforma',
      stats: {
        totalUsuarios: parseInt(usersResult.rows[0].total),
        usuariosPorRol: rolesResult.rows,
        totalFavoritos: parseInt(favoritesResult.rows[0].total),
        totalLecturas: parseInt(lecturasResult.rows[0].total)
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ message: 'Error obteniendo estadísticas', error: error.message });
  }
};

// Crear nuevo usuario (solo admin)
export const createUser = async (req, res) => {
  try {
    const { nombre, correo, password, role = 'FREE' } = req.body;

    if (!nombre || !correo || !password) {
      return res.status(400).json({ message: 'Faltan campos requeridos: nombre, correo, password' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      'SELECT * FROM usuarios WHERE correo = $1',
      [correo]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Validar rol
    if (!['FREE', 'PREMIUM', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    // Encriptar password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO usuarios (nombre, correo, password, role) VALUES ($1, $2, $3, $4) RETURNING id_usuario, nombre, correo, role',
      [nombre, correo, hashedPassword, role]
    );

    res.json({
      message: 'Usuario creado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ message: 'Error creando usuario', error: error.message });
  }
};

// Obtener logs del sistema (solo admin)
export const getSystemLogs = async (req, res) => {
  try {
    const { level, days, limit = 100 } = req.query;
    
    let query = `
      SELECT l.*, u.nombre as user_name 
      FROM logs l 
      LEFT JOIN usuarios u ON l.user_id = u.id_usuario 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    // Filtro por fecha solo si se especifica
    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      query += ` AND l.created_at >= $${paramIndex}`;
      params.push(startDate.toISOString());
      paramIndex++;
    }
    
    // Filtro por nivel
    if (level && level !== 'ALL') {
      query += ` AND l.level = $${paramIndex}`;
      params.push(level);
      paramIndex++;
    }
    
    query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    
    res.json({
      message: 'Logs del sistema',
      logs: result.rows,
      count: result.rows.length,
      filters: { level, days, limit }
    });
  } catch (error) {
    console.error('Error obteniendo logs:', error);
    res.status(500).json({ message: 'Error obteniendo logs', error: error.message });
  }
};

// Descargar logs como CSV (solo admin)
export const downloadLogsCSV = async (req, res) => {
  try {
    const { level, days } = req.query;
    
    let query = `
      SELECT l.created_at, l.level, l.message, l.component, u.nombre as user_name, l.data
      FROM logs l 
      LEFT JOIN usuarios u ON l.user_id = u.id_usuario 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    // Filtro por fecha solo si se especifica
    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      query += ` AND l.created_at >= $${paramIndex}`;
      params.push(startDate.toISOString());
      paramIndex++;
    }
    
    // Filtro por nivel
    if (level && level !== 'ALL') {
      query += ` AND l.level = $${paramIndex}`;
      params.push(level);
      paramIndex++;
    }
    
    query += ` ORDER BY l.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    // Generar CSV
    const headers = ['Fecha', 'Nivel', 'Mensaje', 'Componente', 'Usuario', 'Datos'];
    const rows = result.rows.map(log => [
      log.created_at,
      log.level,
      `"${(log.message || '').replace(/"/g, '""')}"`,
      log.component || 'system',
      log.user_name || 'Anónimo',
      `"${(log.data || '').replace(/"/g, '""')}"`
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="logs_readnow_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('\uFEFF' + csv); // BOM para Excel
    
  } catch (error) {
    console.error('Error generando CSV:', error);
    res.status(500).json({ message: 'Error generando CSV', error: error.message });
  }
};
