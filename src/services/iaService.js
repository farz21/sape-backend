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
      Actúa como un Analista de Recursos Humanos Senior.

      Analiza los datos de los dos empleados para proporcionar
      una comparación objetiva que sirva de apoyo al administrador.

      EMPLEADO A:
      ${JSON.stringify(empleadoA, null, 2)}

      EMPLEADO B:
      ${JSON.stringify(empleadoB, null, 2)}

      INSTRUCCIONES:
      - Compara las evaluaciones y los check-ins disponibles.
      - Identifica fortalezas y oportunidades de mejora de cada empleado.
      - Ten en cuenta los obstáculos reportados.
      - Explica las diferencias relevantes con información concreta.
      - No inventes datos, porcentajes ni resultados.
      - Si falta información, indícalo expresamente.
      - No tomes una decisión automática de ascenso ni declares
        un ganador definitivo.
      - Las conclusiones son orientativas y deben ser revisadas
        por el administrador.
      - Redacta en español profesional y claro.
    `;

    console.log(`[Groq IA] Enviando datos a ${MODELO}...`);

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Eres un analista de Recursos Humanos objetivo. " +
            "Debes analizar información laboral sin inventar datos."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: MODELO,
      temperature: 0.3,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "analisis_duelo_empleados",
          strict: true,
          schema: {
            type: "object",
            properties: {
              resumen: {
                type: "string"
              },
              fortalezas_a: {
                type: "array",
                items: { type: "string" }
              },
              fortalezas_b: {
                type: "array",
                items: { type: "string" }
              },
              mejoras_a: {
                type: "array",
                items: { type: "string" }
              },
              mejoras_b: {
                type: "array",
                items: { type: "string" }
              },
              factores_comparados: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    factor: { type: "string" },
                    empleado_a: { type: "string" },
                    empleado_b: { type: "string" }
                  },
                  required: [
                    "factor",
                    "empleado_a",
                    "empleado_b"
                  ],
                  additionalProperties: false
                }
              },
              recomendaciones: {
                type: "array",
                items: { type: "string" }
              },
              conclusion: {
                type: "string"
              }
            },
            required: [
              "resumen",
              "fortalezas_a",
              "fortalezas_b",
              "mejoras_a",
              "mejoras_b",
              "factores_comparados",
              "recomendaciones",
              "conclusion"
            ],
            additionalProperties: false
          }
        }
      }
    });

    const contenido = chatCompletion.choices[0].message.content;

    if (!contenido) {
      throw new Error("Groq devolvió una respuesta vacía.");
    }

    const analisis = JSON.parse(contenido);

    console.log("[Groq IA] Análisis estructurado generado.");

    return analisis;

  } catch (error) {
    console.error("Error en la IA (Duelo Groq):", error);

    throw new Error(
      "No se pudo generar el análisis comparativo: " +
      (error.message || error)
    );
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