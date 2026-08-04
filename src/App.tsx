import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { ResumeProvider } from './context/ResumeContext'
import ApplicationsPage from './pages/ApplicationsPage'
import EditPage from './pages/EditPage'
import AssistantPage from './pages/AssistantPage'
import HomePage from './pages/HomePage'
import JobDetailPage from './pages/JobDetailPage'
import JobsPage from './pages/JobsPage'
import WorkDetailPage from './pages/WorkDetailPage'
import WorkListPage from './pages/WorkListPage'

export default function App() {
  return (
    <BrowserRouter>
      <ResumeProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/works" element={<WorkListPage />} />
            <Route path="/works/:id" element={<WorkDetailPage />} />
            <Route path="/edit" element={<EditPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
          </Route>
        </Routes>
      </ResumeProvider>
    </BrowserRouter>
  )
}
