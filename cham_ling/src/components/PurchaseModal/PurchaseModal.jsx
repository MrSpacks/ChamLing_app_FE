import { useState } from "react";
import { useTranslation } from "react-i18next";
import { purchaseDictionary } from "../../api/auth";
import { FaTimes } from "react-icons/fa";
import "./PurchaseModal.css";

const PurchaseModal = ({ dictionary, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const [paymentCode, setPaymentCode] = useState("");
  const [accessType, setAccessType] = useState("permanent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!paymentCode.trim()) {
      setError(t("PurchaseModal.errors.code_required") || "Введите код оплаты");
      setLoading(false);
      return;
    }

    try {
      const result = await purchaseDictionary(dictionary.id, paymentCode.trim(), accessType);
      setSuccess(true);
      setTimeout(() => {
        onSuccess(result);
      }, 2000);
    } catch (err) {
      setError(err.message || t("PurchaseModal.errors.purchase_failed") || "Ошибка при покупке словаря");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="purchase_modal_overlay">
        <div className="purchase_modal">
          <div className="purchase_modal_header">
            <h2>{t("PurchaseModal.success_title") || "Покупка успешна!"}</h2>
          </div>
          <div className="purchase_modal_content">
            <div className="success_icon">✓</div>
            <p>{t("PurchaseModal.success_message") || "Словарь успешно куплен!"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="purchase_modal_overlay" onClick={onCancel}>
      <div className="purchase_modal" onClick={(e) => e.stopPropagation()}>
        <div className="purchase_modal_header">
          <h2>{t("PurchaseModal.title") || "Покупка словаря"}</h2>
          <button className="close_button" onClick={onCancel}>
            <FaTimes />
          </button>
        </div>

        <div className="purchase_modal_content">
          <div className="purchase_dict_info">
            <h3>{dictionary.name}</h3>
            <p className="purchase_price">${dictionary.price}</p>
            {dictionary.description && (
              <p className="purchase_description">{dictionary.description}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="purchase_form">
            {dictionary.allow_temporary_access && (
              <div className="form_group">
                <label htmlFor="access_type">
                  {t("PurchaseModal.access_type") || "Тип доступа"}:
                </label>
                <select
                  id="access_type"
                  name="access_type"
                  value={accessType}
                  onChange={(e) => setAccessType(e.target.value)}
                  disabled={loading}
                  className="access_type_select"
                >
                  <option value="permanent">
                    {t("PurchaseModal.permanent") || "Постоянный"}
                  </option>
                  <option value="temporary">
                    {t("PurchaseModal.temporary") || "Временный"}
                  </option>
                </select>
              </div>
            )}

            <div className="form_group">
              <label htmlFor="payment_code">
                {t("PurchaseModal.payment_code") || "Код оплаты"} *
              </label>
              <input
                type="text"
                id="payment_code"
                name="payment_code"
                value={paymentCode}
                onChange={(e) => setPaymentCode(e.target.value)}
                placeholder={t("PurchaseModal.code_placeholder") || "Введите код 1013"}
                disabled={loading}
                className="payment_code_input"
                autoFocus
              />
              <small className="form_hint">
                {t("PurchaseModal.code_hint") || "Для тестирования введите код: 1013"}
              </small>
            </div>

            {error && (
              <div className="error_message_submit">{error}</div>
            )}

            <div className="form_actions">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="cancel_button"
              >
                {t("PurchaseModal.cancel") || "Отмена"}
              </button>
              <button
                type="submit"
                disabled={loading || !paymentCode.trim()}
                className="purchase_button"
              >
                {loading
                  ? t("PurchaseModal.processing") || "Обработка..."
                  : t("PurchaseModal.buy") || "Купить"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PurchaseModal;

