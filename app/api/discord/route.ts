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
  maxMessages: number = 500
): Promise<{ messages: DiscordMessage[]; error?: string }> {
  const allMessages: DiscordMessage[] = []
  let beforeId: string | undefined = undefined
  let hasMore = true

  try {
    while (hasMore && allMessages.length < maxMessages) {
      const batchSize = Math.min(100, maxMessages - allMessages.length)
      let url = `${DISCORD_API_BASE}/channels/${channelId}/messages?limit=${batchSize}`
      if (beforeId) {
        url += `&before=${beforeId}`
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        const errorText = await res.text()
        let errorMsg = `Discord API error: ${res.status}`
        try {
          const errorJson = JSON.parse(errorText)
          errorMsg = errorJson.message || errorMsg
        } catch {}
        // If we already have some messages, return what we have with the error
        if (allMessages.length > 0) {
          return { messages: allMessages, error: errorMsg }
        }
        return { messages: [], error: errorMsg }
      }

      const data = await res.json()

      if (!Array.isArray(data) || data.length === 0) {
        hasMore = false
        break
      }

      const batch: DiscordMessage[] = data.map((msg: any) => ({
        id: msg.id,
        content: msg.content || '',
        author: {
          username: msg.author?.username || 'Unknown',
          id: msg.author?.id || '',
        },
        timestamp: msg.timestamp || '',
        channel_id: channelId,
      }))

      allMessages.push(...batch)

      // If we got fewer than requested, there are no more messages
      if (data.length < batchSize) {
        hasMore = false
      } else {
        // Set the cursor to the oldest message ID for next page
        beforeId = data[data.length - 1].id
      }
    }

    return { messages: allMessages }
  } catch (error) {
    if (allMessages.length > 0) {
      return { messages: allMessages, error: error instanceof Error ? error.message : 'Partial fetch' }
    }
    return {
      messages: [],
      error: error instanceof Error ? error.message : 'Failed to fetch from Discord',
    }
  }
}

// Fetch all threads (archived + active) from a channel and their messages
async function fetchAllThreadsForChannel(
  channelId: string,
  botToken: string
): Promise<DiscordMessage[]> {
  const threadMessages: DiscordMessage[] = []
  const seenThreadIds = new Set<string>()

  // Helper to fetch messages from a list of threads
  async function fetchFromThreads(threads: any[]) {
    for (const thread of threads) {
      if (seenThreadIds.has(thread.id)) continue
      seenThreadIds.add(thread.id)
      const result = await fetchChannelMessages(thread.id, botToken, 500)
      if (result.messages.length > 0) {
        threadMessages.push(...result.messages)
      }
    }
  }

  // 1. Archived public threads
  try {
    const res = await fetch(
      `${DISCORD_API_BASE}/channels/${channelId}/threads/archived/public?limit=100`,
      { headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' } }
    )
    if (res.ok) {
      const data = await res.json()
      const threads = Array.isArray(data.threads) ? data.threads : []
      await fetchFromThreads(threads)
    }
  } catch {}

  // 2. Archived private threads
  try {
    const res = await fetch(
      `${DISCORD_API_BASE}/channels/${channelId}/threads/archived/private?limit=100`,
      { headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' } }
    )
    if (res.ok) {
      const data = await res.json()
      const threads = Array.isArray(data.threads) ? data.threads : []
      await fetchFromThreads(threads)
    }
  } catch {}

  return threadMessages
}

// Also fetch threads within a channel (forum/thread channels)
async function fetchThreadMessages(
  channelId: string,
  botToken: string,
  serverId?: string
): Promise<{ messages: DiscordMessage[]; error?: string }> {
  // Fetch direct channel messages with pagination (up to 500)
  const directResult = await fetchChannelMessages(channelId, botToken, 500)

  // Fetch threads within this channel
  const threadMessages = await fetchAllThreadsForChannel(channelId, botToken)

  // Also try active threads from the guild if serverId is provided
  if (serverId) {
    try {
      const activeRes = await fetch(
        `${DISCORD_API_BASE}/guilds/${serverId}/threads/active`,
        { headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' } }
      )
      if (activeRes.ok) {
        const activeData = await activeRes.json()
        const activeThreads = Array.isArray(activeData.threads) ? activeData.threads : []
        // Filter to threads belonging to this channel
        const channelThreads = activeThreads.filter((t: any) => t.parent_id === channelId)
        const seenIds = new Set(threadMessages.map(m => m.channel_id))
        for (const thread of channelThreads) {
          if (seenIds.has(thread.id)) continue
          const result = await fetchChannelMessages(thread.id, botToken, 500)
          if (result.messages.length > 0) {
            threadMessages.push(...result.messages)
          }
        }
      }
    } catch {}
  }

  // Deduplicate messages by ID
  const seenMsgIds = new Set<string>()
  const allMessages: DiscordMessage[] = []
  for (const msg of [...directResult.messages, ...threadMessages]) {
    if (!seenMsgIds.has(msg.id)) {
      seenMsgIds.add(msg.id)
      allMessages.push(msg)
    }
  }

  return { messages: allMessages, error: directResult.error }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bot_token, channel_ids, channel_labels, server_id } = body

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

      const { messages, error } = await fetchThreadMessages(channelId, bot_token, server_id)

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
