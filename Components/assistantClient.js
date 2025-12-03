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

const assistantBase = (import.meta.env.VITE_ASSISTANT_API_BASE_URL?.trim() || '').replace(/\/$/, '');
const assistantEndpoint = `${assistantBase}/api/assistant`;

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
  const languageHint = LANGUAGE_HINTS[languageCode] || LANGUAGE_HINTS.en;

  const trimmedHistory = history
    .filter((entry, index) => !(index === 0 && entry.role === 'assistant'))
    .filter((entry) => typeof entry?.content === 'string' && entry.content.trim().length)
    .slice(-6)
    .map((entry) => ({
      role: entry.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: entry.content.trim() }]
    }));

  const contents = [
    ...trimmedHistory,
    {
      role: 'user',
      parts: [{ text: `Language: ${languageHint}\n${userMessage?.trim() || 'Namaskara'}` }]
    }
  ];

  let response;
  try {
    response = await fetch(assistantEndpoint, {
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
  } catch (networkError) {
    console.error('Assistant proxy unreachable:', networkError);
    throw new Error('assistant-offline');
  }

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    const message = details?.error?.message || details?.error || response.statusText || 'assistant-proxy-error';
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
