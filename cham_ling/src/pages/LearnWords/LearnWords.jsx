import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { 
  FaArrowLeft, 
  FaBolt, 
  FaCoins, 
  FaLanguage,
  FaCheck,
  FaTimes,
  FaVolumeUp
} from "react-icons/fa";
import LanguageSwitcher from "../../components/LanguageSwitcher/LanguageSwitcher";
import { speakWord } from "../../utils/textToSpeech";
import "./LearnWords.css";

const LearnWords = ({ dictionary, words, onBack }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showMascot, setShowMascot] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [userXP, setUserXP] = useState(100); // Пример XP пользователя
  const [energy, setEnergy] = useState(5); // Пример энергии/монет
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);

  // Перемешиваем слова для викторины
  const shuffledWords = useMemo(() => {
    if (!words || words.length === 0) return [];
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    return shuffled;
  }, [words]);

  // Генерируем варианты ответа (1 правильный + 3 неправильных)
  const answerOptions = useMemo(() => {
    if (!shuffledWords.length || !words) return [];
    
    const currentWord = shuffledWords[currentIndex];
    const wrongAnswers = words
      .filter(w => w.id !== currentWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.translation);
    
    const allAnswers = [
      currentWord.translation,
      ...wrongAnswers
    ].sort(() => Math.random() - 0.5);

    return allAnswers.map((answer, index) => ({
      text: answer,
      isCorrect: answer === currentWord.translation,
      id: index
    }));
  }, [shuffledWords, currentIndex, words]);

  useEffect(() => {
    // Сброс состояния при переходе к новому слову
    setSelectedAnswer(null);
    setShowResult(false);
    setShowMascot(false);
  }, [currentIndex]);

  if (!words || words.length === 0 || !shuffledWords.length) {
    return (
      <div className="learn_words_container">
        <button className="back_button_top" onClick={onBack}>
          <FaArrowLeft /> {t("LearnWords.back") || "Назад"}
        </button>
        <div className="empty_state">
          <p>{t("LearnWords.no_words") || "В словаре нет слов для изучения"}</p>
        </div>
      </div>
    );
  }

  const currentWord = shuffledWords[currentIndex];
  const progress = ((currentIndex + 1) / shuffledWords.length) * 100;
  const isLast = currentIndex === shuffledWords.length - 1;

  const handleAnswerSelect = (answerId) => {
    if (showResult) return; // Не позволяем выбирать после ответа
    
    const answer = answerOptions.find(a => a.id === answerId);
    setSelectedAnswer(answerId);
    setShowResult(true);
    setIsCorrect(answer.isCorrect);
    
    if (answer.isCorrect) {
      setCorrectCount(prev => prev + 1);
      setUserXP(prev => prev + 10); // Начисляем XP за правильный ответ
      setShowMascot(true);
      setTimeout(() => setShowMascot(false), 2000);
      
      // Сохраняем прогресс изучения в localStorage
      if (dictionary && dictionary.id && currentWord && currentWord.id) {
        const progressKey = `dict_${dictionary.id}_progress`;
        const learnedWords = JSON.parse(localStorage.getItem(progressKey) || '[]');
        
        // Добавляем ID слова, если его еще нет в списке изученных
        if (!learnedWords.includes(currentWord.id)) {
          learnedWords.push(currentWord.id);
          localStorage.setItem(progressKey, JSON.stringify(learnedWords));
        }
      }
    } else {
      setEnergy(prev => Math.max(0, prev - 1)); // Тратим энергию за неправильный ответ
    }
  };

  const handleNext = () => {
    if (!isLast) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Завершение изучения
      alert(`${t("LearnWords.finish") || "Завершить"}: ${correctCount} / ${shuffledWords.length}`);
      onBack();
    }
  };

  // Талисман ChamLing (простая иконка)
  const ChamLingMascot = () => (
    <div className={`mascot ${showMascot ? 'show' : ''}`}>
      <div className="mascot_icon">🎉</div>
      <div className="mascot_text">+10 XP</div>
    </div>
  );

  return (
    <div className="learn_words_container">
      {/* Верхняя панель */}
      <div className="learn_top_bar">
        <button className="back_button_top" onClick={onBack}>
          <FaArrowLeft />
        </button>
        
        <div className="progress_section">
          <div className="progress_bar_wrapper">
            <div className="progress_bar" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress_text">
            {currentIndex + 1} / {shuffledWords.length} {t("LearnWords.words") || "слов"}
          </span>
        </div>

        <div className="top_bar_right">
          <div className="energy_display" title={t("LearnWords.energy") || "Энергия"}>
            <FaBolt />
            <span>{energy}</span>
          </div>
          
          <button 
            className="language_button"
            onClick={() => setShowLanguageSettings(!showLanguageSettings)}
            title={t("LearnWords.language_settings") || "Настройки языка"}
          >
            <FaLanguage />
          </button>
        </div>
      </div>

      {/* Модальное окно настроек языка */}
      {showLanguageSettings && (
        <div className="language_modal" onClick={() => setShowLanguageSettings(false)}>
          <div className="language_modal_content" onClick={(e) => e.stopPropagation()}>
            <LanguageSwitcher />
          </div>
        </div>
      )}

      {/* Центральная карточка слова */}
      <div className={`word_card_flip ${showResult ? (isCorrect ? 'correct' : 'incorrect') : ''}`}>
        <div className="word_card_inner">
          <div className="word_card_front">
            {currentWord.image_url && (
              <div className="word_card_image">
                <img src={currentWord.image_url} alt={currentWord.word} />
              </div>
            )}
            <div className="word_card_content">
              <div className="word_header_learn">
                <h2 className="word_text">{currentWord.word}</h2>
                <button 
                  className="speak_button_learn"
                  onClick={() => speakWord(currentWord.word, dictionary.source_lang)}
                  title={t("LearnWords.speak_word") || "Произнести слово"}
                  aria-label={t("LearnWords.speak_word") || "Произнести слово"}
                >
                  <FaVolumeUp />
                </button>
              </div>
              <p className="word_lang_pair">
                {dictionary.source_lang} → {dictionary.target_lang}
              </p>
              {currentWord.example && (
                <p className="word_example">{currentWord.example}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Варианты ответа */}
      <div className="answer_options">
        {answerOptions.map((option) => {
          const isSelected = selectedAnswer === option.id;
          const showCorrect = showResult && option.isCorrect;
          const showIncorrect = showResult && isSelected && !option.isCorrect;

          return (
            <button
              key={option.id}
              className={`answer_option ${isSelected ? 'selected' : ''} ${showCorrect ? 'correct' : ''} ${showIncorrect ? 'incorrect' : ''}`}
              onClick={() => handleAnswerSelect(option.id)}
              disabled={showResult}
            >
              <span className="answer_text">{option.text}</span>
              {showResult && (
                <span className="answer_icon">
                  {option.isCorrect ? <FaCheck /> : showIncorrect ? <FaTimes /> : null}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Кнопка следующего слова */}
      {showResult && (
        <button className="next_word_button" onClick={handleNext}>
          {isLast ? t("LearnWords.finish") || "Завершить" : t("LearnWords.next") || "Далее"}
        </button>
      )}

      {/* Индикатор уровня (XP) */}
      <div className="xp_indicator">
        <div className="xp_level">Level 1</div>
        <div className="xp_bar_wrapper">
          <div className="xp_bar" style={{ width: `${(userXP % 100)}%` }} />
        </div>
        <div className="xp_value">{userXP} XP</div>
      </div>

      {/* Талисман ChamLing */}
      <ChamLingMascot />
    </div>
  );
};

export default LearnWords;
