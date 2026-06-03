import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import StoryGenerator from "./components/StoryGenerator.jsx";
import StoryLoader from "./components/StoryLoader.jsx";
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="app-header">
          <Link to="/" className="logo-link" style={{ textDecoration: 'none' }}>
            <h1 id="app-heading" className="app-title">✨ Build Your Story</h1>
          </Link>
          <p className="app-subtitle">Create and play your own AI-powered interactive text adventures</p>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<StoryGenerator />} />
            <Route path="/story/:id" element={<StoryLoader />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>© {new Date().getFullYear()} Build Your Story. Powered by LangChain, FastAPI & LLMs.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
