'use client'

import React, { useState, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Badge } from '@/components/ui/badge'
import { RiRobot2Line, RiLoader4Line } from 'react-icons/ri'
import Sidebar from './sections/Sidebar'
import DashboardSection from './sections/DashboardSection'
import RequestDetailPanel from './sections/RequestDetailPanel'
import NewRequestModal from './sections/NewRequestModal'
import SettingsSection from './sections/SettingsSection'

// ---- Types ----
interface MediaRequest {
  title: string
  imdb_id: string
  imdb_link: string
  media_type: string
  service: string
  status: string
  requester: string
  channel: string
  discord_post_status: string
}

type NavItem = 'dashboard' | 'requests' | 'new-request' | 'settings'

// ---- Agent IDs ----
const MANAGER_AGENT_ID = '69a283adc36765d79726f134'

const AGENTS = [
  { id: '69a283adc36765d79726f134', name: 'Media Request Coordinator', role: 'Manager - orchestrates all sub-agents' },
  { id: '69a2838d00b22915dd81e186', name: 'Discord Parser Agent', role: 'Parses Discord thread posts' },
  { id: '69a2838de72641e0c6070aa7', name: 'Media Router Agent', role: 'Routes to Radarr / Sonarr' },
  { id: '69a2838d0082f39a3a37cdfd', name: 'Discord Poster Agent', role: 'Posts to Discord channels' },
]

// ---- Theme ----
const THEME_VARS: React.CSSProperties & Record<string, string> = {
  '--background': '231 18% 14%',
  '--foreground': '60 30% 96%',
  '--card': '232 16% 18%',
  '--card-foreground': '60 30% 96%',
  '--popover': '232 16% 22%',
  '--popover-foreground': '60 30% 96%',
  '--primary': '265 89% 72%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '232 16% 24%',
  '--secondary-foreground': '60 30% 96%',
  '--accent': '135 94% 60%',
  '--accent-foreground': '231 18% 10%',
  '--destructive': '0 100% 62%',
  '--destructive-foreground': '0 0% 100%',
  '--muted': '232 16% 28%',
  '--muted-foreground': '228 10% 62%',
  '--border': '232 16% 28%',
  '--input': '232 16% 32%',
  '--ring': '265 89% 72%',
  '--radius': '0.875rem',
  '--chart-1': '265 89% 72%',
  '--chart-2': '135 94% 60%',
  '--chart-3': '191 97% 70%',
  '--chart-4': '326 100% 68%',
  '--chart-5': '31 100% 65%',
  '--sidebar-background': '231 18% 12%',
  '--sidebar-foreground': '60 30% 96%',
  '--sidebar-border': '232 16% 22%',
  '--sidebar-primary': '265 89% 72%',
  '--sidebar-primary-foreground': '0 0% 100%',
  '--sidebar-accent': '232 16% 20%',
  '--sidebar-accent-foreground': '60 30% 96%',
}

