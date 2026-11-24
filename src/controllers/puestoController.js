const db = require("../config/db");

const normalizarTexto = (texto) =>
  String(texto || "")
    .trim()
    .replace(/\s+/g, " ");

// ==========================================
// DEPARTAMENTOS (CRUD COMPLETO)
// ==========================================
const obtenerDepartamentos = async (req, res) => {
  try {
    const [departamentos] = await db.execute(
      `SELECT id_departamento, nombre, presupuesto
       FROM departamentos
       ORDER BY nombre ASC`,
    );
    return res.status(200).json(departamentos);
  } catch (error) {
    console.error("Error al obtener departamentos:", error);
    return res.status(500).json({ mensaje: "Error al obtener departamentos." });
  }
};

const crearDepartamento = async (req, res) => {
  const nombreLimpio = normalizarTexto(req.body.nombre);
  const { presupuesto } = req.body;

  if (!nombreLimpio) {
    return res.status(400).json({
      mensaje: "El nombre del departamento es obligatorio.",
    });
  }

  const presupuestoValor =
    presupuesto === "" || presupuesto === null || presupuesto === undefined
      ? null
      : Number(presupuesto);

  if (
    presupuestoValor !== null &&
    (Number.isNaN(presupuestoValor) || presupuestoValor < 0)
  ) {
    return res.status(400).json({
      mensaje: "El presupuesto debe ser un número válido mayor o igual a 0.",
    });
  }

  try {
    const [duplicado] = await db.execute(
      "SELECT id_departamento FROM departamentos WHERE LOWER(TRIM(nombre)) = LOWER(?) LIMIT 1",
      [nombreLimpio],
    );

    if (duplicado.length > 0) {
      return res.status(409).json({
        mensaje: `Ya existe un departamento llamado "${nombreLimpio}".`,
      });
    }

    const [resultado] = await db.execute(
      `INSERT INTO departamentos (nombre, presupuesto)
       VALUES (?, ?)`,
      [nombreLimpio, presupuestoValor],
    );

    return res.status(201).json({
      mensaje: "Departamento creado correctamente.",
      id_departamento: resultado.insertId,
    });
  } catch (error) {
    console.error("Error al crear departamento:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        mensaje: `Ya existe un departamento llamado "${nombreLimpio}".`,
      });
    }
    return res.status(500).json({
      mensaje: "Error interno al crear el departamento.",
    });
  }
};

const actualizarDepartamento = async (req, res) => {
  const { id } = req.params;
  const nombreLimpio = normalizarTexto(req.body.nombre);
  const { presupuesto } = req.body;

  if (!nombreLimpio) {
    return res.status(400).json({
      mensaje: "El nombre del departamento es obligatorio.",
    });
  }

  const presupuestoValor =
    presupuesto === "" || presupuesto === null || presupuesto === undefined
      ? null
      : Number(presupuesto);

  if (
    presupuestoValor !== null &&
    (Number.isNaN(presupuestoValor) || presupuestoValor < 0)
  ) {
    return res.status(400).json({
      mensaje: "El presupuesto debe ser un número válido mayor o igual a 0.",
    });
  }

  try {
    const [existe] = await db.execute(
      "SELECT id_departamento FROM departamentos WHERE id_departamento = ? LIMIT 1",
      [id],
    );

    if (existe.length === 0) {
      return res.status(404).json({ mensaje: "Departamento no encontrado." });
    }

    const [duplicado] = await db.execute(
      "SELECT id_departamento FROM departamentos WHERE LOWER(TRIM(nombre)) = LOWER(?) AND id_departamento != ? LIMIT 1",
      [nombreLimpio, id],
    );

    if (duplicado.length > 0) {
      return res.status(409).json({
        mensaje: `Ya existe otro departamento llamado "${nombreLimpio}".`,
      });
    }

    await db.execute(
      `UPDATE departamentos
       SET nombre = ?, presupuesto = ?
       WHERE id_departamento = ?`,
      [nombreLimpio, presupuestoValor, id],
    );

    return res.status(200).json({
      mensaje: "Departamento actualizado correctamente.",
    });
  } catch (error) {
    console.error("Error al actualizar departamento:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        mensaje: `Ya existe otro departamento llamado "${nombreLimpio}".`,
      });
    }
    return res.status(500).json({
      mensaje: "Error interno al actualizar el departamento.",
    });
  }
};

const eliminarDepartamento = async (req, res) => {
  const { id } = req.params;

  try {
    const [resultado] = await db.execute(
      "DELETE FROM departamentos WHERE id_departamento = ?",
      [id],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Departamento no encontrado." });
    }

    return res.status(200).json({
      mensaje: "Departamento eliminado correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar departamento:", error);
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        mensaje:
          "No se puede eliminar el departamento porque tiene puestos asociados.",
      });
    }
    return res.status(500).json({
      mensaje: "Error interno al eliminar el departamento.",
    });
  }
};

// ==========================================
// PUESTOS (CRUD COMPLETO)
// ==========================================
const obtenerPuestos = async (req, res) => {
  try {
    const [puestos] = await db.execute(
      `SELECT
        p.id_puesto,
        p.id_departamento,
        d.nombre AS nombre_departamento,
        p.nombre,
        p.seniority
       FROM puestos p
       INNER JOIN departamentos d ON p.id_departamento = d.id_departamento
       ORDER BY d.nombre ASC, p.id_puesto ASC`,
    );
    return res.status(200).json(puestos);
  } catch (error) {
    console.error("Error al obtener puestos:", error);
    return res.status(500).json({ mensaje: "Error al obtener puestos." });
  }
};

