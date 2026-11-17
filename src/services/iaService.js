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

// ==========================================
// GENERAR PLANES DE ACCIÓN CON IA
// ==========================================
const generarPlanesAccion = async (evaluacion, checkins, feedback) => {
  try {
    if (!evaluacion) {
      throw new Error("Faltan los datos de la evaluación.");
    }

    const prompt = `
      Actúa como un especialista en Recursos Humanos y desarrollo profesional.

      Debes proponer exactamente 3 objetivos de mejora para un empleado,
      basándote en su evaluación, sus check-ins y su retroalimentación.

      EVALUACIÓN:
      ${JSON.stringify(evaluacion, null, 2)}

      CHECK-INS RECIENTES:
      ${JSON.stringify(checkins || [], null, 2)}

      FEEDBACK:
      ${feedback || "No se pudo generar feedback previo."}

      REGLAS:
      1. Los objetivos deben ser concretos, realistas y medibles.
      2. Deben estar relacionados con las dificultades o áreas de mejora detectadas.
      3. No inventes información personal ni afirmes que el empleado tiene problemas que no aparecen en los datos.
      4. Cada objetivo debe tener un título breve y una descripción con acciones concretas.
      5. El plazo debe expresarse como una cantidad de días entre 7 y 90.
      6. Utiliza un tono profesional, respetuoso y constructivo.

      RESPONDE EXCLUSIVAMENTE con JSON válido, sin Markdown ni explicaciones,
      siguiendo exactamente esta estructura:

      {
        "objetivos": [
          {
            "titulo": "Título breve",
            "descripcion": "Descripción de las acciones concretas",
            "dias_plazo": 30
          }
        ]
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: MODELO,
      temperature: 0.3,
    });

    const contenido = chatCompletion.choices[0].message.content;

    // Limpiamos posibles bloques Markdown que pueda devolver el modelo.
    const contenidoLimpio = contenido
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const respuesta = JSON.parse(contenidoLimpio);

    if (!Array.isArray(respuesta.objetivos) || respuesta.objetivos.length === 0) {
      throw new Error("La IA no devolvió objetivos válidos.");
    }

    // Validamos y limitamos la cantidad de objetivos.
    const objetivos = respuesta.objetivos.slice(0, 3).map((objetivo) => {
      if (
        typeof objetivo.titulo !== "string" ||
        typeof objetivo.descripcion !== "string" ||
        !objetivo.titulo.trim() ||
        !objetivo.descripcion.trim()
      ) {
        throw new Error("La IA devolvió un objetivo incompleto.");
      }

      const dias = Number(objetivo.dias_plazo);

      if (!Number.isFinite(dias)) {
        throw new Error("La IA devolvió un plazo inválido.");
      }

      return {
        titulo: objetivo.titulo.trim().slice(0, 150),
        descripcion: objetivo.descripcion.trim(),
        dias_plazo: Math.min(90, Math.max(7, Math.round(dias))),
      };
    });

    return objetivos;
  } catch (error) {
    console.error("Error al generar planes de acción con IA:", error);
    throw new Error(
      "No se pudieron generar los planes de acción: " + (error.message || error)
    );
  }
};
/*
module.exports = {
  generarAnalisisDuelo,
  generarFeedbackEvaluacion,
};*/

module.exports = {
  generarAnalisisDuelo,
  generarFeedbackEvaluacion,
  generarPlanesAccion,
};
