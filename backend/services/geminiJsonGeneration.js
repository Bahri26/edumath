const { DynamicRetrievalMode } = require('@google/generative-ai');

/**
 * JSON + schema ile generateContent; isteğe bağlı Google Arama zeminlemesi.
 * Basarisiz olursa (model + JSON + tool uyumsuzlugu vb.) toolsuz tekrarlar.
 */
async function generateContentAsJson({
  genAI,
  modelName,
  prompt,
  responseSchema,
  temperature = 0.28,
  enableGoogleGrounding = false,
}) {
  const generationConfig = {
    responseMimeType: 'application/json',
    responseSchema,
    temperature,
  };

  const groundingTools = [
    {
      googleSearchRetrieval: {
        dynamicRetrievalConfig: {
          mode: DynamicRetrievalMode.MODE_DYNAMIC,
          dynamicThreshold: 0.25,
        },
      },
    },
  ];

  const run = async (withGrounding) => {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig,
      ...(withGrounding ? { tools: groundingTools } : {}),
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  };

  if (enableGoogleGrounding) {
    try {
      return await run(true);
    } catch (e) {
      console.warn(
        '[geminiJsonGeneration] Google zeminleme veya JSON hatasi, toolsuz tekrar:',
        e.message
      );
      const quotaLike = /429|\bquota\b|resource.?exhausted/i.test(String(e.message || ''));
      if (quotaLike) {
        throw e;
      }
    }
  }
  return run(false);
}

module.exports = {
  generateContentAsJson,
};
