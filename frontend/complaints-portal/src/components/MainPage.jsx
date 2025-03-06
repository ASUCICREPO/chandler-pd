import { Route, Routes } from "react-router-dom";
import HeatMap from "./Heatmap";
import Chatbot from "./Chatbot";
import Complaints from "./Complaints";

const MainPage = () => {
  return (
    <>
      <Routes>
        <Route path="/heatmap" element={<HeatMap />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="*" element={<Complaints />} />
      </Routes>
    </>
  );
};

export default MainPage;
