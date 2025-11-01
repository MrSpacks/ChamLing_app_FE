import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaImage, FaSearch } from "react-icons/fa";
import { getMarketplaceDictionaries } from "../../api/auth";
import PurchaseModal from "../../components/PurchaseModal/PurchaseModal";
import "./BuyDict.css";

const BuyDict = () => {
  const { t } = useTranslation();
  const [dictionaries, setDictionaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDictionary, setSelectedDictionary] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceLangFilter, setSourceLangFilter] = useState("");
  const [targetLangFilter, setTargetLangFilter] = useState("");

  useEffect(() => {
    loadDictionaries();
  }, []);

  const loadDictionaries = async () => {
    try {
      setLoading(true);
      const data = await getMarketplaceDictionaries();
      setDictionaries(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setDictionaries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = (dict) => {
    setSelectedDictionary(dict);
    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = () => {
    setShowPurchaseModal(false);
    setSelectedDictionary(null);
    // Можно показать уведомление об успешной покупке
    alert(t("BuyDict.purchase_success") || "Словарь успешно куплен!");
    // Обновляем список словарей
    loadDictionaries();
  };

  const handlePurchaseCancel = () => {
    setShowPurchaseModal(false);
    setSelectedDictionary(null);
  };

  // Получаем уникальные языки для фильтров
  const availableLanguages = useMemo(() => {
    const sourceLangs = [...new Set(dictionaries.map(dict => dict.source_lang).filter(Boolean))].sort();
    const targetLangs = [...new Set(dictionaries.map(dict => dict.target_lang).filter(Boolean))].sort();
    return { sourceLangs, targetLangs };
  }, [dictionaries]);

  // Фильтруем словари
  const filteredDictionaries = useMemo(() => {
    return dictionaries.filter(dict => {
      // Фильтр по названию
      const matchesSearch = !searchTerm || 
        dict.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dict.description && dict.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Фильтр по исходному языку
      const matchesSourceLang = !sourceLangFilter || dict.source_lang === sourceLangFilter;
      
      // Фильтр по языку перевода
      const matchesTargetLang = !targetLangFilter || dict.target_lang === targetLangFilter;
      
      return matchesSearch && matchesSourceLang && matchesTargetLang;
    });
  }, [dictionaries, searchTerm, sourceLangFilter, targetLangFilter]);

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
      <h1 className="page_title">{t("BuyDict.title") || "Магазин словарей"}</h1>

      {/* Поиск и фильтры */}
      {dictionaries.length > 0 && (
        <div className="search_filters_container">
          {/* Поиск по названию */}
          <div className="search_input_wrapper">
            <FaSearch className="search_icon" />
            <input
              type="text"
              className="search_input"
              placeholder={t("BuyDict.search_placeholder") || "Поиск по названию..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Фильтр по языкам */}
          <div className="filters_row">
            <div className="filter_group">
              <label className="filter_label">
                {t("BuyDict.source_lang") || "Исходный язык"}
              </label>
              <select
                className="filter_select"
                value={sourceLangFilter}
                onChange={(e) => setSourceLangFilter(e.target.value)}
              >
                <option value="">{t("BuyDict.all_languages") || "Все языки"}</option>
                {availableLanguages.sourceLangs.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div className="filter_group">
              <label className="filter_label">
                {t("BuyDict.target_lang") || "Язык перевода"}
              </label>
              <select
                className="filter_select"
                value={targetLangFilter}
                onChange={(e) => setTargetLangFilter(e.target.value)}
              >
                <option value="">{t("BuyDict.all_languages") || "Все языки"}</option>
                {availableLanguages.targetLangs.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Показать количество результатов */}
          {filteredDictionaries.length !== dictionaries.length && (
            <div className="results_count">
              {t("BuyDict.results_count") || "Найдено:"} {filteredDictionaries.length} {t("BuyDict.of") || "из"} {dictionaries.length}
            </div>
          )}
        </div>
      )}

      {dictionaries.length === 0 ? (
        <div className="empty_state">
          <p>{t("BuyDict.empty") || "Пока нет словарей на продажу"}</p>
        </div>
      ) : filteredDictionaries.length === 0 ? (
        <div className="empty_state">
          <p>{t("BuyDict.no_results") || "Ничего не найдено"}</p>
        </div>
      ) : (
        <div className="dictionaries_grid">
          {filteredDictionaries.map((dict) => (
            <div key={dict.id} className="dictionary_card">
              {(dict.cover_image || dict.cover_image_url) && (
                <div className="card_image">
                  <img src={dict.cover_image_url || dict.cover_image} alt={dict.name} />
                </div>
              )}
              <div className="card_content">
                <div className="card_header">
                  <h3 className="card_title">{dict.name}</h3>
                  {(dict.cover_image_url || dict.cover_image) && (
                    <div className="image_icon">
                      <FaImage title={t("BuyDict.has_image") || "Has image"} />
                    </div>
                  )}
                </div>
                {dict.description && (
                  <p className="card_description">{dict.description}</p>
                )}
                <div className="card_info">
                  <span className="lang_info">
                    {dict.source_lang} → {dict.target_lang}
                  </span>
                  <span className="price_badge">${dict.price}</span>
                </div>
                <div className="card_meta">
                  {dict.word_count !== undefined && (
                    <span className="word_count">
                      {dict.word_count} {t("BuyDict.words") || "слов"}
                    </span>
                  )}
                  {dict.allow_temporary_access && (
                    <div className="temp_access_info">
                      {t("BuyDict.temp_access") || "Временный доступ доступен"}
                    </div>
                  )}
                </div>
                {dict.is_owner ? (
                  <div className="owner_message">
                    {t("BuyDict.owner_message") || "Вы автор этого словаря"}
                  </div>
                ) : (
                  <button
                    className="buy_button"
                    onClick={() => handleBuy(dict)}
                  >
                    {t("BuyDict.buy") || "Купить"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showPurchaseModal && selectedDictionary && (
        <PurchaseModal
          dictionary={selectedDictionary}
          onSuccess={handlePurchaseSuccess}
          onCancel={handlePurchaseCancel}
        />
      )}
    </div>
  );
};

export default BuyDict;
