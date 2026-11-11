const { GoogleGenerativeAI } = require("@google/generative-ai");

// Inicializamos el cliente de Gemini con tu clave del .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Usamos Flash porque es el modelo más rápido y gratuito ideal para textos
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Analiza dos perfiles de empleados y genera un veredicto para el "Duelo"
 */
const generarAnalisisDuelo = async (empleadoA, empleadoB) => {
  try {
    const prompt = `
      Actúa como un Analista de Recursos Humanos Senior experto en evaluación de desempeño.
      A continuación, te presentaré los datos y métricas recientes de dos empleados que están siendo evaluados para un posible ascenso o retención en su período de prueba.

      EMPLEADO A:
      ${JSON.stringify(empleadoA, null, 2)}

      EMPLEADO B:
      ${JSON.stringify(empleadoB, null, 2)}

      Tu tarea:
      1. Compara objetivamente a ambos empleados destacando sus fortalezas y debilidades.
      2. Si uno de ellos está en período de prueba y reportó obstáculos (check-ins), tenlo en cuenta para tu análisis.
      3. Determina un ganador claro (o declara un empate técnico) justificando tu decisión basándote estrictamente en los datos.
      4. Propón un breve plan de acción (1 o 2 metas) para el empleado que no fue seleccionado.

      Responde en un formato profesional, directo y estructurado, sin saludos.
    `;

    const resultado = await model.generateContent(prompt);
    return resultado.response.text();
  } catch (error) {
    console.error("Error en la IA (Duelo):", error);
    throw new Error("No se pudo generar el análisis comparativo.");
  }
};

/**
 * Genera un feedback empático para el empleado basado en su evaluación mensual y sus propios check-ins
 */
const generarFeedbackEvaluacion = async (evaluacionAdmin, checkinsEmpleado) => {
  try {
    const prompt = `
      Actúa como un Coach de Desarrollo Profesional empático y constructivo.
      Acabas de recibir la evaluación de desempeño mensual de un empleado (hecha por su supervisor) y los propios check-ins que el empleado registró durante el mes.

      EVALUACIÓN DEL SUPERVISOR:
      ${JSON.stringify(evaluacionAdmin, null, 2)}

      REPORTES DEL EMPLEADO (Check-ins del mes):
      ${JSON.stringify(checkinsEmpleado, null, 2)}

      Tu tarea:
      Redacta un mensaje de retroalimentación de máximo 3 párrafos dirigido directamente al empleado (háblale de "tú").
      - Empieza reconociendo sus logros o su nivel de motivación.
      - Si hay una brecha (ej. el supervisor le dio baja nota en algo, pero el empleado reportó alta carga de trabajo u obstáculos), aborda el tema con empatía.
      - Termina con un consejo práctico y accionable para mejorar el próximo mes.
    `;

    const resultado = await model.generateContent(prompt);
    return resultado.response.text();
  } catch (error) {
    console.error("Error en la IA (Feedback):", error);
    throw new Error("No se pudo generar el feedback del empleado.");
  }
};

module.exports = {
  generarAnalisisDuelo,
  generarFeedbackEvaluacion
};