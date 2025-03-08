// api/video-info.js
import youtubeDl from 'youtube-dl-exec'
import { getInfo } from 'dlinfo'

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

    // Validar URL - verificação simples se contém youtube.com ou youtu.be
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return res.status(400).json({ error: 'URL do YouTube inválida' })
    }

    try {
      // Tentar primeiro usando dlinfo (mais leve e rápido)
      const info = await getInfo(url)

      // Formatar os dados para o frontend
      const videoInfo = {
        id: info.id,
        title: info.title,
        description: info.description || '',
        channelId: info.uploader_id || '',
        channelTitle: info.uploader || '',
        publishedAt: info.upload_date || '',
        duration: info.duration || 0,
        viewCount: info.view_count || 0,
        thumbnailUrl:
          info.thumbnail || `https://i.ytimg.com/vi/${info.id}/hqdefault.jpg`,
        formats:
          info.formats?.map(format => ({
            formatId: format.format_id,
            formatNote: format.format_note || '',
            ext: format.ext || '',
            resolution: format.resolution || '',
            fps: format.fps || '',
            vcodec: format.vcodec || '',
            acodec: format.acodec || '',
            filesize: format.filesize || ''
          })) || []
      }

      return res.status(200).json(videoInfo)
    } catch (dlinfoError) {
      console.error(
        'dlinfo error, trying youtube-dl-exec as fallback:',
        dlinfoError
      )

      // Fallback para youtube-dl-exec
      const output = await youtubeDl(url, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true
      })

      // Formatar os dados para o frontend
      const videoInfo = {
        id: output.id,
        title: output.title,
        description: output.description || '',
        channelId: output.channel_id || '',
        channelTitle: output.channel || '',
        publishedAt: output.upload_date || '',
        duration: output.duration || 0,
        viewCount: output.view_count || 0,
        thumbnailUrl:
          output.thumbnail ||
          `https://i.ytimg.com/vi/${output.id}/hqdefault.jpg`,
        formats:
          output.formats?.map(format => ({
            formatId: format.format_id,
            formatNote: format.format_note || '',
            ext: format.ext || '',
            resolution: format.resolution || '',
            fps: format.fps || '',
            vcodec: format.vcodec || '',
            acodec: format.acodec || '',
            filesize: format.filesize || ''
          })) || []
      }

      return res.status(200).json(videoInfo)
    }
  } catch (error) {
    console.error('Error fetching video info:', error)
    res.status(500).json({
      error: 'Erro ao obter informações do vídeo',
      message: error.message || 'Erro desconhecido'
    })
  }
}
