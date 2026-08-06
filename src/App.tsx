import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import LocalOnly from './components/LocalOnly'
import { AccessModeProvider } from './context/AccessModeContext'
import { ResumeProvider } from './context/ResumeContext'
import ApplicationsPage from './pages/ApplicationsPage'
import EditPage from './pages/EditPage'
import AssistantPage from './pages/AssistantPage'
import GeneratedResumeDetailPage from './pages/GeneratedResumeDetailPage'
import GeneratedResumeListPage from './pages/GeneratedResumeListPage'
import HomePage from './pages/HomePage'
import JobDetailPage from './pages/JobDetailPage'
import JobsPage from './pages/JobsPage'
import PlatformDetailPage from './pages/PlatformDetailPage'
import PublicResumePage from './pages/PublicResumePage'
import ResumeMakerPage from './pages/ResumeMakerPage'
import WorkDetailPage from './pages/WorkDetailPage'
import WorkListPage from './pages/WorkListPage'

export default function App() {
  return (
    <BrowserRouter>
      <AccessModeProvider>
        <ResumeProvider>
          <Routes>
            {/* 外网可分享的定制简历 */}
            <Route path="/r/:id" element={<PublicResumePage />} />

            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/works" element={<WorkListPage />} />
              <Route path="/works/:id" element={<WorkDetailPage />} />
              <Route path="/works/work-0/platform" element={<PlatformDetailPage />} />

              {/* 本机专属 */}
              <Route
                path="/resume-maker"
                element={
                  <LocalOnly>
                    <ResumeMakerPage />
                  </LocalOnly>
                }
              />
              <Route
                path="/resumes"
                element={
                  <LocalOnly>
                    <GeneratedResumeListPage />
                  </LocalOnly>
                }
              />
              <Route
                path="/resumes/:id"
                element={
                  <LocalOnly>
                    <GeneratedResumeDetailPage />
                  </LocalOnly>
                }
              />
              <Route
                path="/edit"
                element={
                  <LocalOnly>
                    <EditPage />
                  </LocalOnly>
                }
              />
              <Route
                path="/jobs"
                element={
                  <LocalOnly>
                    <JobsPage />
                  </LocalOnly>
                }
              />
              <Route
                path="/jobs/:id"
                element={
                  <LocalOnly>
                    <JobDetailPage />
                  </LocalOnly>
                }
              />
              <Route
                path="/assistant"
                element={
                  <LocalOnly>
                    <AssistantPage />
                  </LocalOnly>
                }
              />
              <Route
                path="/applications"
                element={
                  <LocalOnly>
                    <ApplicationsPage />
                  </LocalOnly>
                }
              />
            </Route>
          </Routes>
        </ResumeProvider>
      </AccessModeProvider>
    </BrowserRouter>
  )
}
