const Groq = require("groq-sdk");

// Inicializamos Groq leyendo la llave del .env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Usaremos el modelo configurado
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
      temperature: 0.7,
    });

    console.log("[Groq IA] ¡Respuesta generada con éxito!");
    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("Error en la IA (Duelo Groq):", error);
    throw new Error(
      "No se pudo generar el análisis comparativo: " + (error.message || error),
    );
  }
};

const generarFeedbackEvaluacion = async (evaluacionAdmin, checkinsEmpleado) => {
  try {
    if (!evaluacionAdmin) throw new Error("Faltan datos de evaluación.");

    const nombreEmpleado = evaluacionAdmin.nombre_empleado || "Colaborador";

    const prompt = `
      Actúa como un supervisor o líder de recursos humanos empático y directo.
      DATOS DE EVALUACIÓN: ${JSON.stringify(evaluacionAdmin, null, 2)}
      REPORTES DEL EMPLEADO (Check-ins recientes): ${JSON.stringify(checkinsEmpleado || [], null, 2)}

      Redacta un mensaje de retroalimentación simple, claro y motivador dirigido al empleado.
      
      REGLAS ESTRICTAS DE FORMATO:
      1. Comienza saludando por su nombre real (ej: "Hola ${nombreEmpleado}, ...").
      2. Sé breve y directo: redacta un único párrafo o máximo dos párrafos cortos (no más de 60-80 palabras en total).
      3. Menciona de forma simple su puntaje y un consejo rápido o aliento basado en sus check-ins, sin extenderte en explicaciones complejas ni teorizar de más.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: MODELO,
      temperature: 0.5, // Temperatura más baja para respuestas más directas y menos creativas/extensas
    });

    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("Error en la IA (Feedback Groq):", error);
    throw new Error(
      "No se pudo generar el feedback: " + (error.message || error),
    );
  }
};

module.exports = {
  generarAnalisisDuelo,
  generarFeedbackEvaluacion,
};
