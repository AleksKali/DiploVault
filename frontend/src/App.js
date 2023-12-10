import "./App.css";
import Navbar from "./components/Navbar";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Faculty from "./pages/Faculty";
import Verifier from "./pages/Verifier";

function App() {
  return (
    <div className="App">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/verifier" element={<Verifier />} />
        <Route path="/faculty" element={<Faculty />} />
      </Routes>
    </div>
  );
}

export default App;