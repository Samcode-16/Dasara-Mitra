const LANGUAGE_HINTS = {
  en: 'English',
  kn: 'Kannada',
  hi: 'Hindi'
};

const NAMASKARA_PREFIX = {
  en: 'Namaskara',
  kn: 'ನಮಸ್ಕಾರ',
  hi: 'नमस्कार'
};

const modelUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const buildSystemInstruction = (languageCode = 'en') => {
  const languageHint = LANGUAGE_HINTS[languageCode] || LANGUAGE_HINTS.en;
  const namaskara = NAMASKARA_PREFIX[languageCode] || NAMASKARA_PREFIX.en;

  return {
    role: 'system',
    parts: [
      {
        text: `You are "Dasara Mitra", a warm cultural guide for Mysuru Dasara.\n\nLANGUAGE RULES:\n- The user's preferred language is ${languageHint}\n- Always respond strictly in ${languageHint}\n- Kannada → native script (ಕನ್ನಡ)\n- Hindi → native script (देवनागरी)\n- Begin every reply with "${namaskara}"\n- Keep answers factual, festival focused, and under 100 words.\n`
      }
    ]
  };
};

export async function askFestivalAssistant({ userMessage, languageCode = 'en', history = [] }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('missing-api-key');
  }

  const languageHint = LANGUAGE_HINTS[languageCode] || LANGUAGE_HINTS.en;

  const trimmedHistory = history
    .filter((entry, index) => !(index === 0 && entry.role === 'assistant'))
    .slice(-6)
    .map((entry) => ({
      role: entry.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: entry.content }]
    }));

  const contents = [
    ...trimmedHistory,
    {
      role: 'user',
      parts: [{ text: `Language: ${languageHint}\n${userMessage || 'Namaskara'}` }]
    }
  ];

  const response = await fetch(`${modelUrl}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      system_instruction: buildSystemInstruction(languageCode),
      generation_config: {
        temperature: languageCode === 'kn' ? 0.7 : languageCode === 'hi' ? 0.65 : 0.6,
        top_p: 0.95,
        top_k: 40
      }
    })
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    const message = details?.error?.message || response.statusText || 'Gemini request failed';
    throw new Error(message);
  }

  const data = await response.json();
  if (data?.promptFeedback?.blockReason) {
    throw new Error(`blocked:${data.promptFeedback.blockReason}`);
  }

  const candidate = data?.candidates?.[0];
  if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
    throw new Error(`blocked:${candidate.finishReason}`);
  }

  const reply = candidate?.content?.parts
    ?.map((part) => part.text?.trim())
    .filter(Boolean)
    .join('\n');

  if (!reply) {
    throw new Error('empty-response');
  }

  return reply;
}