// ---- ErrorBoundary ----
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ---- Main Page ----
export default function Page() {
  // Navigation
  const [activeSection, setActiveSection] = useState<NavItem>('dashboard')

  // Requests state
  const [requests, setRequests] = useState<MediaRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<MediaRequest | null>(null)

  // Sync state
  const [syncing, setSyncing] = useState(false)
  const [lastSyncSummary, setLastSyncSummary] = useState('')
  const [syncError, setSyncError] = useState('')

  // New request modal
  const [newRequestOpen, setNewRequestOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null)

  // Detail panel
  const [resyncing, setResyncing] = useState(false)

  // Sample data toggle
  const [showSample, setShowSample] = useState(false)

  // Active agent tracking
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // ---- Handlers ----
  const handleSync = useCallback(async (discordContent: string) => {
    setSyncing(true)
    setSyncError('')
    setLastSyncSummary('')
    setActiveAgentId(MANAGER_AGENT_ID)
    try {
      const message = `Sync media requests from Discord. Parse the following raw Discord thread channel content. Extract every single media request post — each title, IMDb link, requester username, and channel. Classify each as movie or tv_show and route movies to Radarr and TV shows to Sonarr. Do NOT return 0 results if there are posts below.\n\n--- BEGIN DISCORD CHANNEL CONTENT ---\n${discordContent}\n--- END DISCORD CHANNEL CONTENT ---`
      const result = await callAIAgent(
        message,
        MANAGER_AGENT_ID
      )
      if (result.success && result.response?.result) {
        const data = result.response.result
        const newRequests = Array.isArray(data?.requests) ? data.requests : []
        // Merge: add new requests that don't already exist (by imdb_id)
        setRequests(prev => {
          const existingIds = new Set(prev.map(r => r.imdb_id))
          const uniqueNew = newRequests.filter((r: MediaRequest) => r?.imdb_id && !existingIds.has(r.imdb_id))
          return [...prev, ...uniqueNew]
        })
        const count = newRequests.length
        setLastSyncSummary(data?.summary ?? `Synced ${count} requests. Movies: ${data?.movies_count ?? 0}, TV Shows: ${data?.tv_shows_count ?? 0}.`)
      } else {
        const errMsg = result.error ?? result.response?.message ?? 'Failed to sync from Discord.'
        setSyncError(typeof errMsg === 'string' ? errMsg : 'Failed to sync from Discord.')
      }
    } catch (err) {
      setSyncError('An unexpected error occurred during sync.')
    } finally {
      setSyncing(false)
      setActiveAgentId(null)
    }
  }, [])

  const handleNewRequest = useCallback(async (title: string, imdbLink: string, mediaType: string) => {
    setSubmitting(true)
    setSubmitResult(null)
    setActiveAgentId(MANAGER_AGENT_ID)
    try {
      const result = await callAIAgent(
        `Submit a new media request: Title: "${title}", IMDb Link: "${imdbLink}", Type: "${mediaType}". Route this to ${mediaType === 'movie' ? 'Radarr' : 'Sonarr'} and create a formatted Discord post for the ${mediaType === 'movie' ? 'movies' : 'tv-shows'} thread channel.`,
        MANAGER_AGENT_ID
      )
      if (result.success && result.response?.result) {
        const data = result.response.result
        const newReqs = Array.isArray(data?.requests) ? data.requests : []
        if (newReqs.length > 0) {
          setRequests(prev => [...prev, ...newReqs])
        }
        setSubmitResult({ success: true, message: data?.summary ?? 'Request submitted successfully.' })
      } else {
        setSubmitResult({ success: false, message: result.error ?? 'Failed to submit request.' })
      }
    } catch {
      setSubmitResult({ success: false, message: 'An unexpected error occurred.' })
    } finally {
      setSubmitting(false)
      setActiveAgentId(null)
    }
  }, [])

  const handleResync = useCallback(async (req: MediaRequest) => {
    setResyncing(true)
    setActiveAgentId(MANAGER_AGENT_ID)
    try {
      const result = await callAIAgent(
        `Check the current status of the media request: "${req.title}" (IMDb: ${req.imdb_id}). It was sent to ${req.service}. Return its updated status.`,
        MANAGER_AGENT_ID
      )
      if (result.success && result.response?.result) {
        const data = result.response.result
        const updatedReqs = Array.isArray(data?.requests) ? data.requests : []
        const updated = updatedReqs.find((r: MediaRequest) => r?.imdb_id === req.imdb_id)
        if (updated) {
          setRequests(prev => prev.map(r => r.imdb_id === req.imdb_id ? { ...r, ...updated } : r))
          setSelectedRequest(prev => prev?.imdb_id === req.imdb_id ? { ...prev, ...updated } : prev)
        }
      }
    } catch { /* silently fail */ }
    finally {
      setResyncing(false)
      setActiveAgentId(null)
    }
  }, [])

  const handleRemove = useCallback((req: MediaRequest) => {
    setRequests(prev => prev.filter(r => r.imdb_id !== req.imdb_id))
    setSelectedRequest(null)
  }, [])

  const handleNavigate = useCallback((section: NavItem) => {
    setActiveSection(section)
    if (section === 'new-request') {
      setNewRequestOpen(true)
      setActiveSection('dashboard')
    }
  }, [])

  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-background text-foreground font-sans">
        {/* Sidebar */}
        <Sidebar activeSection={activeSection} onNavigate={handleNavigate} />

        {/* Main content */}
        <main className="ml-[56px] lg:ml-[220px] min-h-screen">
          <div className="max-w-6xl mx-auto p-6 lg:p-8">
            {/* Dashboard / Requests */}
            {(activeSection === 'dashboard' || activeSection === 'requests') && (
              <DashboardSection
                requests={requests}
                syncing={syncing}
                onSync={handleSync}
                onSelectRequest={setSelectedRequest}
                onNewRequest={() => setNewRequestOpen(true)}
                showSample={showSample}
                onToggleSample={setShowSample}
                lastSyncSummary={lastSyncSummary}
                syncError={syncError}
              />
            )}

            {/* Settings */}
            {activeSection === 'settings' && <SettingsSection />}

            {/* Agent Status Panel */}
            <div className="mt-10 border-t border-border pt-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Agent Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {AGENTS.map((agent) => {
                  const isActive = activeAgentId === agent.id
                  return (
                    <div key={agent.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 ${isActive ? 'border-primary/50 bg-primary/5 shadow-md shadow-primary/10' : 'border-border bg-card/50'}`}>
                      <div className={`mt-0.5 flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0 ${isActive ? 'bg-primary/20' : 'bg-muted'}`}>
                        {isActive ? <RiLoader4Line className="h-3.5 w-3.5 text-primary animate-spin" /> : <RiRobot2Line className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{agent.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{agent.role}</p>
                        {isActive && (
                          <Badge className="mt-1 text-[10px] bg-primary/20 text-primary border-0 px-1.5 py-0">Processing</Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </main>

        {/* Overlays */}
        {selectedRequest && (
          <RequestDetailPanel
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onResync={handleResync}
            onRemove={handleRemove}
            resyncing={resyncing}
          />
        )}

        <NewRequestModal
          open={newRequestOpen}
          onClose={() => { setNewRequestOpen(false); setSubmitResult(null) }}
          onSubmit={handleNewRequest}
          submitting={submitting}
          submitResult={submitResult}
        />
      </div>
    </ErrorBoundary>
  )
}