const crearPuesto = async (req, res) => {
  const { id_departamento } = req.body;
  const nombreLimpio = normalizarTexto(req.body.nombre);
  const seniorityLimpio = normalizarTexto(req.body.seniority) || "Junior";

  if (!id_departamento || !nombreLimpio) {
    return res.status(400).json({
      mensaje: "El departamento y el nombre del puesto son obligatorios.",
    });
  }

  try {
    const [deptoExiste] = await db.execute(
      "SELECT id_departamento FROM departamentos WHERE id_departamento = ? LIMIT 1",
      [Number(id_departamento)],
    );

    if (deptoExiste.length === 0) {
      return res.status(400).json({
        mensaje: "El departamento seleccionado no existe.",
      });
    }

    const [duplicado] = await db.execute(
      `SELECT id_puesto FROM puestos
       WHERE id_departamento = ?
         AND LOWER(TRIM(nombre)) = LOWER(?)
         AND LOWER(TRIM(COALESCE(seniority, 'Junior'))) = LOWER(?)
       LIMIT 1`,
      [Number(id_departamento), nombreLimpio, seniorityLimpio],
    );

    if (duplicado.length > 0) {
      return res.status(409).json({
        mensaje: `Ya existe el puesto "${nombreLimpio}" (${seniorityLimpio}) en ese departamento.`,
      });
    }

    const [resultado] = await db.execute(
      `INSERT INTO puestos (id_departamento, nombre, seniority)
       VALUES (?, ?, ?)`,
      [Number(id_departamento), nombreLimpio, seniorityLimpio],
    );

    return res.status(201).json({
      mensaje: "Puesto creado correctamente.",
      id_puesto: resultado.insertId,
    });
  } catch (error) {
    console.error("Error al crear puesto:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        mensaje: `Ya existe el puesto "${nombreLimpio}" (${seniorityLimpio}) en ese departamento.`,
      });
    }
    return res.status(500).json({
      mensaje: "Error interno al crear el puesto.",
    });
  }
};

const actualizarPuesto = async (req, res) => {
  const { id } = req.params;
  const { id_departamento } = req.body;
  const nombreLimpio = normalizarTexto(req.body.nombre);
  const seniorityLimpio = normalizarTexto(req.body.seniority) || "Junior";

  if (!id_departamento || !nombreLimpio) {
    return res.status(400).json({
      mensaje: "El departamento y el nombre del puesto son obligatorios.",
    });
  }

  try {
    const [puestoExiste] = await db.execute(
      "SELECT id_puesto FROM puestos WHERE id_puesto = ? LIMIT 1",
      [id],
    );

    if (puestoExiste.length === 0) {
      return res.status(404).json({ mensaje: "Puesto no encontrado." });
    }

    const [deptoExiste] = await db.execute(
      "SELECT id_departamento FROM departamentos WHERE id_departamento = ? LIMIT 1",
      [Number(id_departamento)],
    );

    if (deptoExiste.length === 0) {
      return res.status(400).json({
        mensaje: "El departamento seleccionado no existe.",
      });
    }

    const [duplicado] = await db.execute(
      `SELECT id_puesto FROM puestos
       WHERE id_departamento = ?
         AND LOWER(TRIM(nombre)) = LOWER(?)
         AND LOWER(TRIM(COALESCE(seniority, 'Junior'))) = LOWER(?)
         AND id_puesto != ?
       LIMIT 1`,
      [Number(id_departamento), nombreLimpio, seniorityLimpio, id],
    );

    if (duplicado.length > 0) {
      return res.status(409).json({
        mensaje: `Ya existe el puesto "${nombreLimpio}" (${seniorityLimpio}) en ese departamento.`,
      });
    }

    await db.execute(
      `UPDATE puestos
       SET id_departamento = ?, nombre = ?, seniority = ?
       WHERE id_puesto = ?`,
      [Number(id_departamento), nombreLimpio, seniorityLimpio, id],
    );

    return res.status(200).json({
      mensaje: "Puesto actualizado correctamente.",
    });
  } catch (error) {
    console.error("Error al actualizar puesto:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        mensaje: `Ya existe el puesto "${nombreLimpio}" (${seniorityLimpio}) en ese departamento.`,
      });
    }
    return res.status(500).json({
      mensaje: "Error interno al actualizar el puesto.",
    });
  }
};

const eliminarPuesto = async (req, res) => {
  const { id } = req.params;

  try {
    const [resultado] = await db.execute(
      "DELETE FROM puestos WHERE id_puesto = ?",
      [id],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Puesto no encontrado." });
    }

    return res.status(200).json({
      mensaje: "Puesto eliminado correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar puesto:", error);
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        mensaje:
          "No se puede eliminar el puesto porque hay empleados asignados a él.",
      });
    }
    return res.status(500).json({
      mensaje: "Error interno al eliminar el puesto.",
    });
  }
};

module.exports = {
  obtenerDepartamentos,
  crearDepartamento,
  actualizarDepartamento,
  eliminarDepartamento,
  obtenerPuestos,
  crearPuesto,
  actualizarPuesto,
  eliminarPuesto,
};