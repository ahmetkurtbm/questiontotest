import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import Login from "./pages/Login";
import SaveQuestion from "./pages/SaveQuestion";
import AllQuestions from "./pages/AllQuestions";
import CreateTest from "./pages/CreateTest";
import SavePdf from "./pages/SavePdf";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/savequestion" element={<SaveQuestion />} />
        <Route path="/savepdf" element={<SavePdf />} />
        <Route path="/allquestions" element={<AllQuestions />} />
        <Route path="/createtest" element={<CreateTest />} />
      </Routes>
    </Router>
  );
}

export default App;
