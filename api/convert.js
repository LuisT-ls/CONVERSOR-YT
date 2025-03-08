// api/convert.js
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

  // Verifica se é uma requisição POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    // Obter dados do corpo da requisição
    const { url, format, quality } = req.body

    if (!url || !format) {
      return res.status(400).json({ error: 'URL ou formato não fornecidos' })
    }

    // Validar URL - verificação simples
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return res.status(400).json({ error: 'URL do YouTube inválida' })
    }

    let videoInfo

    try {
      // Primeiro, tente obter informações usando dlinfo
      const info = await getInfo(url)
      videoInfo = {
        id: info.id,
        title: info.title,
        formats: info.formats || []
      }
    } catch (dlinfoError) {
      console.error('dlinfo error, trying youtube-dl-exec:', dlinfoError)

      // Fallback para youtube-dl-exec
      const output = await youtubeDl(url, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true
      })

      videoInfo = {
        id: output.id,
        title: output.title,
        formats: output.formats || []
      }
    }

    // Obter formato e URL de download baseado na seleção do usuário
    const formatOptions = getFormatOptions(format, quality, videoInfo)

    if (!formatOptions) {
      return res
        .status(400)
        .json({ error: 'Formato ou qualidade não disponíveis para este vídeo' })
    }

    // Para todos os formatos, usamos o endpoint de download
    return res.status(200).json({
      success: true,
      format: format,
      videoId: videoInfo.id,
      title: videoInfo.title,
      formatId: formatOptions.formatId,
      // O frontend usará esta URL para implementar o download via proxy
      downloadUrl: `/api/download?videoId=${
        videoInfo.id
      }&format=${format}&formatId=${
        formatOptions.formatId
      }&title=${encodeURIComponent(videoInfo.title)}&quality=${quality}`
    })
  } catch (error) {
    console.error('Error processing conversion:', error)
    res.status(500).json({
      error: 'Erro ao processar a conversão',
      message: error.message || 'Erro desconhecido'
    })
  }
}

// Função para selecionar o formato apropriado com base nas preferências do usuário
function getFormatOptions(format, quality, videoInfo) {
  const formats = videoInfo.formats

  if (!formats || formats.length === 0) {
    return null
  }

  // Para formatos de áudio (MP3, WAV)
  if (format === 'mp3' || format === 'wav') {
    // Filtrar formatos de áudio
    const audioFormats = formats.filter(
      f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none')
    )

    if (audioFormats.length > 0) {
      // Ordena por qualidade (assumindo que formatos com maior bitrate vêm primeiro)
      const sorted = [...audioFormats].sort((a, b) => {
        // Tentamos extrair bitrate se disponível
        const getBitrate = format => {
          if (format.abr) return format.abr
          if (format.tbr) return format.tbr

          // Tentar extrair do format_note (ex: "medium", "high")
          if (format.format_note) {
            if (format.format_note.includes('high')) return 3
            if (format.format_note.includes('medium')) return 2
            if (format.format_note.includes('low')) return 1
          }
          return 0
        }

        return getBitrate(b) - getBitrate(a)
      })

      return {
        formatId: sorted[0].format_id,
        ext: sorted[0].ext
      }
    }
  }
  // Para formatos de vídeo (MP4, WEBM)
  else {
    // Filtrar por extensão
    const extFilter = format === 'mp4' ? 'mp4' : 'webm'
    let videoFormats = formats.filter(
      f => f.ext === extFilter && f.vcodec && f.vcodec !== 'none'
    )

    // Se não encontrar formatos com a extensão desejada, use qualquer formato
    if (videoFormats.length === 0) {
      videoFormats = formats.filter(f => f.vcodec && f.vcodec !== 'none')
    }

    // Filtrar por qualidade
    let qualityFiltered = []

    const getResolution = format => {
      if (format.height) return format.height
      if (format.resolution) {
        const match = format.resolution.match(/(\d+)[xX](\d+)/)
        return match ? parseInt(match[2]) : 0
      }

      // Tentar extrair da format_note (ex: "720p", "1080p")
      if (format.format_note) {
        const match = format.format_note.match(/(\d+)p/)
        return match ? parseInt(match[1]) : 0
      }

      return 0
    }

    if (quality === 'highest') {
      // 1080p ou maior
      qualityFiltered = videoFormats.filter(f => getResolution(f) >= 1080)
    } else if (quality === 'medium') {
      // 720p ou 480p
      qualityFiltered = videoFormats.filter(f => {
        const res = getResolution(f)
        return res >= 480 && res < 1080
      })
    } else if (quality === 'lowest') {
      // 360p ou menor
      qualityFiltered = videoFormats.filter(f => getResolution(f) < 480)
    }

    // Se não encontrar formatos com a qualidade especificada, use qualquer formato de vídeo
    if (qualityFiltered.length === 0) {
      qualityFiltered = videoFormats
    }

    // Ordenar por qualidade
    qualityFiltered.sort((a, b) => getResolution(b) - getResolution(a))

    if (qualityFiltered.length > 0) {
      return {
        formatId: qualityFiltered[0].format_id,
        ext: qualityFiltered[0].ext
      }
    }
  }

  // Se não encontrar um formato específico, use o primeiro formato disponível
  return {
    formatId: formats[0].format_id,
    ext: formats[0].ext
  }
}
