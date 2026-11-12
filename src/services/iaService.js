const Groq = require("groq-sdk");

// Inicializamos Groq leyendo la llave del .env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Usaremos el modelo Llama 3 (versión 70B, que es súper inteligente para análisis)
const MODELO = "openai/gpt-oss-120b";

const generarAnalisisDuelo = async (empleadoA, empleadoB) => {
  try {
    if (!empleadoA || !empleadoB) {
      throw new Error("Se necesitan los datos de ambos empleados.");
    }

    const prompt = `
      Actúa como un Analista de Recursos Humanos Senior experto en evaluación de desempeño.
      A continuación, te presentaré los datos de dos empleados evaluados para un posible ascenso.

      EMPLEADO A:
      ${JSON.stringify(empleadoA, null, 2)}

      EMPLEADO B:
      ${JSON.stringify(empleadoB, null, 2)}

      Tu tarea:
      1. Compara objetivamente a ambos empleados destacando fortalezas y debilidades.
      2. Ten en cuenta los obstáculos reportados en sus check-ins.
      3. Determina un ganador claro justificando tu decisión.
      4. Propón un breve plan de acción para el que no fue seleccionado.

      Responde en un formato profesional y estructurado. No uses saludos.
    `;

    console.log(`[Groq IA] Enviando datos a ${MODELO}...`);
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: MODELO,
      temperature: 0.7, // 0.7 da un tono analítico y profesional
    });

    console.log("[Groq IA] ¡Respuesta generada con éxito!");
    return chatCompletion.choices[0].message.content;

  } catch (error) {
    console.error("Error en la IA (Duelo Groq):", error);
    throw new Error("No se pudo generar el análisis comparativo: " + (error.message || error));
  }
};

const generarFeedbackEvaluacion = async (evaluacionAdmin, checkinsEmpleado) => {
  try {
    if (!evaluacionAdmin) throw new Error("Faltan datos de evaluación.");

    const prompt = `
      Actúa como un Coach de Desarrollo Profesional empático.
      EVALUACIÓN DEL SUPERVISOR: ${JSON.stringify(evaluacionAdmin, null, 2)}
      REPORTES DEL EMPLEADO: ${JSON.stringify(checkinsEmpleado || [], null, 2)}

      Redacta un mensaje de retroalimentación de máximo 3 párrafos dirigido al empleado (háblale de "tú"), reconociendo logros, abordando brechas con empatía y dando un consejo práctico.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: MODELO,
      temperature: 0.7,
    });

    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("Error en la IA (Feedback Groq):", error);
    throw new Error("No se pudo generar el feedback: " + (error.message || error));
  }
};

module.exports = {
  generarAnalisisDuelo,
  generarFeedbackEvaluacion
};