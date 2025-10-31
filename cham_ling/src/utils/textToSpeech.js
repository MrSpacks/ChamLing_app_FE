// Утилита для воспроизведения произношения слов

// Маппинг кодов языков к кодам для Web Speech API
const languageMap = {
  'en': 'en-US',
  'ru': 'ru-RU',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'zh': 'zh-CN',
  'it': 'it-IT',
  'pt': 'pt-PT',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
  'ar': 'ar-SA',
  'hi': 'hi-IN',
  'tr': 'tr-TR',
  'pl': 'pl-PL',
  'nl': 'nl-NL',
  'sv': 'sv-SE',
  'da': 'da-DK',
  'no': 'nb-NO',
  'fi': 'fi-FI',
  'cs': 'cs-CZ',
  'ro': 'ro-RO',
  'hu': 'hu-HU',
  'el': 'el-GR',
  'th': 'th-TH',
  'vi': 'vi-VN',
  'id': 'id-ID',
  'ms': 'ms-MY'
};

// Получить код языка для Web Speech API
const getLanguageCode = (lang) => {
  // Если язык уже в правильном формате (например, 'en-US'), используем его
  if (lang.includes('-')) {
    return lang;
  }
  
  // Иначе ищем в маппинге
  return languageMap[lang] || lang || 'en-US';
};

// Проверка поддержки Web Speech API
export const isSpeechSupported = () => {
  return 'speechSynthesis' in window;
};

// Воспроизведение произношения слова
export const speakWord = (text, lang = 'en') => {
  if (!isSpeechSupported()) {
    console.warn('Web Speech API не поддерживается в этом браузере');
    return;
  }

  // Останавливаем текущее воспроизведение, если оно есть
  window.speechSynthesis.cancel();

  // Создаем новый объект SpeechSynthesisUtterance
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Устанавливаем язык произношения
  const languageCode = getLanguageCode(lang);
  utterance.lang = languageCode;
  
  // Настройки голоса (разные для разных языков)
  if (lang === 'en' || languageCode.startsWith('en')) {
    // Для английского: медленнее и четче
    utterance.rate = 0.85; // Немного медленнее для лучшей разборчивости
    utterance.pitch = 0.95; // Немного ниже тона для более естественного звучания
    utterance.volume = 1.0;
  } else {
    // Для других языков (например, русского) оставляем стандартные настройки
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
  }

  // Попытка найти подходящий голос для языка
  const voices = window.speechSynthesis.getVoices();
  
  // Приоритетный список голосов для английского (более качественные)
  const englishPreferredVoices = [
    'en-US', 'en-GB', 'en-AU', 'en-CA'
  ];
  
  // Приоритетные паттерны для поиска голосов
  let preferredVoice = null;
  
  if (lang === 'en' || languageCode.startsWith('en')) {
    // Для английского: сначала ищем качественные голоса
    preferredVoice = voices.find(voice => {
      const voiceLang = voice.lang.toLowerCase();
      return (
        voiceLang.includes('en-us') || 
        voiceLang.includes('en-gb') ||
        voiceLang.includes('en-au') ||
        (voiceLang.includes('en') && (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.name.includes('Enhanced')))
      );
    });
    
    // Если не нашли, берем любой английский голос
    if (!preferredVoice) {
      preferredVoice = voices.find(voice => 
        voice.lang.toLowerCase().includes('en')
      );
    }
  } else {
    // Для других языков ищем по коду языка
    preferredVoice = voices.find(voice => {
      const voiceLang = voice.lang.toLowerCase();
      return voiceLang.startsWith(lang.toLowerCase()) || 
             voiceLang.startsWith(languageCode.toLowerCase().split('-')[0]);
    });
  }

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  // Обработка ошибок
  utterance.onerror = (event) => {
    console.error('Ошибка при воспроизведении:', event.error);
  };

  // Воспроизведение
  window.speechSynthesis.speak(utterance);
};

// Остановка воспроизведения
export const stopSpeaking = () => {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
};

// Пауза воспроизведения
export const pauseSpeaking = () => {
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
  }
};

// Возобновление воспроизведения
export const resumeSpeaking = () => {
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
};

// Получить список доступных голосов
export const getAvailableVoices = () => {
  if (!isSpeechSupported()) {
    return [];
  }
  return window.speechSynthesis.getVoices();
};

// Загрузка голосов (некоторые браузеры требуют загрузки голосов)
export const loadVoices = () => {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
    } else {
      // Голоса могут загружаться асинхронно
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
      // Таймаут на случай, если голоса не загрузятся
      setTimeout(() => {
        resolve(window.speechSynthesis.getVoices());
      }, 1000);
    }
  });
};

// Инициализация (загрузка голосов при старте приложения)
export const initTextToSpeech = () => {
  if (isSpeechSupported()) {
    loadVoices();
  }
};

