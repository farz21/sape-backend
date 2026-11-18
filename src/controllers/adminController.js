const db = require("../config/db");

// ==========================================
// OBTENER ESTADÍSTICAS DEL DASHBOARD ADMIN
// ==========================================
const obtenerEstadisticas = async (req, res) => {
  try {
    // 1. Total de empleados (solo con rol 'empleado')
    const [empleadosRes] = await db.execute(
      "SELECT COUNT(*) AS total FROM usuarios u INNER JOIN empleados e ON u.id = e.id_usuario WHERE u.rol = 'empleado'"
    );
    const totalEmpleados = empleadosRes[0].total; // Extraemos solo el número

    // 2. Distribución de resultados (Semáforos)
    const [distribucionSemaforo] = await db.execute(`
      SELECT semaforo as name, COUNT(*) as value 
      FROM evaluaciones 
      GROUP BY semaforo
    `);

    // 3. Promedio de puntajes
    const [promedioRes] = await db.execute(
      "SELECT AVG(puntaje_final) as promedio FROM evaluaciones"
    );

    const promedioPuntaje = promedioRes[0].promedio
      ? parseFloat(promedioRes[0].promedio).toFixed(2)
      : "0.00";

    // 📊 4. Rendimiento promedio por período (Para el nuevo gráfico de barras)
    const [rendimientoPorPeriodo] = await db.execute(`
      SELECT periodo, ROUND(AVG(puntaje_final), 2) AS promedio 
      FROM evaluaciones 
      GROUP BY periodo 
      ORDER BY MIN(fecha) ASC
    `);

    // Enviamos el objeto completo y limpio al frontend
    res.status(200).json({
      totalEmpleados,
      distribucionSemaforo,
      promedioPuntaje,
      rendimientoPorPeriodo // 👈 Nuevo campo agregado para Recharts
    });

  } catch (error) {
    console.error("Error al cargar estadísticas:", error);
    res.status(500).json({
      mensaje: "Error al obtener estadísticas del dashboard."
    });
  }
};
module.exports = {obtenerEstadisticas};