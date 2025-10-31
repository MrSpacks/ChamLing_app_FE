import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getUserDictionaries } from "../../api/auth";
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
      const data = await getUserDictionaries();
      // Добавляем прогресс изучения для каждого словаря
      const dictionariesWithProgress = data.map(dict => {
        const progressKey = `dict_${dict.id}_progress`;
        const learnedWords = JSON.parse(localStorage.getItem(progressKey) || '[]');
        const progress = dict.word_count > 0 
          ? Math.round((learnedWords.length / dict.word_count) * 100)
          : 0;
        
        return {
          ...dict,
          learnedWordsCount: learnedWords.length,
          progress: Math.min(progress, 100) // Ограничиваем до 100%
        };
      });
      
      setDictionaries(dictionariesWithProgress);
      setError(null);
    } catch (err) {
      setError(err.message);
      setDictionaries([]);
    } finally {
      setLoading(false);
    }
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
