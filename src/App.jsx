import { HashRouter, Routes, Route } from 'react-router-dom';
import { SalesProvider } from './context/SalesContext';
import Leaderboard from './components/Leaderboard';
import ControlPanel from './components/ControlPanel';

export default function App() {
  return (
    <SalesProvider>
      <HashRouter>
        <Routes>
          <Route path="/"        element={<Leaderboard/>}/>
          <Route path="/control" element={<ControlPanel/>}/>
        </Routes>
      </HashRouter>
    </SalesProvider>
  );
}
