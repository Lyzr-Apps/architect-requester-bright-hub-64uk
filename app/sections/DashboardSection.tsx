'use client'

import { useState, useMemo } from 'react'
import { RiFileListLine, RiFilmLine, RiTvLine, RiDownloadLine, RiSearchLine, RiRefreshLine, RiAddCircleLine, RiLoader4Line, RiArrowUpLine, RiArrowDownLine } from 'react-icons/ri'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

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

interface DashboardSectionProps {
  requests: MediaRequest[]
  syncing: boolean
  onSync: (discordContent: string) => void
  onSelectRequest: (req: MediaRequest) => void
  onNewRequest: () => void
  showSample: boolean
  onToggleSample: (val: boolean) => void
  lastSyncSummary: string
  syncError: string
}

type SortField = 'title' | 'media_type' | 'status' | 'channel'
type SortDir = 'asc' | 'desc'

const SAMPLE_REQUESTS: MediaRequest[] = [
  { title: 'Dune: Part Two', imdb_id: 'tt15239678', imdb_link: 'https://www.imdb.com/title/tt15239678/', media_type: 'movie', service: 'Radarr', status: 'available', requester: 'FilmFan42', channel: 'movies', discord_post_status: 'posted' },
  { title: 'The Bear', imdb_id: 'tt14452776', imdb_link: 'https://www.imdb.com/title/tt14452776/', media_type: 'tv_show', service: 'Sonarr', status: 'downloading', requester: 'SeriesLover', channel: 'tv-shows', discord_post_status: 'posted' },
  { title: 'Oppenheimer', imdb_id: 'tt15398776', imdb_link: 'https://www.imdb.com/title/tt15398776/', media_type: 'movie', service: 'Radarr', status: 'requested', requester: 'MovieBuff', channel: 'movies', discord_post_status: 'pending' },
  { title: 'Shogun', imdb_id: 'tt2788316', imdb_link: 'https://www.imdb.com/title/tt2788316/', media_type: 'tv_show', service: 'Sonarr', status: 'available', requester: 'DramaQueen', channel: 'tv-shows', discord_post_status: 'posted' },
  { title: 'Civil War', imdb_id: 'tt17279496', imdb_link: 'https://www.imdb.com/title/tt17279496/', media_type: 'movie', service: 'Radarr', status: 'downloading', requester: 'ActionHero', channel: 'movies', discord_post_status: 'posted' },
]

