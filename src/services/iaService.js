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
      Actúa como un Analista Senior de Recursos Humanos,
      especializado en evaluación de desempeño y gestión de talento.

      Analiza comparativamente los siguientes empleados:

      EMPLEADO A:
      ${JSON.stringify(empleadoA, null, 2)}

      EMPLEADO B:
      ${JSON.stringify(empleadoB, null, 2)}

      INSTRUCCIONES:

1. Compara objetivamente sus fortalezas y debilidades.
2. Analiza sus evaluaciones y tendencias de rendimiento.
3. Si el perfil incluye "competencias" (con promedio_puntaje y tipo_skill: Técnica o Blanda), compáralas e inclúyelas en fortalezas, mejoras o factores comparados.
4. Considera sus niveles de motivación y carga laboral.
5. Analiza los logros y obstáculos reportados.
6. Compara ambos perfiles según los datos disponibles.
7. Proporciona recomendaciones concretas para mejorar.
8. Redacta una conclusión indicando cuál candidato
         presenta mejores condiciones según la evidencia.

      IMPORTANTE:
- No inventes información.
- No supongas datos que no estén disponibles.
- Si faltan evaluaciones o competencias evaluadas, indícalo.
- No confundas los puntajes ni los promedios.
- No consideres automáticamente que más tareas
        significan mejor rendimiento.
- Ten en cuenta la sobrecarga laboral.
- La recomendación es orientativa, no una decisión definitiva.

      Devuelve exclusivamente los datos solicitados
      en la estructura JSON definida.
    `;

    // Esquema obligatorio de respuesta
    const esquemaDuelo = {
      name: "analisis_duelo_empleados",
      strict: true,
      schema: {
        type: "object",
        properties: {
          resumen: {
            type: "string",
          },
          fortalezas_a: {
            type: "array",
            items: { type: "string" },
          },
          fortalezas_b: {
            type: "array",
            items: { type: "string" },
          },
          mejoras_a: {
            type: "array",
            items: { type: "string" },
          },
          mejoras_b: {
            type: "array",
            items: { type: "string" },
          },
          factores_comparados: {
            type: "array",
            items: {
              type: "object",
              properties: {
                factor: { type: "string" },
                empleado_a: { type: "string" },
                empleado_b: { type: "string" },
              },
              required: ["factor", "empleado_a", "empleado_b"],
              additionalProperties: false,
            },
          },
          recomendaciones: {
            type: "array",
            items: { type: "string" },
          },
          conclusion: {
            type: "string",
          },
        },
        required: [
          "resumen",
          "fortalezas_a",
          "fortalezas_b",
          "mejoras_a",
          "mejoras_b",
          "factores_comparados",
          "recomendaciones",
          "conclusion",
        ],
        additionalProperties: false,
      },
    };

    console.log(`[Groq IA] Generando duelo con ${MODELO}...`);

    const chatCompletion = await groq.chat.completions.create({
      model: MODELO,
      messages: [
        {
          role: "system",
          content:
            "Eres un analista de Recursos Humanos. " +
            "Debes responder utilizando exclusivamente " +
            "la estructura JSON solicitada.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: esquemaDuelo,
      },
      temperature: 0.4,
    });

    const contenido = chatCompletion.choices[0]?.message?.content;

    if (!contenido) {
      throw new Error("La IA devolvió una respuesta vacía.");
    }

    // Convertimos el JSON recibido en objeto JavaScript
    const analisis = JSON.parse(contenido);

    console.log("[Groq IA] Análisis estructurado generado.");

    return analisis;
  } catch (error) {
    console.error("[Groq IA] Error al generar el duelo:", error);

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
      Si hay "competencias_evaluadas" con puntajes o justificaciones, podés apoyarte brevemente en ellas sin alargar el mensaje.
      
      REGLAS ESTRICTAS DE FORMATO:
1. Comienza saludando por su nombre real (ej: "Hola ${nombreEmpleado}, ...").
2. Sé breve y directo: redacta un único párrafo o máximo dos párrafos cortos (no más de 60-80 palabras en total).
3. Menciona de forma simple su puntaje y un consejo rápido o aliento basado en sus check-ins o competencias, sin extenderte en explicaciones complejas ni teorizar de más.
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
      basándote en su evaluación, las competencias evaluadas (si vienen informadas), sus check-ins y su retroalimentación.

      EVALUACIÓN:
      ${JSON.stringify(evaluacion, null, 2)}

      CHECK-INS RECIENTES:
      ${JSON.stringify(checkins || [], null, 2)}

      FEEDBACK:
      ${feedback || "No se pudo generar feedback previo."}

      REGLAS:
1. Los objetivos deben ser concretos, realistas y medibles.
2. Deben estar relacionados con las dificultades, competencias con menor puntaje o áreas de mejora detectadas.
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

    if (
      !Array.isArray(respuesta.objetivos) ||
      respuesta.objetivos.length === 0
    ) {
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
      "No se pudieron generar los planes de acción: " +
        (error.message || error),
    );
  }
};

module.exports = {
  generarAnalisisDuelo,
  generarFeedbackEvaluacion,
  generarPlanesAccion,
};
