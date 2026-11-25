const db = require("../config/db");

// Listar todas las competencias
const obtenerCompetencias = async (req, res) => {
  try {
    const [filas] = await db.execute(
      `SELECT id_competencia, nombre, tipo_skill
       FROM competencias
       ORDER BY tipo_skill ASC, id_competencia ASC`,
    );

    return res.status(200).json(filas);
  } catch (error) {
    console.error("Error al obtener competencias:", error);
    return res
      .status(500)
      .json({ mensaje: "Error al obtener las competencias." });
  }
};

// Crear una nueva competencia
const crearCompetencia = async (req, res) => {
  const nombre = String(req.body?.nombre || "").trim();
  const tipoSkill = String(req.body?.tipo_skill || "").trim();

  if (!nombre || !tipoSkill) {
    return res.status(400).json({
      mensaje: "El nombre y el tipo de habilidad (tipo_skill) son obligatorios.",
    });
  }

  try {
    const [resultado] = await db.execute(
      `INSERT INTO competencias (nombre, tipo_skill)
       VALUES (?, ?)`,
      [nombre, tipoSkill],
    );

    return res.status(201).json({
      mensaje: "Competencia registrada correctamente.",
      id_competencia: resultado.insertId,
      competencia: {
        id_competencia: resultado.insertId,
        nombre,
        tipo_skill: tipoSkill,
      },
    });
  } catch (error) {
    console.error("Error al crear competencia:", error);
    return res
      .status(500)
      .json({ mensaje: "Error al registrar la competencia." });
  }
};

// Actualizar una competencia existente
const actualizarCompetencia = async (req, res) => {
  const { id } = req.params;
  const nombre = String(req.body?.nombre || "").trim();
  const tipoSkill = String(req.body?.tipo_skill || "").trim();

  if (!nombre || !tipoSkill) {
    return res.status(400).json({
      mensaje: "El nombre y el tipo de habilidad (tipo_skill) son obligatorios.",
    });
  }

  try {
    const [resultado] = await db.execute(
      `UPDATE competencias
       SET nombre = ?, tipo_skill = ?
       WHERE id_competencia = ?`,
      [nombre, tipoSkill, id],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Competencia no encontrada." });
    }

    return res.status(200).json({
      mensaje: "Competencia actualizada correctamente.",
    });
  } catch (error) {
    console.error("Error al actualizar competencia:", error);
    return res
      .status(500)
      .json({ mensaje: "Error al actualizar la competencia." });
  }
};

// Eliminar una competencia (si está referenciada en detalle_eval, MySQL rechazará por FK RESTRICT)
const eliminarCompetencia = async (req, res) => {
  const { id } = req.params;

  try {
    const [resultado] = await db.execute(
      `DELETE FROM competencias WHERE id_competencia = ?`,
      [id],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Competencia no encontrada." });
    }

    return res.status(200).json({
      mensaje: "Competencia eliminada correctamente.",
    });
  } catch (error) {
    if (error?.errno === 1451 || error?.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        mensaje:
          "No se puede eliminar la competencia porque ya tiene evaluaciones asociadas.",
      });
    }

    console.error("Error al eliminar competencia:", error);
    return res
      .status(500)
      .json({ mensaje: "Error al eliminar la competencia." });
  }
};

module.exports = {
  obtenerCompetencias,
  crearCompetencia,
  actualizarCompetencia,
  eliminarCompetencia,
};