import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, X, RefreshCw } from 'lucide-react';
import { useLanguage } from './DasaraContext.jsx';
import { Button } from './ui.jsx';
import { askFestivalAssistant } from './assistantClient.js';

const SPEECH_LOCALES = {
  en: 'en-IN',
  kn: 'kn-IN',
  hi: 'hi-IN'
};

const LANGUAGE_KEYWORDS = {
  en: ['english', 'inglish', 'angrezi'],
  kn: ['kannada', 'kannad', 'kanada', 'ಕನ್ನಡ'],
  hi: ['hindi', 'hindhi', 'हिंदी']
};

const SCRIPT_MATCHERS = {
  kn: /[\u0C80-\u0CFF]/, // Kannada
  hi: /[\u0900-\u097F]/ // Devanagari (Hindi)
};

const LANGUAGE_ACKS = {
  en: 'Namaskara! I will answer in English now.',
  kn: 'ನಮಸ್ಕಾರ! ನಾನು ಈಗಿನಿಂದ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸುತ್ತೇನೆ.',
  hi: 'नमस्कार! अब मैं हिंदी में जवाब दूँगा।'
};

const getVoiceGreeting = (language) => {
  if (language === 'kn') {
    return 'ನಮಸ್ಕಾರ! ಮೈಸೂರಿನ ದಸರಾ ಕಾರ್ಯಕ್ರಮಗಳ ಬಗ್ಗೆ ಕೇಳಲು ಮೈಕ್ ಒತ್ತಿ.';
  }
  if (language === 'hi') {
    return 'नमस्कार! दसराह कार्यक्रमों या यात्रा जानकारी के लिए माइक्रोफोन टैप करें।';
  }
  return 'Namaskara! Tap the mic and ask about Mysuru Dasara routes or events.';
};

const getSpeechRecognition = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const speakResponse = (text, locale, setSpeaking) => {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) {
    return;
  }
  window.speechSynthesis.cancel();
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale || 'en-IN';
    utterance.rate = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    setSpeaking(false);
  }
};

const stopSpeaking = (setSpeaking) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }
  window.speechSynthesis.cancel();
  setSpeaking(false);
};

const detectLanguageCommand = (text = '') => {
  const lower = text.toLowerCase();
  return Object.entries(LANGUAGE_KEYWORDS).reduce((match, [code, keywords]) => {
    if (match) return match;
    const hasKeyword = keywords.some((keyword) => lower.includes(keyword.toLowerCase()));
    return hasKeyword ? code : null;
  }, null);
};

const detectLanguageByScript = (text = '') => {
  if (!text) {
    return null;
  }
  return Object.entries(SCRIPT_MATCHERS).reduce((match, [code, regex]) => {
    if (match) return match;
    return regex.test(text) ? code : null;
  }, null);
};

const stripLanguageKeywords = (text = '', languageCode) => {
  const keywords = LANGUAGE_KEYWORDS[languageCode] || [];
  return keywords
    .reduce((output, keyword) => {
      const regex = new RegExp(keyword, 'ig');
      return output.replace(regex, ' ');
    }, text)
    .replace(/\s+/g, ' ')
    .trim();
};

