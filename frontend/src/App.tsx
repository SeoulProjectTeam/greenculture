import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { TripPlannerProvider } from './context/TripPlannerContext';
import { LandingPage } from './pages/LandingPage';
import { SearchPage } from './pages/SearchPage';
import { LoadingPage } from './pages/LoadingPage';
import { ResultPage } from './pages/ResultPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { MyCoursesPage } from './pages/MyCoursesPage';

export default function App() {
  return (
    <BrowserRouter>
      <TripPlannerProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/loading" element={<LoadingPage />} />
            <Route path="/results" element={<ResultPage />} />
            <Route path="/course/:courseId" element={<CourseDetailPage />} />
            <Route path="/my-courses" element={<MyCoursesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </TripPlannerProvider>
    </BrowserRouter>
  );
}
