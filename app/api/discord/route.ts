import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/discord
 *
 * Fetches messages from Discord thread/channel using the Discord API.
 * Expects body: { bot_token, channel_ids: string[] }
 * Returns: { success, channels: { channel_id, messages: DiscordMessage[] }[] }
 */

interface DiscordMessage {
  id: string
  content: string
  author: { username: string; id: string }
  timestamp: string
  channel_id: string
}

interface ChannelResult {
  channel_id: string
  channel_label: string
  messages: DiscordMessage[]
  message_count: number
  error?: string
}

const DISCORD_API_BASE = 'https://discord.com/api/v10'

async function fetchChannelMessages(
  channelId: string,
  botToken: string,
  limit: number = 100
): Promise<{ messages: DiscordMessage[]; error?: string }> {
  try {
    const res = await fetch(
      `${DISCORD_API_BASE}/channels/${channelId}/messages?limit=${limit}`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!res.ok) {
      const errorText = await res.text()
      let errorMsg = `Discord API error: ${res.status}`
      try {
        const errorJson = JSON.parse(errorText)
        errorMsg = errorJson.message || errorMsg
      } catch {}
      return { messages: [], error: errorMsg }
    }

    const data = await res.json()

    if (!Array.isArray(data)) {
      return { messages: [], error: 'Unexpected Discord API response format' }
    }

    const messages: DiscordMessage[] = data.map((msg: any) => ({
      id: msg.id,
      content: msg.content || '',
      author: {
        username: msg.author?.username || 'Unknown',
        id: msg.author?.id || '',
      },
      timestamp: msg.timestamp || '',
      channel_id: channelId,
    }))

    return { messages }
  } catch (error) {
    return {
      messages: [],
      error: error instanceof Error ? error.message : 'Failed to fetch from Discord',
    }
  }
}

// Also fetch threads within a channel (forum/thread channels)
async function fetchThreadMessages(
  channelId: string,
  botToken: string,
  limit: number = 100
): Promise<{ messages: DiscordMessage[]; error?: string }> {
  // First try fetching as a regular channel
  const directResult = await fetchChannelMessages(channelId, botToken, limit)

  // Also try to get active threads in this channel
  try {
    const threadsRes = await fetch(
      `${DISCORD_API_BASE}/channels/${channelId}/threads/archived/public`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (threadsRes.ok) {
      const threadsData = await threadsRes.json()
      const threads = Array.isArray(threadsData.threads) ? threadsData.threads : []

      // Fetch messages from each thread (limit to first 10 threads to avoid rate limits)
      const threadMessages: DiscordMessage[] = []
      for (const thread of threads.slice(0, 10)) {
        const threadResult = await fetchChannelMessages(thread.id, botToken, 50)
        if (threadResult.messages.length > 0) {
          threadMessages.push(...threadResult.messages)
        }
      }

      return {
        messages: [...directResult.messages, ...threadMessages],
        error: directResult.error,
      }
    }
  } catch {
    // Thread fetch failed — just return direct messages
  }

  // Also try active threads
  try {
    const activeRes = await fetch(
      `${DISCORD_API_BASE}/guilds/${channelId}/threads/active`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (activeRes.ok) {
      const activeData = await activeRes.json()
      const activeThreads = Array.isArray(activeData.threads) ? activeData.threads : []

      const threadMessages: DiscordMessage[] = []
      for (const thread of activeThreads.slice(0, 10)) {
        const threadResult = await fetchChannelMessages(thread.id, botToken, 50)
        if (threadResult.messages.length > 0) {
          threadMessages.push(...threadResult.messages)
        }
      }

      return {
        messages: [...directResult.messages, ...threadMessages],
        error: directResult.error,
      }
    }
  } catch {
    // Active thread fetch failed — just return what we have
  }

  return directResult
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bot_token, channel_ids, channel_labels } = body

    if (!bot_token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Discord Bot Token is required. Please configure it in Settings.',
          channels: [],
        },
        { status: 400 }
      )
    }

    if (!channel_ids || !Array.isArray(channel_ids) || channel_ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one channel ID is required. Please configure channel IDs in Settings.',
          channels: [],
        },
        { status: 400 }
      )
    }

    // Filter out empty channel IDs
    const validChannels = channel_ids.filter((id: string) => id && id.trim())
    if (validChannels.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid channel IDs provided. Please configure channel IDs in Settings.',
          channels: [],
        },
        { status: 400 }
      )
    }

    const labels = Array.isArray(channel_labels) ? channel_labels : []
    const results: ChannelResult[] = []

    for (let i = 0; i < validChannels.length; i++) {
      const channelId = validChannels[i].trim()
      const label = labels[i] || `channel-${i}`

      const { messages, error } = await fetchThreadMessages(channelId, bot_token)

      results.push({
        channel_id: channelId,
        channel_label: label,
        messages,
        message_count: messages.length,
        error,
      })
    }

    const totalMessages = results.reduce((sum, r) => sum + r.message_count, 0)
    const hasErrors = results.some(r => r.error)

    return NextResponse.json({
      success: totalMessages > 0 || !hasErrors,
      total_messages: totalMessages,
      channels: results,
      error: hasErrors && totalMessages === 0
        ? results.map(r => r.error).filter(Boolean).join('; ')
        : undefined,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Server error fetching Discord messages',
        channels: [],
      },
      { status: 500 }
    )
  }
}
