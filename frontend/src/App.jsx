import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Feed from "./components/Feed";
import OutputMenu from "./components/OutputMenu";
import RegisterPage from "./components/RegisterPage";
import LoginPage from "./components/LoginPage";
import UserPage from "./components/UserPage";

const API_URL = "http://localhost:3000/api";

function MainApp({ showOutput }) {
  const [feed, setFeed] = useState([]);
  const [showFeed, setShowFeed] = useState(true);

  // API
  const apiCall = React.useCallback(async (url, method, { successMsg, errorMsg }) => {
    try {
      const response = await fetch(url, { method });
      const data = await response.json();
      if (!response.ok) {
        showOutput(errorMsg, "error");
        return { success: false, data: null };
      }
      showOutput(successMsg, "success");
      return { success: true, data };
    } catch {
      showOutput("Error de conexión", "error");
      return { success: false, data: null };
    }
  }, [showOutput]);


  // Feed
  const cargarFeed = React.useCallback(async () => {
    showOutput("Cargando feed...", "info");
    try {
      const res = await apiCall(`${API_URL}/paginas`, "GET", {
        successMsg: "Feed cargado correctamente.",
        errorMsg: "Error al cargar el feed",
      });
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setFeed(res.data);
        showOutput(`Feed cargado: ${res.data.length}`, "success");
      } else {
        setFeed([]);
        showOutput("No hay textos completos disponibles en el feed.", "info");
      }
    } catch {
      showOutput("Error de conexión", "error");
    }
  }, [apiCall, showOutput]);

  // Navegación
  const goToFeed = (e) => {
    e.preventDefault();
    setShowFeed(true);
    cargarFeed();
  };

  useEffect(() => {
    cargarFeed();
  }, [cargarFeed]);

  return (
    <>
      <Navbar onFeedClick={goToFeed} />
      {showFeed && <Feed feed={feed} />}
    </>
  );
}

export default function App() {
  // Estados globales para registro y login
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [logEmail, setLogEmail] = useState("");
  const [logPass, setLogPass] = useState("");
  const [output, setOutput] = React.useState({ message: "", type: "" });
  const [outputMinimized, setOutputMinimized] = React.useState(false);

  // Output global
  const showOutput = React.useCallback((message, type = "info") => {
    if (Array.isArray(message)) {
      setOutput({ message: message.map((m) => <div key={m}>{m}</div>), type });
    } else {
      setOutput({ message, type });
    }
    setOutputMinimized(false);
  }, []);

  const getCsrfToken = async () => {
    const res = await fetch("http://localhost:3000/api/csrf-token", { credentials: "include" });
    const data = await res.json();
    return data.csrfToken;
  };

  const register = async (email, password) => {
    const csrfToken = await getCsrfToken();
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || data.message || "Error en el registro" };
    }
    return { message: data.message || "Registro exitoso", id: data.id };
  };

  const login = async (email, password) => {
    const csrfToken = await getCsrfToken();
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || data.message || "Error en el login" };
    }
    return { message: data.message || "Login exitoso", id: data.id };
  };

  function toggleOutputMinimize() {
    setOutputMinimized((min) => !min);
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <MainApp
              showOutput={showOutput}
            />
          }
        />
        <Route
          path="/registro"
          element={
            <RegisterPage
              regEmail={regEmail}
              regPass={regPass}
              setRegEmail={setRegEmail}
              setRegPass={setRegPass}
              register={register}
              showOutput={showOutput}
            />
          }
        />
        <Route
          path="/login"
          element={
            <LoginPage
              logEmail={logEmail}
              logPass={logPass}
              setLogEmail={setLogEmail}
              setLogPass={setLogPass}
              login={login}
              showOutput={showOutput}
            />
          }
        />
        <Route path="/usuario/:id" element={<UserPage />} />
      </Routes>
      <OutputMenu
        outputMsg={output.message}
        outputType={output.type}
        outputMinimized={outputMinimized}
        toggleOutputMinimize={toggleOutputMinimize}
      />
    </Router>
  );
}
