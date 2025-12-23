// api/video-info.js
import ytdl from '@distube/ytdl-core'

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // Tratar requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { url } = req.query

    if (!url) {
      return res.status(400).json({ error: 'URL do vídeo não fornecida' })
    }

    // Validar URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'URL do YouTube inválida' })
    }

    // Implementação com múltiplas tentativas
    let info
    let attempt = 0
    const maxAttempts = 3
    let lastError

    while (attempt < maxAttempts) {
      try {
        // Obter informações básicas do vídeo
        const requestOptions = {}
        if (process.env.YOUTUBE_COOKIES) {
          requestOptions.requestOptions = {
            headers: {
              Cookie: process.env.YOUTUBE_COOKIES
            }
          }
        }

        info = await ytdl.getInfo(url, requestOptions)
        break // Se bem-sucedido, saia do loop
      } catch (error) {
        lastError = error
        attempt++
        console.log(`Attempt ${attempt} failed: ${error.message}`)

        if (attempt < maxAttempts) {
          // Esperar um pouco antes da próxima tentativa
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    if (!info) {
      throw (
        lastError ||
        new Error(
          'Falha ao obter informações do vídeo após múltiplas tentativas'
        )
      )
    }

    // Formatar os dados para o frontend
    const videoInfo = {
      id: info.videoDetails.videoId,
      title: info.videoDetails.title,
      description: info.videoDetails.shortDescription || '',
      channelId: info.videoDetails.channelId || '',
      channelTitle:
        info.videoDetails.ownerChannelName || info.videoDetails.author || '',
      publishedAt: info.videoDetails.publishDate || '',
      duration: parseInt(info.videoDetails.lengthSeconds || '0'),
      viewCount: parseInt(info.videoDetails.viewCount || '0'),
      thumbnailUrl:
        info.videoDetails.thumbnails.length > 0
          ? info.videoDetails.thumbnails[
            info.videoDetails.thumbnails.length - 1
          ].url
          : `https://i.ytimg.com/vi/${info.videoDetails.videoId}/hqdefault.jpg`,
      formats: info.formats.map(format => ({
        itag: format.itag,
        quality: format.qualityLabel || format.audioQuality || 'unknown',
        mimeType: format.mimeType || '',
        container: format.container || '',
        hasAudio: !!format.hasAudio,
        hasVideo: !!format.hasVideo,
        url: format.url
      }))
    }

    return res.status(200).json(videoInfo)
  } catch (error) {
    console.error('Error fetching video info:', error)
    return res.status(500).json({
      error: 'Erro ao obter informações do vídeo',
      message: error.message || 'Erro desconhecido'
    })
  }
}
