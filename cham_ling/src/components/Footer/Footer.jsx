import "./Footer.css";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <p>© 2025 ChamLing. {t("footer.rights")}</p>
      {/* <p>
        {t("footer.madeWith")}{" "}
        <a href="https://portfolio-2-0-theta-two.vercel.app/">Mr.Spacks</a>
      </p> */}
    </footer>
  );
};

export default Footer;
