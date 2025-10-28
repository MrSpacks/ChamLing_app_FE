import "./Dashbutton.css";
export const DashButtonDesktop = ({ onClick, text }) => {
  return (
    <>
      <button className="dash_button_desktop" onClick={onClick}>
        {text}
      </button>
      <div className="bottom_line"> </div>
    </>
  );
};

export const DashButtonMobile = ({ onClick, text }) => {
  return (
    <button className="dash_button_mobile" onClick={onClick}>
      {text}
    </button>
  );
};
