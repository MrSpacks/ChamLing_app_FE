import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getUserDictionaries, getLearningProgress } from "../../api/auth";
import { getProgress } from "../../utils/syncProgress";
import { FaGraduationCap } from "react-icons/fa";
import "./MyDict.css";

const MyDict = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dictionaries, setDictionaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDictionaries();
  }, []);

  const loadDictionaries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading dictionaries...');
      const data = await getUserDictionaries();
      console.log('Dictionaries loaded:', data?.length || 0);
      
      if (!data || !Array.isArray(data)) {
        console.error('Invalid data received:', data);
        setError("Ошибка: получены некорректные данные");
        setDictionaries([]);
        return;
      }
      
      // Сначала устанавливаем словари без прогресса для быстрой отрисовки
      const dictionariesWithoutProgress = data.map(dict => {
        // Получаем прогресс из localStorage сразу (быстро, синхронно)
        const progressKey = `dict_${dict.id}_progress`;
        const learnedWords = JSON.parse(localStorage.getItem(progressKey) || '[]');
        const progress = dict.word_count > 0 
          ? Math.round((learnedWords.length / dict.word_count) * 100)
          : 0;
        
        return {
          ...dict,
          learnedWordsCount: learnedWords.length,
          progress: Math.min(progress, 100)
        };
      });
      
      setDictionaries(dictionariesWithoutProgress);
      setLoading(false);
      
      // Затем загружаем прогресс с сервера асинхронно (не блокируя UI)
      loadProgressAsync(data);
    } catch (err) {
      console.error('Error loading dictionaries:', err);
      setError(err.message || "Ошибка при загрузке словарей");
      setDictionaries([]);
      setLoading(false);
    }
  };
  
  // Загружает прогресс асинхронно, не блокируя основной UI
  const loadProgressAsync = async (dictionaries) => {
    if (!dictionaries || dictionaries.length === 0) {
      return;
    }
    
    console.log('Loading progress async for', dictionaries.length, 'dictionaries');
    
    // Загружаем прогресс для каждого словаря параллельно, но с обработкой ошибок
    const progressPromises = dictionaries.map(async (dict) => {
      try {
        // Быстрый таймаут - 2 секунды
        const progressPromise = getProgress(
          dict.id,
          async (dictId) => {
            try {
              return await getLearningProgress(dictId);
            } catch (error) {
              console.warn(`Failed to get learning progress for dict ${dictId}:`, error);
              return { learned_words: [] };
            }
          }
        );
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        );
        
        const progressData = await Promise.race([progressPromise, timeoutPromise]);
        const learnedWords = Array.isArray(progressData) 
          ? progressData 
          : (progressData?.learned_words || []);
        
        // Сохраняем в localStorage для быстрого доступа
        const progressKey = `dict_${dict.id}_progress`;
        localStorage.setItem(progressKey, JSON.stringify(learnedWords));
        
        const progress = dict.word_count > 0 
          ? Math.round((learnedWords.length / dict.word_count) * 100)
          : 0;
        
        return {
          id: dict.id,
          learnedWordsCount: learnedWords.length,
          progress: Math.min(progress, 100)
        };
      } catch (error) {
        console.warn(`Failed to load progress for dictionary ${dict.id}:`, error);
        // Возвращаем null, чтобы не обновлять прогресс для этого словаря
        return null;
      }
    });
    
    // Ждем завершения всех загрузок прогресса (или таймаута)
    const progressResults = await Promise.allSettled(progressPromises);
    
    // Обновляем прогресс для словарей, которые успешно загрузились
    setDictionaries(prevDicts => {
      const progressMap = new Map();
      
      // Создаем карту прогресса по ID словаря
      progressResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value && dictionaries[index]) {
          progressMap.set(dictionaries[index].id, result.value);
        }
      });
      
      // Обновляем словари с загруженным прогрессом
      return prevDicts.map(dict => {
        const progress = progressMap.get(dict.id);
        if (progress) {
          return {
            ...dict,
            learnedWordsCount: progress.learnedWordsCount,
            progress: progress.progress
          };
        }
        return dict;
      });
    });
    
    console.log('Progress loading completed');
  };

  const handleDictionaryClick = (dictionaryId) => {
    navigate(`/dashboard/dictionary/${dictionaryId}`);
  };

  if (loading) {
    return (
      <div className="content_container">
        <div className="loading">{t("loading") || "Загрузка..."}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content_container">
        <div className="error_message">{error}</div>
      </div>
    );
  }

  return (
    <div className="content_container">
      <h1 className="page_title">{t("MyDict.title") || "Мои словари"}</h1>

      {dictionaries.length === 0 ? (
        <div className="empty_state">
          <p>{t("MyDict.empty") || "У вас пока нет словарей"}</p>
        </div>
      ) : (
        <div className="dictionaries_grid">
          {dictionaries.map((dict) => (
            <div 
              key={dict.id} 
              className="dictionary_card"
              onClick={() => handleDictionaryClick(dict.id)}
            >
              {dict.cover_image_url || dict.cover_image ? (
                <div className="card_image">
                  <img src={dict.cover_image_url || dict.cover_image} alt={dict.name} />
                </div>
              ) : null}
              <div className="card_content">
                <h3 className="card_title">{dict.name}</h3>
                {dict.description && (
                  <p className="card_description">{dict.description}</p>
                )}
                <div className="card_info">
                  <span className="lang_info">
                    {dict.source_lang} → {dict.target_lang}
                  </span>
                  {dict.is_for_sale && (
                    <span className="price_badge">${dict.price}</span>
                  )}
                </div>
                <div className="card_meta">
                  {dict.word_count !== undefined && (
                    <span className="word_count">
                      {dict.word_count} {t("MyDict.words") || "слов"}
                    </span>
                  )}
                  {dict.is_purchased ? (
                    <span className="purchased_badge">
                      {t("MyDict.purchased") || "Куплен"}
                    </span>
                  ) : dict.is_for_sale && dict.is_owner ? (
                    <span className="sale_badge">
                      {t("MyDict.on_sale") || "На продажу"}
                    </span>
                  ) : null}
                </div>
                
                {/* Прогресс изучения */}
                {dict.word_count > 0 && (
                  <div className="card_progress">
                    <div className="progress_header">
                      <div className="progress_info">
                        <FaGraduationCap className="progress_icon" />
                        <span className="progress_text">
                          {dict.learnedWordsCount || 0} / {dict.word_count} {t("MyDict.learned") || "изучено"}
                        </span>
                      </div>
                      <span className="progress_percentage">{dict.progress || 0}%</span>
                    </div>
                    <div className="progress_bar_container">
                      <div 
                        className="progress_bar_fill" 
                        style={{ width: `${dict.progress || 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDict;