export default function VoiceAssistant() {
  const { t, language, setLanguage: setAppLanguage } = useLanguage();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState(getVoiceGreeting(language));
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const historyRef = useRef([{ role: 'assistant', content: getVoiceGreeting(language) }]);

  const locale = useMemo(() => SPEECH_LOCALES[language] || 'en-IN', [language]);
  const changeLanguagePreference = useMemo(() => setAppLanguage || (() => {}), [setAppLanguage]);

  useEffect(() => {
    const greeting = getVoiceGreeting(language);
    setAssistantReply(greeting);
    historyRef.current = [{ role: 'assistant', content: greeting }];
  }, [language]);

  const handleVoiceQuery = useCallback(
    async (spokenText) => {
      const originalQuery = spokenText.trim();
      if (!originalQuery) {
        setStatus('idle');
        return;
      }

      let workingQuery = originalQuery;
      let responseLanguage = language;
      const keywordLanguage = detectLanguageCommand(originalQuery);
      const scriptLanguage = keywordLanguage ? null : detectLanguageByScript(originalQuery);
      const requestedLanguage = keywordLanguage || scriptLanguage;

      if (requestedLanguage) {
        responseLanguage = requestedLanguage;
        changeLanguagePreference(requestedLanguage);
        if (keywordLanguage) {
          workingQuery = stripLanguageKeywords(workingQuery, requestedLanguage);
        }
      }

      const cleanedQuery = workingQuery.trim();
      setTranscript(cleanedQuery || originalQuery);
      setStatus('processing');
      setError(null);

      const userHistoryContent = cleanedQuery || originalQuery;
      const historyWithUser = [...historyRef.current, { role: 'user', content: userHistoryContent }];

      if (!cleanedQuery) {
        const acknowledgement = LANGUAGE_ACKS[responseLanguage] || getVoiceGreeting(responseLanguage);
        historyRef.current = [...historyWithUser, { role: 'assistant', content: acknowledgement }];
        setAssistantReply(acknowledgement);
        setStatus('responded');
        speakResponse(acknowledgement, SPEECH_LOCALES[responseLanguage] || locale, setIsSpeaking);
        return;
      }

      try {
        const reply = await askFestivalAssistant({
          userMessage: cleanedQuery,
          languageCode: responseLanguage,
          history: historyWithUser
        });
        const updatedHistory = [...historyWithUser, { role: 'assistant', content: reply }];
        historyRef.current = updatedHistory;
        setAssistantReply(reply);
        setStatus('responded');
        speakResponse(reply, SPEECH_LOCALES[responseLanguage] || locale, setIsSpeaking);
      } catch (err) {
        const message = err?.message || 'voice-error';
        setError(message);
        setStatus('error');
      }
    },
    [language, locale, changeLanguagePreference]
  );

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = locale;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('listening');
      setError(null);
      setTranscript('');
    };

    recognition.onresult = (event) => {
      const spoken = event.results?.[0]?.[0]?.transcript || '';
      handleVoiceQuery(spoken);
    };

    recognition.onerror = (event) => {
      setError(event.error || 'speech-error');
      setStatus('error');
    };

    recognition.onend = () => {
      setIsListening(false);
      setStatus((prev) => (prev === 'listening' ? 'idle' : prev));
    };

    recognitionRef.current = recognition;
    setIsSupported(true);

    return () => recognition.stop();
  }, [locale, handleVoiceQuery]);

  const startListening = () => {
    if (!recognitionRef.current || status === 'processing') {
      return;
    }
    try {
      recognitionRef.current.lang = locale;
      recognitionRef.current.start();
    } catch (err) {
      setError(err?.message || 'mic-error');
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const handleTogglePanel = () => {
    setIsPanelOpen(true);
    if (isSupported) {
      setTimeout(() => {
        startListening();
      }, 200);
    }
  };

  const statusBadge = {
    listening: {
      text: t('voiceAssistListening'),
      className: 'bg-green-100 text-green-700 border-green-200'
    },
    processing: {
      text: t('voiceAssistProcessing'),
      className: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    responded: {
      text: t('voiceAssistResponded'),
      className: 'bg-amber-100 text-amber-700 border-amber-200'
    },
    error: {
      text: t('voiceAssistError'),
      className: 'bg-red-100 text-red-600 border-red-200'
    },
    idle: {
      text: t('voiceAssistReady'),
      className: 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }[status || 'idle'];

  return (
    <>
      <button
        onClick={handleTogglePanel}
        className={`fixed top-20 right-6 z-50 flex items-center gap-2 rounded-full border border-[#F97316]/30 bg-white/90 px-4 py-2 text-[#B45309] shadow-lg hover:shadow-xl transition-all duration-200 ${isPanelOpen ? 'hidden' : 'flex'}`}
        aria-label={t('voiceAssistTapToSpeak')}
      >
        <Mic className="w-5 h-5" />
        <span className="font-semibold text-sm">{t('voiceAssistTitle')}</span>
      </button>

      {isPanelOpen && (
        <div className="fixed top-[104px] right-6 z-50 w-[90vw] max-w-md rounded-2xl border border-orange-200 bg-white shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-3 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#B45309] flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                {t('voiceAssistTitle')}
              </p>
              <p className="text-xs text-gray-600">{isSupported ? t('voiceAssistHint') : t('voiceAssistUnsupported')}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:bg-gray-100"
              onClick={() => {
                setIsPanelOpen(false);
                stopListening();
                stopSpeaking(setIsSpeaking);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="px-4 py-3 space-y-3">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge.className}`}>
              {status === 'processing' ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : status === 'listening' ? (
                <Mic className="w-3 h-3" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {statusBadge.text}
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-[11px] font-semibold uppercase text-gray-500">{t('voiceAssistTranscriptLabel')}</p>
              <p className="text-sm text-gray-800 min-h-[40px] mt-1">
                {transcript || t('voiceAssistPromptExample')}
              </p>
            </div>

            <div className="rounded-xl border border-orange-100 bg-[#FFF8EB] p-3">
              <p className="text-[11px] font-semibold uppercase text-[#B45309]">{t('voiceAssistResponseLabel')}</p>
              <p className="text-sm text-gray-900 whitespace-pre-line min-h-[60px] mt-1">
                {assistantReply}
              </p>
            </div>

            {error && (
              <p className="text-xs text-red-600">
                {t('voiceAssistErrorDetail')}: {error}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                onClick={isListening ? stopListening : startListening}
                className={`flex-1 ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-[#F97316] hover:bg-[#EA580C]'}`}
                disabled={!isSupported || status === 'processing'}
              >
                {isListening ? (
                  <span className="flex items-center gap-2 text-white text-sm font-semibold">
                    <MicOff className="w-4 h-4" />
                    {t('voiceAssistStopListening')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-white text-sm font-semibold">
                    <Mic className="w-4 h-4" />
                    {t('voiceAssistTapToSpeak')}
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="border-orange-200 text-orange-700"
                onClick={() => stopSpeaking(setIsSpeaking)}
                disabled={!isSpeaking}
              >
                <VolumeX className="w-4 h-4" />
                {t('voiceAssistStopAudio')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="border-orange-200 text-orange-800"
                onClick={() => speakResponse(assistantReply, locale, setIsSpeaking)}
                disabled={!assistantReply}
              >
                <Volume2 className="w-4 h-4" />
                {t('voiceAssistReplayAudio')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
