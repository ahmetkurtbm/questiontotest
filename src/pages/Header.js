import "./Header.css";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

//import UserIcon from "../assets/icons/user-icon.svg";

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    Cookies.remove("login");
    navigate("/login");
  };

  return (
    <div className="header">
      <div className="menu">
        <ul>
          <li>
            <a href="/saveQuestion">Soru Ekle</a>
          </li>
          <div className="line"></div>
          <li>
            <a href="/savepdf">Pdf Yükle</a>
          </li>
          <div className="line"></div>
          <li>
            <a href="/allQuestions">Tüm Sorular</a>
          </li>
          <div className="line"></div>
          <li>
            <a href="/createTest">Test Oluştur</a>
          </li>
        </ul>
      </div>
      <div className="user">
        {/* <img src={UserIcon} alt="kullanic"></img> */}
        <button
          id="logout"
          type="button"
          onClick={handleLogout}
          className="btn-logout"
        >
          Çıkış Yap
        </button>
      </div>
    </div>
  );
};
export default Header;
