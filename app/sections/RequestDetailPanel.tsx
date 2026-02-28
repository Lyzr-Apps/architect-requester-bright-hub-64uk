'use client'

import { RiCloseLine, RiExternalLinkLine, RiCheckLine, RiSendPlaneLine, RiDownloadLine, RiCheckDoubleLine, RiRefreshLine, RiDeleteBinLine, RiLoader4Line } from 'react-icons/ri'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

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

interface RequestDetailPanelProps {
  request: MediaRequest | null
  onClose: () => void
  onResync: (req: MediaRequest) => void
  onRemove: (req: MediaRequest) => void
  resyncing: boolean
}

const STATUS_STEPS = [
  { key: 'requested', label: 'Requested', icon: RiCheckLine },
  { key: 'routed', label: 'Sent to Service', icon: RiSendPlaneLine },
  { key: 'downloading', label: 'Downloading', icon: RiDownloadLine },
  { key: 'available', label: 'Available', icon: RiCheckDoubleLine },
]

function getStepIndex(status: string): number {
  switch (status?.toLowerCase()) {
    case 'requested': return 0
    case 'routed': return 1
    case 'downloading': return 2
    case 'available': return 3
    default: return 0
  }
}

export default function RequestDetailPanel({ request, onClose, onResync, onRemove, resyncing }: RequestDetailPanelProps) {
  if (!request) return null

  const currentStep = getStepIndex(request.status)

  const typeColor = request.media_type === 'movie'
    ? 'bg-[hsl(191,97%,70%)]/20 text-[hsl(191,97%,70%)] border border-[hsl(191,97%,70%)]/30'
    : 'bg-[hsl(326,100%,68%)]/20 text-[hsl(326,100%,68%)] border border-[hsl(326,100%,68%)]/30'

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-card border-l border-border shadow-2xl flex flex-col" style={{ borderRadius: '0.875rem 0 0 0.875rem' }}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="pr-4">
            <h2 className="text-lg font-bold text-foreground mb-2" style={{ letterSpacing: '-0.01em' }}>{request.title ?? 'Untitled'}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-xs ${typeColor}`}>
                {request.media_type === 'movie' ? 'Movie' : 'TV Show'}
              </Badge>
              <Badge className="text-xs bg-secondary text-secondary-foreground">
                {request.service ?? 'Unknown'}
              </Badge>
            </div>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* IMDb Link */}
            {request.imdb_link && (
              <a href={request.imdb_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                <RiExternalLinkLine className="h-4 w-4" />
                View on IMDb ({request.imdb_id ?? 'N/A'})
              </a>
            )}

            {/* Status Timeline */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Status Timeline</h3>
              <div className="space-y-0">
                {STATUS_STEPS.map((step, idx) => {
                  const isCompleted = idx < currentStep
                  const isActive = idx === currentStep
                  const isPending = idx > currentStep
                  const IconComponent = step.icon

                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      {/* Line + dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30' : isActive ? 'bg-[hsl(135,94%,60%)] text-[hsl(231,18%,10%)] shadow-md shadow-[hsl(135,94%,60%)]/30' : 'bg-muted text-muted-foreground'}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        {idx < STATUS_STEPS.length - 1 && (
                          <div className={`w-0.5 h-8 ${isCompleted ? 'bg-primary/60' : 'bg-border'}`} />
                        )}
                      </div>

                      {/* Label */}
                      <div className="pt-1">
                        <p className={`text-sm font-medium ${isActive ? 'text-[hsl(135,94%,60%)]' : isCompleted ? 'text-primary' : 'text-muted-foreground'}`}>
                          {step.label}
                        </p>
                        {isActive && (
                          <p className="text-xs text-muted-foreground mt-0.5">Current status</p>
                        )}
                        {isCompleted && (
                          <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
                        )}
                        {isPending && (
                          <p className="text-xs text-muted-foreground/50 mt-0.5">Pending</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Source Info */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Source Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discord Channel</span>
                  <span className="text-foreground font-medium">#{request.channel ?? 'unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requested by</span>
                  <span className="text-foreground font-medium">{request.requester ?? 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discord Post</span>
                  <span className="text-foreground font-medium capitalize">{request.discord_post_status ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IMDb ID</span>
                  <span className="text-foreground font-mono text-xs">{request.imdb_id ?? 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="p-6 border-t border-border flex gap-3">
          <Button onClick={() => onResync(request)} disabled={resyncing} variant="outline" className="flex-1 border-border text-foreground hover:bg-secondary">
            {resyncing ? <RiLoader4Line className="h-4 w-4 mr-2 animate-spin" /> : <RiRefreshLine className="h-4 w-4 mr-2" />}
            Re-sync Status
          </Button>
          <Button onClick={() => onRemove(request)} variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">
            <RiDeleteBinLine className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )
}
