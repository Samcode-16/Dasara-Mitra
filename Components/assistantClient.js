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


  // Convert history to OpenAI format
  const openaiHistory = history
    .filter((entry, index) => !(index === 0 && entry.role === 'assistant'))
    .filter((entry) => typeof entry?.content === 'string' && entry.content.trim().length)
    .slice(-6)
    .map((entry) => ({
      role: entry.role === 'assistant' ? 'assistant' : 'user',
      content: entry.content.trim()
    }));

  // System prompt for OpenAI
  const systemPrompt = {
    role: 'system',
    content: `You are "Dasara Mitra", a warm cultural guide for Mysuru Dasara.\n\nLANGUAGE RULES:\n- The user's preferred language is ${languageHint}\n- Always respond strictly in ${languageHint}\n- Kannada → native script (ಕನ್ನಡ)\n- Hindi → native script (देवनागरी)\n- Begin every reply with "${NAMASKARA_PREFIX[languageCode] || NAMASKARA_PREFIX.en}"\n- Keep answers factual, festival focused, and under 100 words.\n`
  };

  const messages = [
    systemPrompt,
    ...openaiHistory,
    {
      role: 'user',
      content: `Language: ${languageHint}\n${userMessage?.trim() || 'Namaskara'}`
    }
  ];

  let response;
  try {
    response = await fetch(assistantEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
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

  // OpenAI returns choices[0].message.content
  const reply = data?.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    throw new Error('empty-response');
  }

  return reply;
}
