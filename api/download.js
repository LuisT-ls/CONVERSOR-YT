// api/download.js
import youtubeDl from 'youtube-dl-exec'
import { createReadStream } from 'fs'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { pipeline } from 'stream/promises'

export default async function handler(req, res) {
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

  let tempFilePath = null

  try {
    const { videoId, formatId, format, title, quality } = req.query

    if (!videoId || !formatId) {
      return res.status(400).json({ error: 'Parâmetros de download inválidos' })
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`
    const sanitizedTitle = (title || 'download').replace(/[^\w\s-]/g, '_')

    // Definir cabeçalhos para download
    const contentType =
      format === 'mp3'
        ? 'audio/mpeg'
        : format === 'wav'
        ? 'audio/wav'
        : format === 'mp4'
        ? 'video/mp4'
        : format === 'webm'
        ? 'video/webm'
        : 'application/octet-stream'

    const fileName = `${sanitizedTitle}.${format}`

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)

    // Criar um arquivo temporário para download
    const tempFileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}.${format}`
    tempFilePath = join(tmpdir(), tempFileName)

    // Obter video/audio usando youtube-dl-exec
    let options = {
      output: tempFilePath,
      format: formatId
    }

    // Opções específicas para áudio
    if (format === 'mp3') {
      options.extractAudio = true
      options.audioFormat = 'mp3'
    } else if (format === 'wav') {
      options.extractAudio = true
      options.audioFormat = 'wav'
    }

    // Download via youtube-dl-exec
    await youtubeDl(url, options)

    // Streaming do arquivo para o cliente
    const fileStream = createReadStream(tempFilePath)
    await pipeline(fileStream, res)

    // Após o streaming, remove o arquivo temporário
    try {
      await unlink(tempFilePath)
      tempFilePath = null
    } catch (cleanupError) {
      console.error('Error removing temp file:', cleanupError)
    }
  } catch (error) {
    console.error('Download error:', error)

    // Tenta limpar o arquivo temporário em caso de erro
    if (tempFilePath) {
      try {
        await unlink(tempFilePath)
      } catch (cleanupError) {
        console.error(
          'Error removing temp file during error handling:',
          cleanupError
        )
      }
    }

    // Se os cabeçalhos já foram enviados, não podemos enviar um erro JSON
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Erro ao processar o download',
        message: error.message || 'Erro desconhecido'
      })
    } else {
      // Se os cabeçalhos já foram enviados, finalize o stream
      res.end()
    }
  }
}
