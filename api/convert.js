// api/convert.js
const ytdl = require('ytdl-core')

module.exports = async (req, res) => {
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

    // Validar URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'URL do YouTube inválida' })
    }

    // Obter informações do vídeo
    const info = await ytdl.getInfo(url)

    // Obter formato baseado na seleção do usuário
    const formatOptions = getFormatOptions(format, quality, info)

    if (!formatOptions) {
      return res
        .status(400)
        .json({ error: 'Formato ou qualidade não disponíveis para este vídeo' })
    }

    // Para MP3 e formatos de áudio, não podemos fornecer um link direto devido às limitações do ytdl-core no serverless
    // Em vez disso, fornecemos instruções para o frontend implementar um proxy de download
    if (format === 'mp3' || format === 'wav') {
      return res.status(200).json({
        success: true,
        downloadType: 'audio',
        format: format,
        videoId: info.videoDetails.videoId,
        title: info.videoDetails.title,
        itag: formatOptions.itag,
        contentLength: formatOptions.contentLength,
        // O frontend usará esta URL para implementar o download via proxy
        downloadUrl: `/api/download?videoId=${info.videoDetails.videoId}&itag=${
          formatOptions.itag
        }&format=${format}&title=${encodeURIComponent(info.videoDetails.title)}`
      })
    } else {
      // Para vídeos, podemos fornecer um link direto
      return res.status(200).json({
        success: true,
        downloadType: 'video',
        format: format,
        videoId: info.videoDetails.videoId,
        title: info.videoDetails.title,
        quality: quality,
        // Link direto para download de vídeo
        downloadUrl: formatOptions.url,
        contentLength: formatOptions.contentLength
      })
    }
  } catch (error) {
    console.error('Error processing conversion:', error)
    res.status(500).json({
      error: 'Erro ao processar a conversão',
      message: error.message
    })
  }
}

// Função para selecionar o formato apropriado com base nas preferências do usuário
function getFormatOptions(format, quality, info) {
  const formats = info.formats

  // Para formatos de áudio (MP3, WAV)
  if (format === 'mp3' || format === 'wav') {
    // Buscar o formato de áudio de melhor qualidade
    const audioFormats = formats
      .filter(f => f.hasAudio && (!f.hasVideo || f.hasVideo === false))
      .sort((a, b) => {
        // Ordenar pela qualidade de áudio (audioBitrate)
        return (b.audioBitrate || 0) - (a.audioBitrate || 0)
      })

    if (audioFormats.length > 0) {
      return {
        itag: audioFormats[0].itag,
        url: audioFormats[0].url,
        contentLength: audioFormats[0].contentLength
      }
    }
  }
  // Para formatos de vídeo (MP4, WEBM)
  else if (format === 'mp4' || format === 'webm') {
    const container = format

    // Filtrar formatos pelo container (mp4 ou webm)
    let videoFormats = formats.filter(
      f => f.container === container && f.hasVideo
    )

    // Se não encontrar formatos específicos para o container, use qualquer formato com vídeo
    if (videoFormats.length === 0) {
      videoFormats = formats.filter(f => f.hasVideo)
    }

    // Filtrar por qualidade
    let qualityFiltered = []

    if (quality === 'highest') {
      qualityFiltered = videoFormats.filter(
        f =>
          f.qualityLabel &&
          (f.qualityLabel.includes('1080p') ||
            f.qualityLabel.includes('2160p') ||
            f.qualityLabel.includes('1440p'))
      )
    } else if (quality === 'medium') {
      qualityFiltered = videoFormats.filter(
        f =>
          f.qualityLabel &&
          (f.qualityLabel.includes('720p') || f.qualityLabel.includes('480p'))
      )
    } else if (quality === 'lowest') {
      qualityFiltered = videoFormats.filter(
        f =>
          f.qualityLabel &&
          (f.qualityLabel.includes('360p') ||
            f.qualityLabel.includes('240p') ||
            f.qualityLabel.includes('144p'))
      )
    }

    // Se não encontrar formatos com a qualidade especificada, use qualquer formato de vídeo
    if (qualityFiltered.length === 0) {
      qualityFiltered = videoFormats
    }

    // Ordenar por qualidade (menor resolução = menor índice)
    qualityFiltered.sort((a, b) => {
      // Extrair a resolução numérica, se disponível
      const getResolution = q => {
        if (!q.qualityLabel) return 0
        const match = q.qualityLabel.match(/(\d+)p/)
        return match ? parseInt(match[1]) : 0
      }

      return getResolution(b) - getResolution(a)
    })

    if (qualityFiltered.length > 0) {
      return {
        itag: qualityFiltered[0].itag,
        url: qualityFiltered[0].url,
        contentLength: qualityFiltered[0].contentLength
      }
    }
  }

  // Se não encontrar um formato específico, use qualquer formato disponível
  if (formats.length > 0) {
    return {
      itag: formats[0].itag,
      url: formats[0].url,
      contentLength: formats[0].contentLength
    }
  }

  return null
}
