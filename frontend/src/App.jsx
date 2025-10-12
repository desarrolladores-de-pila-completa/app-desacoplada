import React, { useEffect, useRef } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Feed from "./components/Feed";
import Footer from "./components/Footer";
import OutputMenu from "./components/OutputMenu";
import RegisterPage from "./components/RegisterPage";
import LoginPage from "./components/LoginPage";
import UserPage from "./components/UserPage";
import AccountPage from "./components/AccountPage";
import CreatePublication from "./components/CreatePublication";
import useAuthStore from "./stores/authStore";
import { useFeed } from "./hooks/useFeed";

function MainApp({ showOutput }) {
  const { data: feed = [], isLoading, error } = useFeed();
  const lastMessageRef = useRef("");

  // Mostrar mensajes de carga y error
  useEffect(() => {
    let message = "";
    if (isLoading) {
      message = "Cargando feed...";
    } else if (error) {
      message = "Error al cargar el feed";
    } else if (feed.length > 0) {
      message = `Feed cargado: ${feed.length} entradas`;
    } else {
      message = "No hay entradas disponibles en el feed.";
    }

    if (message !== lastMessageRef.current) {
      showOutput(message, isLoading ? "info" : error ? "error" : "success");
      lastMessageRef.current = message;
    }
  }, [isLoading, error, feed, showOutput]);

  const goToFeed = (e) => {
    e.preventDefault();
    // El feed se recarga automáticamente con React Query
  };

  return (
    <>
      <Navbar onFeedClick={goToFeed} />
      <Feed feed={feed} />
    </>
  );
}

export default function App() {
  const { checkAuth } = useAuthStore();
  const [output, setOutput] = React.useState({ message: "", type: "" });
  const [outputMinimized, setOutputMinimized] = React.useState(false);
  const checkAuthCalled = useRef(false);

  // Verificar autenticación al cargar la app
  useEffect(() => {
    if (!checkAuthCalled.current) {
      checkAuth();
      checkAuthCalled.current = true;
    }
  }, [checkAuth]);

  // Output global
  const showOutput = React.useCallback((message, type = "info") => {
    if (Array.isArray(message)) {
      setOutput({ message: message.map((m) => <div key={m}>{m}</div>), type });
    } else {
      setOutput({ message, type });
    }
    setOutputMinimized(true);
  }, []);

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
              showOutput={showOutput}
            />
          }
        />
        <Route
          path="/login"
          element={
            <LoginPage
              showOutput={showOutput}
            />
          }
        />
        <Route path="/cuenta" element={<AccountPage />} />
        <Route path="/:username/publicar" element={<CreatePublication />} />
        <Route path="/pagina/:username" element={<UserPage />} />
        <Route path="/:username/publicar/:pagina" element={<UserPage />} />
        <Route path="/:username/nuevapublicacion" element={<UserPage />} />
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
