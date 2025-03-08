// api/download.js
const ytdl = require('ytdl-core')
const stream = require('stream')
const { promisify } = require('util')
const pipeline = promisify(stream.pipeline)

module.exports = async (req, res) => {
  // Configurar CORS para preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    return res.status(200).end()
  }

  try {
    const { videoId, itag, format, title } = req.query

    if (!videoId || !itag) {
      return res.status(400).json({ error: 'Parâmetros de download inválidos' })
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`

    // Definir cabeçalhos para fazer download
    const contentType =
      format === 'mp3'
        ? 'audio/mpeg'
        : format === 'wav'
        ? 'audio/wav'
        : 'application/octet-stream'

    const fileName = `${title || 'download'}.${format}`

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

    // Criar stream do YouTube
    const videoStream = ytdl(url, {
      quality: itag,
      filter:
        format === 'mp3' || format === 'wav' ? 'audioonly' : 'audioandvideo'
    })

    // Para MP3/WAV precisaríamos de conversão via ffmpeg
    // Como não podemos usar ffmpeg no ambiente serverless do Vercel,
    // estamos fornecendo o áudio bruto que o navegador pode reproduzir

    // Enviar o stream para o cliente
    await pipeline(videoStream, res)
  } catch (error) {
    console.error('Download error:', error)

    // Se os cabeçalhos já foram enviados, não podemos enviar um erro JSON
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Erro ao processar o download',
        message: error.message
      })
    } else {
      // Se os cabeçalhos já foram enviados, finalize o stream
      res.end()
    }
  }
}
