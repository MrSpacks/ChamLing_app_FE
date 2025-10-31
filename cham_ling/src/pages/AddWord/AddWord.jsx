import { useState } from "react";
import { useTranslation } from "react-i18next";
import { addWordToDictionary } from "../../api/auth";
import Button from "../../components/Buttons/Button";
import { FaTimes, FaLanguage } from "react-icons/fa";
import "./AddWord.css";

const AddWord = ({ dictionaryId, dictionary, onSuccess, onCancel }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    word: "",
    translation: "",
    image_url: "",
    example: "",
    image_file: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [useCustomImage, setUseCustomImage] = useState(false);
  const [imageSourceType, setImageSourceType] = useState("file"); // "file", "url", "camera"
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [translating, setTranslating] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    // Обработка чекбокса "использовать свое изображение"
    if (name === "use_custom_image") {
      setUseCustomImage(checked);
      if (!checked) {
        // Сбрасываем все изображения
        setFormData((prev) => ({
          ...prev,
          image_url: "",
          image_file: null,
        }));
        setImagePreview(null);
        setImageSourceType("file");
        // Очищаем ошибки
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.image_file;
          delete newErrors.image_url;
          return newErrors;
        });
      }
      return;
    }

    // Обработка типа источника изображения
    if (name === "image_source_type") {
      setImageSourceType(value);
      // Очищаем текущее изображение при смене типа
      setFormData((prev) => ({
        ...prev,
        image_url: "",
        image_file: null,
      }));
      setImagePreview(null);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.image_file;
        delete newErrors.image_url;
        return newErrors;
      });
      return;
    }

    // Обработка файла изображения
    if (type === "file" && files && files.length > 0) {
      const file = files[0];

      // Проверка типа файла
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          image_file: t("AddWord.errors.invalid_image_type") || "Выберите файл изображения",
        }));
        return;
      }

      // Проверка размера файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          image_file: t("AddWord.errors.image_too_large") || "Размер файла не должен превышать 5MB",
        }));
        return;
      }

      // Создаем preview и конвертируем в data URL для отправки
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        // Конвертируем файл в data URL для отправки как image_url
        setFormData((prev) => ({
          ...prev,
          image_file: file,
          image_url: reader.result, // Используем data URL
        }));
      };
      reader.readAsDataURL(file);

      // Очищаем ошибку
      if (errors.image_file) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.image_file;
          return newErrors;
        });
      }
      return;
    }

    // Обычная обработка полей
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Если вводим URL - создаем preview
    if (name === "image_url" && value) {
      setFormData((prev) => ({
        ...prev,
        image_file: null, // Очищаем файл
      }));
      setImagePreview(value);
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "word":
        if (!value.trim()) {
          newErrors.word = t("AddWord.errors.word_required") || "Слово обязательно";
        } else {
          delete newErrors.word;
        }
        break;
      case "translation":
        if (!value.trim()) {
          newErrors.translation =
            t("AddWord.errors.translation_required") || "Перевод обязателен";
        } else {
          delete newErrors.translation;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.word.trim()) {
      newErrors.word = t("AddWord.errors.word_required") || "Слово обязательно";
    }

    if (!formData.translation.trim()) {
      newErrors.translation =
        t("AddWord.errors.translation_required") || "Перевод обязателен";
    }

    setTouched({
      word: true,
      translation: true,
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Функция для конвертации кода языка в формат API
  const getLanguageCode = (lang) => {
    const langMap = {
      'en': 'en',
      'ru': 'ru',
      'es': 'es',
      'fr': 'fr',
      'de': 'de',
      'it': 'it',
      'pt': 'pt',
      'pl': 'pl',
      'uk': 'uk',
      'cs': 'cs',
      'sk': 'sk',
      'zh': 'zh',
      'ja': 'ja',
      'ko': 'ko',
      'ar': 'ar',
      'tr': 'tr',
      'nl': 'nl',
      'sv': 'sv',
      'no': 'no',
      'da': 'da',
      'fi': 'fi',
      'he': 'he',
      'hi': 'hi',
      'th': 'th',
      'vi': 'vi',
      'id': 'id',
      'ms': 'ms',
    };
    return langMap[lang?.toLowerCase()] || lang?.toLowerCase() || 'en';
  };

  // Функция автоматического перевода
  const handleAutoTranslate = async () => {
    if (!formData.word.trim()) {
      setErrors((prev) => ({
        ...prev,
        word: t("AddWord.errors.word_required") || "Слово обязательно",
      }));
      setTouched((prev) => ({ ...prev, word: true }));
      return;
    }

    if (!dictionary?.source_lang || !dictionary?.target_lang) {
      setErrors((prev) => ({
        ...prev,
        submit: t("AddWord.errors.no_languages") || "Информация о языках словаря недоступна",
      }));
      return;
    }

    setTranslating(true);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.translation;
      delete newErrors.submit;
      return newErrors;
    });

    try {
      const sourceLang = getLanguageCode(dictionary.source_lang);
      const targetLang = getLanguageCode(dictionary.target_lang);

      // Используем MyMemory API (бесплатный, не требует ключа для небольших запросов)
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          formData.word.trim()
        )}&langpair=${sourceLang}|${targetLang}`
      );

      if (!response.ok) {
        throw new Error("Ошибка при запросе перевода");
      }

      const data = await response.json();

      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translatedText = data.responseData.translatedText.trim();
        if (translatedText && translatedText !== formData.word.trim()) {
          setFormData((prev) => ({
            ...prev,
            translation: translatedText,
          }));
          // Очищаем ошибку перевода, если она была
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.translation;
            return newErrors;
          });
          setTouched((prev) => ({ ...prev, translation: true }));
        } else {
          setErrors((prev) => ({
            ...prev,
            translation: t("AddWord.errors.translation_failed") || "Не удалось получить перевод",
          }));
        }
      } else {
        throw new Error("Неверный формат ответа от API перевода");
      }
    } catch (err) {
      console.error("Translation error:", err);
      setErrors((prev) => ({
        ...prev,
        translation: t("AddWord.errors.translation_failed") || "Ошибка при переводе. Попробуйте еще раз.",
      }));
    } finally {
      setTranslating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitSuccess(false);

    if (!validate()) {
      setLoading(false);
      return;
    }

    try {
      // Подготавливаем данные для отправки
      const wordData = {
        word: formData.word.trim(),
        translation: formData.translation.trim(),
      };
      
      // Добавляем example только если он не пустой
      const exampleValue = formData.example.trim();
      if (exampleValue) {
        wordData.example = exampleValue;
      }
      
      // Добавляем image_url только если используется пользовательское изображение и оно не пустое
      if (useCustomImage && formData.image_url && formData.image_url.trim()) {
        const imageUrlValue = formData.image_url.trim();
        // Если это data URL и слишком большой (> 2MB), не отправляем его
        if (imageUrlValue.startsWith('data:image/')) {
          // Проверяем размер data URL (примерная оценка)
          const base64Length = imageUrlValue.split(',')[1]?.length || 0;
          const estimatedSize = (base64Length * 3) / 4; // Примерный размер в байтах
          if (estimatedSize > 2 * 1024 * 1024) { // 2MB
            setErrors({
              submit: t("AddWord.errors.image_too_large") || "Изображение слишком большое (максимум 2MB)",
            });
            setLoading(false);
            return;
          }
        }
        wordData.image_url = imageUrlValue;
      }

      const response = await addWordToDictionary(dictionaryId, wordData);
      const data = await response.json();

      if (!response.ok) {
        const serverErrors = {};
        let generalError = null;

        if (data.word) {
          serverErrors.word = Array.isArray(data.word)
            ? data.word.join(", ")
            : data.word;
        }
        if (data.translation) {
          serverErrors.translation = Array.isArray(data.translation)
            ? data.translation.join(", ")
            : data.translation;
        }

        if (data.detail) {
          generalError = Array.isArray(data.detail)
            ? data.detail.join(", ")
            : data.detail;
        }

        if (Object.keys(serverErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...serverErrors }));
          Object.keys(serverErrors).forEach((field) => {
            setTouched((prev) => ({ ...prev, [field]: true }));
          });
        }

        if (generalError) {
          setErrors((prev) => ({ ...prev, submit: generalError }));
        }

        setLoading(false);
        return;
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setFormData({
          word: "",
          translation: "",
          image_url: "",
          example: "",
          image_file: null,
        });
        setImagePreview(null);
        setUseCustomImage(false);
        setImageSourceType("file");
        setErrors({});
        setTouched({});
        setSubmitSuccess(false);
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error("Error adding word:", err);
      setErrors({
        submit:
          err.message ||
          t("AddWord.error_network") ||
          "Ошибка при добавлении слова",
      });
      setLoading(false);
    }
  };

  return (
    <div className="content_container">
      <div className="form_header">
        <h1 className="page_title">{t("AddWord.title") || "Добавить слово"}</h1>
        <button className="close_button" onClick={onCancel}>
          <FaTimes />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="add_word_form">
        <div className="form_group">
          <label htmlFor="word">
            {t("AddWord.form.word") || "Слово"} *
          </label>
          <input
            type="text"
            id="word"
            name="word"
            value={formData.word}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t("AddWord.placeholders.word") || "Введите слово"}
            className={`${errors.word ? "input_error" : ""} ${
              touched.word && !errors.word && formData.word ? "input_valid" : ""
            }`}
            disabled={loading}
          />
          {errors.word && <span className="error_text">{errors.word}</span>}
        </div>

        <div className="form_group">
          <label htmlFor="translation">
            {t("AddWord.form.translation") || "Перевод"} *
          </label>
          <div className="translation_input_wrapper">
            <input
              type="text"
              id="translation"
              name="translation"
              value={formData.translation}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={t("AddWord.placeholders.translation") || "Введите перевод"}
              className={`${errors.translation ? "input_error" : ""} ${
                touched.translation &&
                !errors.translation &&
                formData.translation
                  ? "input_valid"
                  : ""
              }`}
              disabled={loading || translating}
            />
            {dictionary?.source_lang && dictionary?.target_lang && (
              <button
                type="button"
                onClick={handleAutoTranslate}
                disabled={loading || translating || !formData.word.trim()}
                className="translate_button"
                title={t("AddWord.translate_tooltip") || "Автоматический перевод"}
              >
                <FaLanguage />
                {translating ? (
                  <span className="translate_button_text">
                    {t("AddWord.translating") || "Перевод..."}
                  </span>
                ) : (
                  <span className="translate_button_text">
                    {t("AddWord.translate") || "Перевести"}
                  </span>
                )}
              </button>
            )}
          </div>
          {errors.translation && (
            <span className="error_text">{errors.translation}</span>
          )}
        </div>

        <div className="form_group">
          <div className="checkbox_group">
            <label>
              <input
                type="checkbox"
                name="use_custom_image"
                checked={useCustomImage}
                onChange={handleChange}
                disabled={loading}
              />
              {t("AddWord.form.use_custom_image") || "Добавить свое изображение"}
            </label>
          </div>

          {useCustomImage && (
            <div className="image_source_options">
              <div className="image_source_selector">
                <label>
                  <input
                    type="radio"
                    name="image_source_type"
                    value="file"
                    checked={imageSourceType === "file"}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {t("AddWord.form.image_from_device") || "С устройства"}
                </label>
                <label>
                  <input
                    type="radio"
                    name="image_source_type"
                    value="url"
                    checked={imageSourceType === "url"}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {t("AddWord.form.image_from_url") || "По ссылке"}
                </label>
                <label>
                  <input
                    type="radio"
                    name="image_source_type"
                    value="camera"
                    checked={imageSourceType === "camera"}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {t("AddWord.form.image_from_camera") || "Сделать фото"}
                </label>
              </div>

              {imageSourceType === "file" && (
                <div className="image_input_group">
                  <input
                    type="file"
                    id="image_file"
                    name="image_file"
                    accept="image/*"
                    onChange={handleChange}
                    disabled={loading}
                    className={
                      errors.image_file ? "input_error" : formData.image_file ? "input_valid" : ""
                    }
                  />
                  {errors.image_file && (
                    <span className="error_text">{errors.image_file}</span>
                  )}
                </div>
              )}

              {imageSourceType === "url" && (
                <div className="image_input_group">
                  <input
                    type="url"
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t("AddWord.placeholders.image_url") || "https://example.com/image.jpg"}
                    className={
                      errors.image_url ? "input_error" : touched.image_url && !errors.image_url && formData.image_url ? "input_valid" : ""
                    }
                    disabled={loading}
                  />
                  {errors.image_url && (
                    <span className="error_text">{errors.image_url}</span>
                  )}
                </div>
              )}

              {imageSourceType === "camera" && (
                <div className="image_input_group">
                  <input
                    type="file"
                    id="image_camera"
                    name="image_file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleChange}
                    disabled={loading}
                    className={
                      errors.image_file ? "input_error" : formData.image_file ? "input_valid" : ""
                    }
                  />
                  {errors.image_file && (
                    <span className="error_text">{errors.image_file}</span>
                  )}
                  <small className="form_hint">
                    {t("AddWord.hints.camera") || "Нажмите чтобы открыть камеру и сделать фото"}
                  </small>
                </div>
              )}

              {imagePreview && (
                <div className="image_preview">
                  <img src={imagePreview} alt="Preview" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
            </div>
          )}

          {!useCustomImage && (
            <small className="form_hint">
              {t("AddWord.hints.image_url_auto") ||
                "Если не указано, изображение будет подобрано автоматически"}
            </small>
          )}
        </div>

        <div className="form_group">
          <label htmlFor="example">
            {t("AddWord.form.example") || "Пример использования"}
          </label>
          <textarea
            id="example"
            name="example"
            value={formData.example}
            onChange={handleChange}
            rows="3"
            placeholder={t("AddWord.placeholders.example") || "Пример предложения с этим словом"}
            disabled={loading}
          />
        </div>

        {submitSuccess && (
          <div className="success_message">
            <span className="success_icon">✓</span>
            {t("AddWord.success") || "Слово успешно добавлено!"}
          </div>
        )}

        {errors.submit && (
          <div className="error_message_submit">{errors.submit}</div>
        )}

        <div className="form_actions">
          <Button
            type="button"
            text={t("AddWord.cancel") || "Отмена"}
            onClick={onCancel}
            disabled={loading}
          />
          <Button
            type="submit"
            text={
              loading
                ? t("loading") || "Добавление..."
                : t("AddWord.add") || "Добавить слово"
            }
            disabled={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default AddWord;

