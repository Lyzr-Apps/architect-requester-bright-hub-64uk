'use client'

import { useState } from 'react'
import { RiCloseLine, RiLoader4Line, RiFilmLine, RiTvLine, RiCheckLine, RiErrorWarningLine, RiLinkM } from 'react-icons/ri'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NewRequestModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (title: string, imdbLink: string, mediaType: string) => Promise<void>
  submitting: boolean
  submitResult: { success: boolean; message: string } | null
}

export default function NewRequestModal({ open, onClose, onSubmit, submitting, submitResult }: NewRequestModalProps) {
  const [title, setTitle] = useState('')
  const [imdbLink, setImdbLink] = useState('')
  const [mediaType, setMediaType] = useState<'movie' | 'tv_show'>('movie')
  const [validationError, setValidationError] = useState('')

  if (!open) return null

  const handleSubmit = async () => {
    setValidationError('')
    if (!title.trim()) {
      setValidationError('Title is required.')
      return
    }
    if (!imdbLink.trim()) {
      setValidationError('IMDb link is required.')
      return
    }
    if (!imdbLink.includes('imdb.com')) {
      setValidationError('Please enter a valid IMDb link.')
      return
    }
    await onSubmit(title.trim(), imdbLink.trim(), mediaType)
    if (!submitResult || submitResult.success) {
      setTitle('')
      setImdbLink('')
      setMediaType('movie')
    }
  }

  const handleClose = () => {
    setTitle('')
    setImdbLink('')
    setMediaType('movie')
    setValidationError('')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border shadow-2xl w-full max-w-md" style={{ borderRadius: '0.875rem' }} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-bold text-foreground" style={{ letterSpacing: '-0.01em' }}>New Media Request</h2>
            <button onClick={handleClose} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <RiCloseLine className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Validation Error */}
            {validationError && (
              <div className="rounded-xl px-4 py-3 text-sm border border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2">
                <RiErrorWarningLine className="h-4 w-4 flex-shrink-0" />
                {validationError}
              </div>
            )}

            {/* Submit result */}
            {submitResult && (
              <div className={`rounded-xl px-4 py-3 text-sm border flex items-center gap-2 ${submitResult.success ? 'border-[hsl(135,94%,60%)]/30 bg-[hsl(135,94%,60%)]/10 text-[hsl(135,94%,60%)]' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
                {submitResult.success ? <RiCheckLine className="h-4 w-4 flex-shrink-0" /> : <RiErrorWarningLine className="h-4 w-4 flex-shrink-0" />}
                {submitResult.message}
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Title *</Label>
              <Input value={title} onChange={(e) => { setTitle(e.target.value); setValidationError('') }} placeholder="e.g. The Matrix" className="bg-input border-border text-foreground placeholder:text-muted-foreground" style={{ borderRadius: '0.875rem' }} disabled={submitting} />
            </div>

            {/* IMDb Link */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">IMDb Link *</Label>
              <div className="relative">
                <RiLinkM className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={imdbLink} onChange={(e) => { setImdbLink(e.target.value); setValidationError('') }} placeholder="https://www.imdb.com/title/tt0133093/" className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground" style={{ borderRadius: '0.875rem' }} disabled={submitting} />
              </div>
            </div>

            {/* Type Toggle */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Media Type</Label>
              <div className="flex rounded-xl overflow-hidden border border-border">
                <button onClick={() => setMediaType('movie')} disabled={submitting} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-200 ${mediaType === 'movie' ? 'bg-primary text-primary-foreground shadow-inner' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                  <RiFilmLine className="h-4 w-4" />
                  Movie
                </button>
                <button onClick={() => setMediaType('tv_show')} disabled={submitting} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-200 ${mediaType === 'tv_show' ? 'bg-primary text-primary-foreground shadow-inner' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                  <RiTvLine className="h-4 w-4" />
                  TV Show
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1 border-border text-foreground hover:bg-secondary" disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !title.trim() || !imdbLink.trim()} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all duration-200">
              {submitting ? <RiLoader4Line className="h-4 w-4 mr-2 animate-spin" /> : null}
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
