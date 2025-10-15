import ThemeButton from "../../components/ThemeButton";
import "./WelcomePage.css";

const WelcomePage = () => {
  return (
    <div className="container">
      <header className="header">
        <img src="logo.png" alt="Logo" className="logo" />
        <h1 className="title">Cham Ling</h1>
        <ThemeButton />
      </header>
      <h1>Welcome to Cham Ling!</h1>
    </div>
  );
};

export default WelcomePage;
