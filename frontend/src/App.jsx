import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Feed from "./components/Feed";
import OutputMenu from "./components/OutputMenu";
import RegisterPage from "./components/RegisterPage";
import LoginPage from "./components/LoginPage";
import UserPage from "./components/UserPage";
import useAuthStore from "./stores/authStore";
import { useFeed } from "./hooks/useFeed";

function MainApp({ showOutput }) {
  const { data: feed = [], isLoading, error } = useFeed();

  // Mostrar mensajes de carga y error
  useEffect(() => {
    if (isLoading) {
      showOutput("Cargando feed...", "info");
    } else if (error) {
      showOutput("Error al cargar el feed", "error");
    } else if (feed.length > 0) {
      showOutput(`Feed cargado: ${feed.length} entradas`, "success");
    } else {
      showOutput("No hay entradas disponibles en el feed.", "info");
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

  // Verificar autenticación al cargar la app
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Output global
  const showOutput = React.useCallback((message, type = "info") => {
    if (Array.isArray(message)) {
      setOutput({ message: message.map((m) => <div key={m}>{m}</div>), type });
    } else {
      setOutput({ message, type });
    }
    setOutputMinimized(false);
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
  <Route path="/pagina/:username" element={<UserPage />} />
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
