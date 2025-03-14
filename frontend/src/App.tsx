import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Recipes from "./pages/Recipes";
import Finance from "./pages/Finance";
import { AppProvider } from "./context/AppContext";
import "./index.css";

function App() {
  useEffect(() => {
    // Include required font
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />

            <Route path="/inventory" element={<Inventory />} />

            <Route path="/recipes" element={<Recipes />} />

            <Route path="/finance" element={<Finance />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;
