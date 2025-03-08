// api/video-info.js
const ytdl = require('ytdl-core')

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // Tratar requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
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

    // Obter informações básicas do vídeo
    const info = await ytdl.getInfo(url)

    // Formatar os dados para o frontend
    const videoInfo = {
      id: info.videoDetails.videoId,
      title: info.videoDetails.title,
      description: info.videoDetails.shortDescription,
      channelId: info.videoDetails.channelId,
      channelTitle: info.videoDetails.ownerChannelName,
      publishedAt: info.videoDetails.publishDate,
      duration: parseInt(info.videoDetails.lengthSeconds),
      viewCount: parseInt(info.videoDetails.viewCount),
      thumbnailUrl:
        info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]
          .url,
      formats: info.formats.map(format => ({
        itag: format.itag,
        quality: format.qualityLabel || format.audioQuality || 'unknown',
        mimeType: format.mimeType,
        container: format.container,
        hasAudio: format.hasAudio,
        hasVideo: format.hasVideo,
        contentLength: format.contentLength
      }))
    }

    res.status(200).json(videoInfo)
  } catch (error) {
    console.error('Error fetching video info:', error)
    res.status(500).json({
      error: 'Erro ao obter informações do vídeo',
      message: error.message
    })
  }
}
