import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { updateDictionary } from "../../api/auth";
import Button from "../../components/Buttons/Button";
import { FaTimes } from "react-icons/fa";
import "./EditDict.css";

const EditDict = ({ dictionary, onSuccess, onCancel }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: dictionary?.name || "",
    description: dictionary?.description || "",
    source_lang: dictionary?.source_lang || "",
    target_lang: dictionary?.target_lang || "",
    is_for_sale: dictionary?.is_for_sale || false,
    price: dictionary?.price || 0.5,
    allow_temporary_access: dictionary?.allow_temporary_access || false,
    temporary_days: dictionary?.temporary_days || 7,
    cover_image: "",
    cover_image_file: null,
  });

  const [imagePreview, setImagePreview] = useState(
    dictionary?.cover_image_url || dictionary?.cover_image || null
  );
  const [useCustomImage, setUseCustomImage] = useState(
    !!(dictionary?.cover_image_url || dictionary?.cover_image)
  );
  const [imageSourceType, setImageSourceType] = useState("file"); // "file", "url", "camera"
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const languages = [
    { code: "en", name: t("languages.en") },
    { code: "es", name: t("languages.es") },
    { code: "fr", name: t("languages.fr") },
    { code: "de", name: t("languages.de") },
    { code: "ru", name: t("languages.ru") },
    { code: "zh", name: t("languages.zh") },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    // Обработка чекбокса "использовать свое изображение"
    if (name === "use_custom_image") {
      setUseCustomImage(checked);
      if (!checked) {
        // Сбрасываем все изображения
        setFormData((prev) => ({
          ...prev,
          cover_image: "",
          cover_image_file: null,
        }));
        setImagePreview(null);
        setImageSourceType("file");
        // Очищаем ошибки
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.cover_image_file;
          delete newErrors.cover_image;
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
        cover_image: "",
        cover_image_file: null,
      }));
      setImagePreview(null);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.cover_image_file;
        delete newErrors.cover_image;
        return newErrors;
      });
      return;
    }

    // Обработка файла изображения
    if (type === "file" && files && files.length > 0) {
      const file = files[0];

      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          cover_image_file:
            t("AddDict.errors.invalid_image_type") ||
            "Выберите файл изображения",
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          cover_image_file:
            t("AddDict.errors.image_too_large") ||
            "Размер файла не должен превышать 5MB",
        }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      setFormData((prev) => ({
        ...prev,
        cover_image_file: file,
        cover_image: "",
      }));

      if (errors.cover_image_file) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.cover_image_file;
          return newErrors;
        });
      }
      return;
    }

    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: newValue,
      };

      if (name === "is_for_sale" && !newValue) {
        updated.allow_temporary_access = false;
      }

      if (name === "allow_temporary_access" && !newValue) {
        updated.temporary_days = 7;
      }

      // Если вводим URL - очищаем файл и создаем preview
      if (name === "cover_image" && newValue) {
        updated.cover_image_file = null;
        setImagePreview(newValue);
      }

      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t("AddDict.errors.title_required");
    } else if (formData.name.trim().length < 3) {
      newErrors.name =
        t("AddDict.errors.title_min_length") ||
        "Название должно быть не менее 3 символов";
    }

    if (!formData.source_lang) {
      newErrors.source_lang = t("AddDict.errors.source_lang_required");
    }

    if (!formData.target_lang) {
      newErrors.target_lang = t("AddDict.errors.target_lang_required");
    } else if (
      formData.source_lang === formData.target_lang &&
      formData.source_lang
    ) {
      newErrors.target_lang = t("AddDict.errors.langs_must_differ");
    }

    if (formData.is_for_sale) {
      if (!formData.description.trim()) {
        newErrors.description =
          t("AddDict.errors.description_required") ||
          "Описание обязательно для словаря на продажу";
      }

      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum < 0.5) {
        newErrors.price = t("AddDict.errors.min_price");
      }

      if (formData.allow_temporary_access) {
        const daysNum = parseInt(formData.temporary_days);
        if (isNaN(daysNum) || daysNum < 1) {
          newErrors.temporary_days = t("AddDict.errors.days_positive");
        }
      }
    }

    setTouched({
      name: true,
      description: formData.is_for_sale,
      source_lang: true,
      target_lang: true,
      price: formData.is_for_sale,
      temporary_days: formData.allow_temporary_access,
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitSuccess(false);

    if (!validate()) {
      setLoading(false);
      return;
    }

    let payload;
    let isFormData = false;

    if (formData.cover_image_file) {
      // Создаем FormData для отправки файла
      payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("description", formData.description.trim());
      payload.append("source_lang", formData.source_lang);
      payload.append("target_lang", formData.target_lang);
      payload.append("price", formData.is_for_sale ? parseFloat(formData.price) : 0.0);
      payload.append("is_for_sale", formData.is_for_sale);
      payload.append(
        "allow_temporary_access",
        formData.allow_temporary_access
      );
      if (formData.allow_temporary_access) {
        payload.append("temporary_days", parseInt(formData.temporary_days));
      }
      payload.append("cover_image_file", formData.cover_image_file);
      isFormData = true;
    } else {
      // Отправляем JSON
      payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        source_lang: formData.source_lang,
        target_lang: formData.target_lang,
        price: formData.is_for_sale ? parseFloat(formData.price) : 0.0,
        is_for_sale: formData.is_for_sale,
        allow_temporary_access: formData.allow_temporary_access,
      };
      
      // Добавляем temporary_days только если allow_temporary_access = true
      if (formData.allow_temporary_access) {
        payload.temporary_days = parseInt(formData.temporary_days);
      }
      
      // Добавляем cover_image только если пользователь явно указал новый URL
      // Если useCustomImage false или cover_image пустой, не отправляем поле вообще
      if (useCustomImage && formData.cover_image && formData.cover_image.trim()) {
        payload.cover_image = formData.cover_image.trim();
      }
      // Если useCustomImage false и нет файла, не отправляем cover_image вообще
      // Бэкенд сам решит, что делать с изображением
    }

    try {
      const response = await updateDictionary(dictionary.id, payload, isFormData);
      const data = await response.json();

      if (!response.ok) {
        const serverErrors = {};
        let generalError = null;

        if (data.name) {
          serverErrors.name = Array.isArray(data.name)
            ? data.name.join(", ")
            : data.name;
        }
        if (data.description) {
          serverErrors.description = Array.isArray(data.description)
            ? data.description.join(", ")
            : data.description;
        }

        if (data.non_field_errors) {
          const nonFieldErrors = Array.isArray(data.non_field_errors)
            ? data.non_field_errors.join(", ")
            : data.non_field_errors;

          const nonFieldErrorsLower = nonFieldErrors.toLowerCase();
          if (
            nonFieldErrorsLower.includes("описание") ||
            nonFieldErrorsLower.includes("description")
          ) {
            serverErrors.description = nonFieldErrors;
          } else {
            generalError = nonFieldErrors;
          }
        } else if (data.detail) {
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
        } else if (Object.keys(serverErrors).length === 0) {
          setErrors((prev) => ({
            ...prev,
            submit: t("AddDict.error_network") || "Ошибка при обновлении словаря",
          }));
        }

        setLoading(false);
        return;
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error("Error updating dictionary:", err);
      setErrors({
        submit:
          err.message ||
          t("AddDict.error_network") ||
          "Ошибка при обновлении словаря",
      });
      setLoading(false);
    }
  };

  return (
    <div className="content_container">
      <div className="form_header">
        <h1 className="page_title">
          {t("EditDict.title") || "Редактировать словарь"}
        </h1>
        <button className="close_button" onClick={onCancel}>
          <FaTimes />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="add_dict_form">
        {/* Копируем структуру из AddDict */}
        <div className="add_dict_form_part1">
          <div className="form_group">
            <label htmlFor="name">{t("AddDict.form.title")}</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={t("AddDict.placeholders.title")}
              className={`${errors.name ? "input_error" : ""} ${
                touched.name && !errors.name && formData.name ? "input_valid" : ""
              }`}
              maxLength={100}
              disabled={loading}
            />
            {touched.name && formData.name && (
              <small className="char_count">{formData.name.length}/100</small>
            )}
            {errors.name && <span className="error_text">{errors.name}</span>}
          </div>

          <div className="form_group">
            <label htmlFor="description">
              {t("AddDict.form.description")}
              {formData.is_for_sale && (
                <span className="required_indicator"> *</span>
              )}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              rows="3"
              placeholder={t("AddDict.placeholders.description")}
              className={`${errors.description ? "input_error" : ""} ${
                touched.description &&
                !errors.description &&
                formData.description
                  ? "input_valid"
                  : ""
              }`}
              disabled={loading}
            />
            {errors.description && (
              <span className="error_text">{errors.description}</span>
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
                {t("AddDict.form.use_custom_image") || "Добавить свое изображение"}
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
                    {t("AddDict.form.image_from_device") || "С устройства"}
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
                    {t("AddDict.form.image_from_url") || "По ссылке"}
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
                    {t("AddDict.form.image_from_camera") || "Сделать фото"}
                  </label>
                </div>

                {imageSourceType === "file" && (
                  <div className="image_input_group">
                    <input
                      type="file"
                      id="cover_image_file"
                      name="cover_image_file"
                      accept="image/*"
                      onChange={handleChange}
                      disabled={loading}
                      className={
                        errors.cover_image_file
                          ? "input_error"
                          : formData.cover_image_file
                          ? "input_valid"
                          : ""
                      }
                    />
                    {errors.cover_image_file && (
                      <span className="error_text">{errors.cover_image_file}</span>
                    )}
                  </div>
                )}

                {imageSourceType === "url" && (
                  <div className="image_input_group">
                    <input
                      type="url"
                      id="cover_image"
                      name="cover_image"
                      value={formData.cover_image}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder={t("AddDict.placeholders.cover_image") || "https://example.com/image.jpg"}
                      className={
                        errors.cover_image ? "input_error" : touched.cover_image && !errors.cover_image && formData.cover_image ? "input_valid" : ""
                      }
                      disabled={loading}
                    />
                    {errors.cover_image && (
                      <span className="error_text">{errors.cover_image}</span>
                    )}
                  </div>
                )}

                {imageSourceType === "camera" && (
                  <div className="image_input_group">
                    <input
                      type="file"
                      id="cover_image_camera"
                      name="cover_image_file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleChange}
                      disabled={loading}
                      className={
                        errors.cover_image_file
                          ? "input_error"
                          : formData.cover_image_file
                          ? "input_valid"
                          : ""
                      }
                    />
                    {errors.cover_image_file && (
                      <span className="error_text">{errors.cover_image_file}</span>
                    )}
                    <small className="form_hint">
                      {t("AddDict.hints.camera") || "Нажмите чтобы открыть камеру и сделать фото"}
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
                {t("AddDict.hints.cover_image_auto") || "Если не указано, изображение будет подобрано автоматически"}
              </small>
            )}
          </div>
        </div>

        <div className="add_dict_form_part2">
          <div className="form_row">
            <div className="form_group half">
              <label htmlFor="source_lang">
                {t("AddDict.form.source_lang")}
              </label>
              <select
                id="source_lang"
                name="source_lang"
                value={formData.source_lang}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${errors.source_lang ? "input_error" : ""} ${
                  touched.source_lang &&
                  !errors.source_lang &&
                  formData.source_lang
                    ? "input_valid"
                    : ""
                }`}
                disabled={loading}
              >
                <option value="">{t("AddDict.select_lang")}</option>
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              {errors.source_lang && (
                <span className="error_text">{errors.source_lang}</span>
              )}
            </div>

            <div className="form_group half">
              <label htmlFor="target_lang">
                {t("AddDict.form.target_lang")}
              </label>
              <select
                id="target_lang"
                name="target_lang"
                value={formData.target_lang}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${errors.target_lang ? "input_error" : ""} ${
                  touched.target_lang &&
                  !errors.target_lang &&
                  formData.target_lang
                    ? "input_valid"
                    : ""
                }`}
                disabled={loading}
              >
                <option value="">{t("AddDict.select_lang")}</option>
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              {errors.target_lang && (
                <span className="error_text">{errors.target_lang}</span>
              )}
            </div>
          </div>

          <div className="form_group checkbox_group">
            <label>
              <input
                type="checkbox"
                name="is_for_sale"
                checked={formData.is_for_sale}
                onChange={handleChange}
                disabled={loading}
              />
              {t("AddDict.form.sell_dict")}
            </label>
          </div>

          {formData.is_for_sale && (
            <>
              <div className="form_group indent">
                <label htmlFor="price">{t("AddDict.form.price")}</label>
                <div className="price_input">
                  <span className="currency">$</span>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min="0.5"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${errors.price ? "input_error" : ""} ${
                      touched.price && !errors.price && formData.price
                        ? "input_valid"
                        : ""
                    }`}
                    disabled={loading}
                  />
                </div>
                {errors.price && (
                  <span className="error_text">{errors.price}</span>
                )}
                <small>{t("AddDict.hints.min_price")}</small>
              </div>

              <div className="form_group checkbox_group indent">
                <label>
                  <input
                    type="checkbox"
                    name="allow_temporary_access"
                    checked={formData.allow_temporary_access}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {t("AddDict.form.allow_temp_access")}
                </label>
              </div>

              {formData.allow_temporary_access && (
                <div className="form_group indent">
                  <label htmlFor="temporary_days">
                    {t("AddDict.form.temp_days")}
                  </label>
                  <input
                    type="number"
                    id="temporary_days"
                    name="temporary_days"
                    min="1"
                    value={formData.temporary_days}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${errors.temporary_days ? "input_error" : ""} ${
                      touched.temporary_days &&
                      !errors.temporary_days &&
                      formData.temporary_days
                        ? "input_valid"
                        : ""
                    }`}
                    disabled={loading}
                  />
                  {errors.temporary_days && (
                    <span className="error_text">
                      {errors.temporary_days}
                    </span>
                  )}
                  <small className="form_hint">
                    {t("AddDict.hints.trial_hint") || "Пользователи смогут использовать словарь бесплатно в течение указанного количества дней"}
                  </small>
                </div>
              )}
            </>
          )}
        </div>

        {submitSuccess && (
          <div className="success_message">
            <span className="success_icon">✓</span>
            {t("EditDict.success") || "Словарь успешно обновлен!"}
          </div>
        )}

        {errors.submit && (
          <div className="error_message_submit">{errors.submit}</div>
        )}

        <div className="form_actions">
          <Button
            type="button"
            text={t("EditDict.cancel") || "Отмена"}
            onClick={onCancel}
            disabled={loading}
          />
          <Button
            type="submit"
            text={
              loading
                ? t("loading") || "Сохранение..."
                : t("EditDict.save") || "Сохранить"
            }
            disabled={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default EditDict;