export default function DashboardSection({ requests, syncing, onSync, onSelectRequest, onNewRequest, showSample, onToggleSample, lastSyncSummary, syncError }: DashboardSectionProps) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterChannel, setFilterChannel] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('title')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [showSyncPanel, setShowSyncPanel] = useState(false)
  const [discordContent, setDiscordContent] = useState('')

  const displayRequests = showSample ? SAMPLE_REQUESTS : requests

  const filtered = useMemo(() => {
    let items = [...displayRequests]
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(r => r.title?.toLowerCase().includes(q) || r.requester?.toLowerCase().includes(q))
    }
    if (filterType !== 'all') items = items.filter(r => r.media_type === filterType)
    if (filterStatus !== 'all') items = items.filter(r => r.status === filterStatus)
    if (filterChannel !== 'all') items = items.filter(r => r.channel === filterChannel)
    items.sort((a, b) => {
      const aVal = (a[sortField] ?? '').toLowerCase()
      const bVal = (b[sortField] ?? '').toLowerCase()
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
    return items
  }, [displayRequests, search, filterType, filterStatus, filterChannel, sortField, sortDir])

  const totalCount = displayRequests.length
  const moviesCount = displayRequests.filter(r => r.media_type === 'movie').length
  const tvCount = displayRequests.filter(r => r.media_type === 'tv_show').length
  const downloadingCount = displayRequests.filter(r => r.status === 'downloading').length

  const toggleSort = (field: SortField) => {
    if (sortField === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc') }
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDir === 'asc' ? <RiArrowUpLine className="h-3 w-3 ml-1 inline" /> : <RiArrowDownLine className="h-3 w-3 ml-1 inline" />
  }

  const statusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'available': return 'bg-[hsl(135,94%,60%)] text-[hsl(231,18%,10%)]'
      case 'downloading': return 'bg-[hsl(191,97%,70%)] text-[hsl(231,18%,10%)]'
      case 'requested': return 'bg-[hsl(31,100%,65%)] text-[hsl(231,18%,10%)]'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const typeColor = (t: string) => {
    return t === 'movie' ? 'bg-[hsl(191,97%,70%)]/20 text-[hsl(191,97%,70%)] border border-[hsl(191,97%,70%)]/30' : 'bg-[hsl(326,100%,68%)]/20 text-[hsl(326,100%,68%)] border border-[hsl(326,100%,68%)]/30'
  }

  const STAT_CARDS = [
    { label: 'Total Requests', value: totalCount, icon: <RiFileListLine className="h-6 w-6" />, color: 'hsl(265, 89%, 72%)' },
    { label: 'Movies', value: moviesCount, icon: <RiFilmLine className="h-6 w-6" />, color: 'hsl(191, 97%, 70%)' },
    { label: 'TV Shows', value: tvCount, icon: <RiTvLine className="h-6 w-6" />, color: 'hsl(326, 100%, 68%)' },
    { label: 'Downloading', value: downloadingCount, icon: <RiDownloadLine className="h-6 w-6" />, color: 'hsl(135, 94%, 60%)' },
  ]

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground" style={{ letterSpacing: '-0.01em' }}>MediaHub</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="sample-toggle" checked={showSample} onCheckedChange={onToggleSample} />
            <Label htmlFor="sample-toggle" className="text-sm text-muted-foreground cursor-pointer">Sample Data</Label>
          </div>
          <Button onClick={() => setShowSyncPanel(prev => !prev)} disabled={syncing} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all duration-200">
            {syncing ? <RiLoader4Line className="h-4 w-4 mr-2 animate-spin" /> : <RiRefreshLine className="h-4 w-4 mr-2" />}
            {syncing ? 'Syncing...' : 'Sync from Discord'}
          </Button>
        </div>
      </div>

      {/* Sync Content Panel */}
      {showSyncPanel && (
        <Card className="bg-card border-border shadow-xl" style={{ borderRadius: '0.875rem' }}>
          <CardContent className="p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Paste Discord Channel Content</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Copy posts from your Discord movie/TV request channels and paste them below. The agent will parse all titles, IMDb links, and requester info from the content.
              </p>
              <textarea
                value={discordContent}
                onChange={(e) => setDiscordContent(e.target.value)}
                placeholder={"Paste Discord thread posts here...\n\nExample format:\nFilmFan42: Dune: Part Two (2024) - https://www.imdb.com/title/tt15239678/\nSeriesLover: The Bear - https://www.imdb.com/title/tt14452776/\nMovieBuff: Oppenheimer (2023) https://imdb.com/title/tt15398776"}
                rows={8}
                className="w-full bg-input border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring resize-y font-mono"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => { onSync(discordContent); }}
                disabled={syncing || !discordContent.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
              >
                {syncing ? <RiLoader4Line className="h-4 w-4 mr-2 animate-spin" /> : <RiRefreshLine className="h-4 w-4 mr-2" />}
                {syncing ? 'Parsing...' : 'Parse & Import'}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowSyncPanel(false); setDiscordContent('') }}
                className="border-border text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              {!discordContent.trim() && (
                <span className="text-xs text-muted-foreground">Paste Discord content above to enable sync</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync feedback */}
      {lastSyncSummary && (
        <div className="rounded-xl px-4 py-3 text-sm border border-[hsl(135,94%,60%)]/30 bg-[hsl(135,94%,60%)]/10 text-[hsl(135,94%,60%)]">
          {lastSyncSummary}
        </div>
      )}
      {syncError && (
        <div className="rounded-xl px-4 py-3 text-sm border border-destructive/30 bg-destructive/10 text-destructive">
          {syncError}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => (
          <Card key={card.label} className="bg-card border-border shadow-lg hover:shadow-xl transition-all duration-300" style={{ borderRadius: '0.875rem' }}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: `${card.color}20`, color: card.color }}>
                {card.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by title or requester..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground" style={{ borderRadius: '0.875rem' }} />
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Type filters */}
          {['all', 'movie', 'tv_show'].map(t => (
            <button key={`type-${t}`} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${filterType === t ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
              {t === 'all' ? 'All Types' : t === 'movie' ? 'Movies' : 'TV Shows'}
            </button>
          ))}
          <span className="w-px h-6 bg-border self-center mx-1" />
          {/* Status filters */}
          {['all', 'requested', 'downloading', 'available'].map(s => (
            <button key={`status-${s}`} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${filterStatus === s ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
              {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <span className="w-px h-6 bg-border self-center mx-1" />
          {/* Channel filters */}
          {['all', 'movies', 'tv-shows'].map(c => (
            <button key={`ch-${c}`} onClick={() => setFilterChannel(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${filterChannel === c ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
              {c === 'all' ? 'All Channels' : `#${c}`}
            </button>
          ))}
        </div>
      </div>

      {/* Request Table */}
      <Card className="bg-card border-border shadow-lg overflow-hidden" style={{ borderRadius: '0.875rem' }}>
        <ScrollArea className="w-full">
          <div className="min-w-[640px]">
            {/* Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 px-5 py-3 border-b border-border bg-secondary/50">
              <button onClick={() => toggleSort('title')} className="text-xs font-semibold text-muted-foreground text-left hover:text-foreground transition-colors">Title <SortIcon field="title" /></button>
              <button onClick={() => toggleSort('media_type')} className="text-xs font-semibold text-muted-foreground text-left hover:text-foreground transition-colors">Type <SortIcon field="media_type" /></button>
              <button onClick={() => toggleSort('status')} className="text-xs font-semibold text-muted-foreground text-left hover:text-foreground transition-colors">Status <SortIcon field="status" /></button>
              <button onClick={() => toggleSort('channel')} className="text-xs font-semibold text-muted-foreground text-left hover:text-foreground transition-colors">Channel <SortIcon field="channel" /></button>
              <span className="text-xs font-semibold text-muted-foreground">Requester</span>
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <RiFileListLine className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-sm font-medium text-muted-foreground mb-2">No requests yet</p>
                <p className="text-xs text-muted-foreground/70 mb-4 text-center">Sync from Discord to import media requests, or add a new one manually.</p>
                <Button onClick={() => setShowSyncPanel(true)} disabled={syncing} variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  {syncing ? <RiLoader4Line className="h-4 w-4 mr-2 animate-spin" /> : <RiRefreshLine className="h-4 w-4 mr-2" />}
                  Sync from Discord
                </Button>
              </div>
            ) : (
              filtered.map((req, idx) => (
                <button key={`${req.imdb_id}-${idx}`} onClick={() => onSelectRequest(req)} className="w-full grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 px-5 py-3 border-b border-border/50 hover:bg-secondary/40 transition-all duration-150 text-left cursor-pointer">
                  <span className="text-sm font-medium text-foreground truncate">{req.title ?? 'Untitled'}</span>
                  <span><Badge className={`text-xs ${typeColor(req.media_type)}`}>{req.media_type === 'movie' ? 'Movie' : 'TV Show'}</Badge></span>
                  <span><Badge className={`text-xs ${statusColor(req.status)}`}>{req.status ? req.status.charAt(0).toUpperCase() + req.status.slice(1) : 'Unknown'}</Badge></span>
                  <span className="text-xs text-muted-foreground self-center">#{req.channel ?? 'unknown'}</span>
                  <span className="text-xs text-muted-foreground self-center truncate">{req.requester ?? 'Unknown'}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* FAB */}
      <button onClick={onNewRequest} className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 transition-all duration-200 lg:hidden">
        <RiAddCircleLine className="h-6 w-6" />
      </button>
    </div>
  )
}
