import "bootstrap/dist/css/bootstrap.min.css";
import "./Login.css";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (Cookies.get("login") === "tahsin") {
      navigate("/savequestion");
    }
  }, [navigate]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    const data = { username: username, password: password };

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const result = await response.json();
      console.log("Success:", result);
      Cookies.set("login", result);

      navigate("/savequestion");
    } catch (error) {
      console.error("Error:", error);
      window.alert("Giriş Bilgileriniz Yanlış!!");
    }
  };

  return (
    <div className="container">
      <form className="login-form" onSubmit={handleLogin}>
        <input
          type="text"
          className="name-input"
          required
          placeholder="Kullanıcı Adı"
          id="username"
          name="username"
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
          }}
        ></input>
        <input
          type="password"
          className="password-input"
          required
          placeholder="Şifre"
          id="password"
          name="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
        ></input>
        <button type="submit" className="btn btn-outline-primary">
          Giriş Yap
        </button>
      </form>
    </div>
  );
};

export default Login;
