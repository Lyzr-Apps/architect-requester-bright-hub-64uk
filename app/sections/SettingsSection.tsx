'use client'

import { useState, useEffect } from 'react'
import { RiEyeLine, RiEyeOffLine, RiSave3Line, RiDiscordLine, RiCheckLine } from 'react-icons/ri'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SettingsData {
  discord_server_id: string
  discord_movies_channel: string
  discord_tv_channel: string
  discord_bot_token: string
  radarr_url: string
  radarr_api_key: string
  radarr_quality: string
  sonarr_url: string
  sonarr_api_key: string
  sonarr_quality: string
  auto_sync: boolean
  sync_interval: string
}

const DEFAULT_SETTINGS: SettingsData = {
  discord_server_id: '',
  discord_movies_channel: '',
  discord_tv_channel: '',
  discord_bot_token: '',
  radarr_url: '',
  radarr_api_key: '',
  radarr_quality: 'HD-1080p',
  sonarr_url: '',
  sonarr_api_key: '',
  sonarr_quality: 'HD-1080p',
  auto_sync: false,
  sync_interval: '30',
}

export default function SettingsSection() {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS)
  const [showBotToken, setShowBotToken] = useState(false)
  const [showRadarrKey, setShowRadarrKey] = useState(false)
  const [showSonarrKey, setShowSonarrKey] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mediahub_settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        setSettings(prev => ({ ...prev, ...parsed }))
      }
    } catch { /* ignore parse errors */ }
  }, [])

  const handleChange = (field: keyof SettingsData, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem('mediahub_settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function MaskedInput({ value, show, onToggle, onChange, placeholder }: { value: string; show: boolean; onToggle: () => void; onChange: (val: string) => void; placeholder: string }) {
    return (
      <div className="relative">
        <Input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pr-10 bg-input border-border text-foreground placeholder:text-muted-foreground" style={{ borderRadius: '0.875rem' }} />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          {show ? <RiEyeOffLine className="h-4 w-4" /> : <RiEyeLine className="h-4 w-4" />}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground" style={{ letterSpacing: '-0.01em' }}>Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your Discord, Radarr, and Sonarr connections.</p>
      </div>

      {saved && (
        <div className="rounded-xl px-4 py-3 text-sm border border-[hsl(135,94%,60%)]/30 bg-[hsl(135,94%,60%)]/10 text-[hsl(135,94%,60%)] flex items-center gap-2">
          <RiCheckLine className="h-4 w-4" />
          Settings saved successfully.
        </div>
      )}

      {/* Discord Config */}
      <Card className="bg-card border-border shadow-lg" style={{ borderRadius: '0.875rem' }}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <RiDiscordLine className="h-5 w-5 text-[hsl(265,89%,72%)]" />
            Discord Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Server ID</Label>
            <Input value={settings.discord_server_id} onChange={(e) => handleChange('discord_server_id', e.target.value)} placeholder="Enter Discord server ID" className="bg-input border-border text-foreground placeholder:text-muted-foreground" style={{ borderRadius: '0.875rem' }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Movies Channel ID</Label>
              <Input value={settings.discord_movies_channel} onChange={(e) => handleChange('discord_movies_channel', e.target.value)} placeholder="Channel ID" className="bg-input border-border text-foreground placeholder:text-muted-foreground" style={{ borderRadius: '0.875rem' }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">TV Shows Channel ID</Label>
              <Input value={settings.discord_tv_channel} onChange={(e) => handleChange('discord_tv_channel', e.target.value)} placeholder="Channel ID" className="bg-input border-border text-foreground placeholder:text-muted-foreground" style={{ borderRadius: '0.875rem' }} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Bot Token</Label>
            <MaskedInput value={settings.discord_bot_token} show={showBotToken} onToggle={() => setShowBotToken(!showBotToken)} onChange={(v) => handleChange('discord_bot_token', v)} placeholder="Enter bot token" />
          </div>
        </CardContent>
      </Card>

      {/* Radarr Config */}
      <Card className="bg-card border-border shadow-lg" style={{ borderRadius: '0.875rem' }}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <div className="w-5 h-5 rounded bg-[hsl(31,100%,65%)]/20 flex items-center justify-center text-[hsl(31,100%,65%)] text-xs font-bold">R</div>
            Radarr Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">API URL</Label>
            <Input value={settings.radarr_url} onChange={(e) => handleChange('radarr_url', e.target.value)} placeholder="http://localhost:7878" className="bg-input border-border text-foreground placeholder:text-muted-foreground" style={{ borderRadius: '0.875rem' }} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">API Key</Label>
            <MaskedInput value={settings.radarr_api_key} show={showRadarrKey} onToggle={() => setShowRadarrKey(!showRadarrKey)} onChange={(v) => handleChange('radarr_api_key', v)} placeholder="Enter Radarr API key" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Quality Profile</Label>
            <Select value={settings.radarr_quality} onValueChange={(v) => handleChange('radarr_quality', v)}>
              <SelectTrigger className="bg-input border-border text-foreground" style={{ borderRadius: '0.875rem' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="HD-1080p">HD-1080p</SelectItem>
                <SelectItem value="Ultra-HD">Ultra-HD</SelectItem>
                <SelectItem value="Any">Any</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sonarr Config */}
      <Card className="bg-card border-border shadow-lg" style={{ borderRadius: '0.875rem' }}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <div className="w-5 h-5 rounded bg-[hsl(191,97%,70%)]/20 flex items-center justify-center text-[hsl(191,97%,70%)] text-xs font-bold">S</div>
            Sonarr Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">API URL</Label>
            <Input value={settings.sonarr_url} onChange={(e) => handleChange('sonarr_url', e.target.value)} placeholder="http://localhost:8989" className="bg-input border-border text-foreground placeholder:text-muted-foreground" style={{ borderRadius: '0.875rem' }} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">API Key</Label>
            <MaskedInput value={settings.sonarr_api_key} show={showSonarrKey} onToggle={() => setShowSonarrKey(!showSonarrKey)} onChange={(v) => handleChange('sonarr_api_key', v)} placeholder="Enter Sonarr API key" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Quality Profile</Label>
            <Select value={settings.sonarr_quality} onValueChange={(v) => handleChange('sonarr_quality', v)}>
              <SelectTrigger className="bg-input border-border text-foreground" style={{ borderRadius: '0.875rem' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="HD-1080p">HD-1080p</SelectItem>
                <SelectItem value="Ultra-HD">Ultra-HD</SelectItem>
                <SelectItem value="Any">Any</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Auto-sync Config */}
      <Card className="bg-card border-border shadow-lg" style={{ borderRadius: '0.875rem' }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground text-base">Auto-sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-foreground font-medium">Enable Auto-sync</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Automatically sync Discord requests on a schedule.</p>
            </div>
            <Switch checked={settings.auto_sync} onCheckedChange={(v) => handleChange('auto_sync', v)} />
          </div>
          {settings.auto_sync && (
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Sync Interval</Label>
              <Select value={settings.sync_interval} onValueChange={(v) => handleChange('sync_interval', v)}>
                <SelectTrigger className="bg-input border-border text-foreground" style={{ borderRadius: '0.875rem' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="15">Every 15 min</SelectItem>
                  <SelectItem value="30">Every 30 min</SelectItem>
                  <SelectItem value="60">Every 1 hour</SelectItem>
                  <SelectItem value="360">Every 6 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all duration-200" style={{ borderRadius: '0.875rem' }}>
        <RiSave3Line className="h-4 w-4 mr-2" />
        Save Settings
      </Button>
    </div>
  )
}
