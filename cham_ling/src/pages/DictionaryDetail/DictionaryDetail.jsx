import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getDictionaryDetails,
  deleteDictionary,
  getDictionaryWords,
} from "../../api/auth";
import EditDict from "../EditDict/EditDict";
import AddWord from "../AddWord/AddWord";
import LearnWords from "../LearnWords/LearnWords";
import { 
  FaEdit, 
  FaPlus, 
  FaTrash, 
  FaGraduationCap, 
  FaArrowLeft,
  FaVolumeUp
} from "react-icons/fa";
import { speakWord } from "../../utils/textToSpeech";
import "./DictionaryDetail.css";

const DictionaryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [dictionary, setDictionary] = useState(null);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddWordForm, setShowAddWordForm] = useState(false);
  const [showLearnMode, setShowLearnMode] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDictionary();
    loadWords();
  }, [id]);

  const loadDictionary = async () => {
    try {
      setLoading(true);
      const data = await getDictionaryDetails(id);
      setDictionary(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadWords = async () => {
    try {
      const data = await getDictionaryWords(id);
      setWords(data);
    } catch (err) {
      console.error("Error loading words:", err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("DictionaryDetail.confirm_delete") || "Вы уверены, что хотите удалить этот словарь?")) {
      return;
    }

    try {
      setDeleting(true);
      await deleteDictionary(id);
      navigate("/dashboard/my-dict");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    loadDictionary();
  };

  const handleAddWordSuccess = () => {
    setShowAddWordForm(false);
    loadWords();
    loadDictionary(); // Обновляем количество слов
  };

  if (loading) {
    return (
      <div className="content_container">
        <div className="loading">{t("loading") || "Загрузка..."}</div>
      </div>
    );
  }

  if (error && !dictionary) {
    return (
      <div className="content_container">
        <div className="error_message">{error}</div>
        <button
          onClick={() => navigate("/dashboard/my-dict")}
          className="action_button"
        >
          {t("DictionaryDetail.back") || "Назад"}
        </button>
      </div>
    );
  }

  if (showEditForm && dictionary) {
    return (
      <EditDict
        dictionary={dictionary}
        onSuccess={handleEditSuccess}
        onCancel={() => setShowEditForm(false)}
      />
    );
  }

  if (showAddWordForm && dictionary) {
    return (
      <AddWord
        dictionaryId={id}
        dictionary={dictionary}
        onSuccess={handleAddWordSuccess}
        onCancel={() => setShowAddWordForm(false)}
      />
    );
  }

  if (showLearnMode && dictionary) {
    return (
      <LearnWords
        dictionary={dictionary}
        words={words}
        onBack={() => setShowLearnMode(false)}
      />
    );
  }

  const isOwner = dictionary?.is_owner;

  return (
    <div className="dictionary_detail_wrapper">
      {/* Боковая панель для десктопа */}
      <div className="dictionary_sidebar_desktop">
        <button 
          className="nav_button back_button_desktop" 
          onClick={() => navigate("/dashboard/my-dict")}
          title={t("DictionaryDetail.back") || "Назад"}
        >
          <FaArrowLeft />
        </button>
        
        <button
          onClick={() => setShowLearnMode(true)}
          className="nav_button learn_button_desktop"
          title={t("DictionaryDetail.learn_words") || "Учить слова"}
        >
          <FaGraduationCap />
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="nav_button delete_button_desktop"
          title={t("DictionaryDetail.delete") || "Удалить словарь"}
        >
          <FaTrash />
        </button>

        {isOwner && (
          <>
            <button
              onClick={() => setShowEditForm(true)}
              className="nav_button edit_button_desktop"
              title={t("DictionaryDetail.edit") || "Редактировать словарь"}
            >
              <FaEdit />
            </button>

            <button
              onClick={() => setShowAddWordForm(true)}
              className="nav_button add_word_button_desktop"
              title={t("DictionaryDetail.add_word") || "Добавить слово"}
            >
              <FaPlus />
            </button>
          </>
        )}
      </div>

      {/* Основной контент */}
      <div className="dictionary_content">
        {dictionary && (
          <>
            <div className="dictionary_header">
              {dictionary.cover_image_url && (
                <div className="dictionary_cover">
                  <img src={dictionary.cover_image_url} alt={dictionary.name} />
                </div>
              )}
              <div className="dictionary_info">
                <h1 className="dictionary_title">{dictionary.name}</h1>
                {dictionary.description && (
                  <p className="dictionary_description">{dictionary.description}</p>
                )}
                <div className="dictionary_meta">
                  <span className="lang_info">
                    {dictionary.source_lang} → {dictionary.target_lang}
                  </span>
                  {dictionary.word_count !== undefined && (
                    <span className="word_count_info">
                      {dictionary.word_count} {t("DictionaryDetail.words") || "слов"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Список слов */}
            <div className="words_section">
              <h2 className="section_title">
                {t("DictionaryDetail.words_list") || "Слова в словаре"}
              </h2>
              {words.length === 0 ? (
                <div className="empty_state">
                  <p>{t("DictionaryDetail.no_words") || "В словаре пока нет слов"}</p>
                {isOwner && (
                  <button
                    onClick={() => setShowAddWordForm(true)}
                    className="add_first_word_button"
                  >
                    <FaPlus /> {t("DictionaryDetail.add_first_word") || "Добавить первое слово"}
                  </button>
                )}
                </div>
              ) : (
                <div className="words_grid">
                  {words.map((word) => (
                    <div key={word.id} className="word_card">
                      {word.image_url && (
                        <div className="word_image">
                          <img src={word.image_url} alt={word.word} />
                        </div>
                      )}
                      <div className="word_content">
                        <div className="word_header">
                          <h3 className="word_text">{word.word}</h3>
                          <button 
                            className="speak_button"
                            onClick={() => speakWord(word.word, dictionary.source_lang)}
                            title={t("DictionaryDetail.speak_word") || "Произнести слово"}
                            aria-label={t("DictionaryDetail.speak_word") || "Произнести слово"}
                          >
                            <FaVolumeUp />
                          </button>
                        </div>
                        <p className="word_translation">{word.translation}</p>
                        {word.example && (
                          <p className="word_example">{word.example}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Нижняя панель для мобильного */}
      <div className="dictionary_sidebar_mobile">
        <button 
          className="nav_button_mobile back_button_mobile" 
          onClick={() => navigate("/dashboard/my-dict")}
        >
          <FaArrowLeft />
        </button>
        
        <button
          onClick={() => setShowLearnMode(true)}
          className="nav_button_mobile learn_button_mobile"
        >
          <FaGraduationCap />
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="nav_button_mobile delete_button_mobile"
        >
          <FaTrash />
        </button>

        {isOwner && (
          <>
            <button
              onClick={() => setShowEditForm(true)}
              className="nav_button_mobile edit_button_mobile"
            >
              <FaEdit />
            </button>

            <button
              onClick={() => setShowAddWordForm(true)}
              className="nav_button_mobile add_word_button_mobile"
            >
              <FaPlus />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DictionaryDetail;

