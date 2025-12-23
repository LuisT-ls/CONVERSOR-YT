// api/convert.js
import ytdl from '@distube/ytdl-core'

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // Tratar requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
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
    const agentOptions = {
      keepAlive: true,
      keepAliveMsecs: 500,
    };

    if (process.env.YOUTUBE_COOKIES) {
      try {
        const cookies = process.env.YOUTUBE_COOKIES.split(';').map(c => {
          const [key, ...v] = c.trim().split('=');
          return { name: key, value: v.join('=') };
        });
        agentOptions.cookies = cookies;
      } catch (e) {
        console.error('Error parsing cookies:', e);
      }
    }

    const agent = ytdl.createAgent(agentOptions.cookies || []);
    const info = await ytdl.getInfo(url, { agent });

    // Obter formato baseado na seleção do usuário
    const formatOptions = getFormatOptions(format, quality, info)

    if (!formatOptions) {
      return res
        .status(400)
        .json({ error: 'Formato ou qualidade não disponíveis para este vídeo' })
    }

    // Retornar informações sobre o download
    return res.status(200).json({
      success: true,
      format: format,
      videoId: info.videoDetails.videoId,
      title: info.videoDetails.title,
      quality: quality,
      downloadUrl: formatOptions.url,
      itag: formatOptions.itag
    })
  } catch (error) {
    console.error('Error processing conversion:', error)
    return res.status(500).json({
      error: 'Erro ao processar a conversão',
      message: error.message || 'Erro desconhecido'
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

    // Ordenar por qualidade
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
