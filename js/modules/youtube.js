/**
 * Módulo YouTube - Gerencia a interação com a API do YouTube
 *
 * Este módulo lida com a validação de URLs do YouTube e obtenção de
 * informações de vídeos. Para uma implementação real, seria necessário
 * utilizar a API oficial do YouTube.
 */

export class YouTube {
  constructor() {
    // Configuração
    this.apiKey = 'YOUR_YOUTUBE_API_KEY' // Seria configurado em um ambiente real
    this.apiBaseUrl = 'https://www.googleapis.com/youtube/v3'

    // Regex para validação de URLs do YouTube
    this.urlRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(\S*)?$/

    // Vincular métodos
    this.validateUrl = this.validateUrl.bind(this)
    this.getVideoInfo = this.getVideoInfo.bind(this)
    this.extractVideoId = this.extractVideoId.bind(this)
    this.simulateApiRequest = this.simulateApiRequest.bind(this)
  }

  /**
   * Valida se a URL é do YouTube
   * @param {string} url - URL a ser validada
   * @returns {boolean} - Verdadeiro se a URL for válida
   */
  validateUrl(url) {
    return this.urlRegex.test(url)
  }

  /**
   * Extrai o ID do vídeo da URL do YouTube
   * @param {string} url - URL do YouTube
   * @returns {string} - ID do vídeo
   */
  extractVideoId(url) {
    const match = url.match(this.urlRegex)
    return match ? match[4] : null
  }

  /**
   * Obtém informações do vídeo
   * @param {string} url - URL do vídeo do YouTube
   * @returns {Promise<Object>} - Informações do vídeo
   */
  async getVideoInfo(url) {
    try {
      if (!this.validateUrl(url)) {
        throw new Error('URL do YouTube inválida')
      }

      // Fazer requisição ao backend serverless que obtém os dados do vídeo
      const response = await fetch(
        `/api/video-info?url=${encodeURIComponent(url)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.message || `Erro ao obter informações: ${response.status}`
        )
      }

      const videoInfo = await response.json()
      return videoInfo
    } catch (error) {
      console.error('Error getting video info:', error)
      throw new Error(
        'Não foi possível obter informações do vídeo. Por favor, verifique a URL e tente novamente.'
      )
    }
  }

  /**
   * Simula uma requisição à API do YouTube
   * @param {string} videoId - ID do vídeo
   * @returns {Promise<Object>} - Informações simuladas do vídeo
   */
  simulateApiRequest(videoId) {
    return new Promise(resolve => {
      // Simular tempo de resposta da API (0.5-1.5 segundos)
      const responseTime = 500 + Math.random() * 1000

      setTimeout(() => {
        // Gerar um título aleatório para demonstração
        const titles = [
          'Como Criar um Site do Zero',
          'Aprenda JavaScript em 1 Hora',
          'Tutorial de CSS Avançado',
          'As Melhores Práticas de Programação',
          'HTML5 para Iniciantes'
        ]

        // Gerar um canal aleatório
        const channels = [
          'DevMaster',
          'Código Fácil',
          'Programação Web',
          'TechTutorials',
          'WebDev Pro'
        ]

        // Informações simuladas do vídeo
        const videoInfo = {
          id: videoId,
          title: titles[Math.floor(Math.random() * titles.length)],
          description:
            'Esta é uma descrição simulada do vídeo para fins de demonstração.',
          channelId: 'UC' + Math.random().toString(36).substring(2, 12),
          channelTitle: channels[Math.floor(Math.random() * channels.length)],
          publishedAt: new Date(
            Date.now() - Math.random() * 31536000000
          ).toISOString(), // Data aleatória no último ano
          duration: Math.floor(300 + Math.random() * 600), // 5-15 minutos em segundos
          viewCount: Math.floor(1000 + Math.random() * 1000000),
          likeCount: Math.floor(100 + Math.random() * 50000),
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
          tags: ['web', 'tutorial', 'programação', 'desenvolvimento']
        }

        resolve(videoInfo)
      }, responseTime)
    })
  }

  /**
   * Verifica disponibilidade do vídeo para conversão
   * @param {string} videoId - ID do vídeo
   * @returns {Promise<Object>} - Status de disponibilidade e restrições
   */
  async checkVideoAvailability(videoId) {
    // Simular verificação de disponibilidade
    return new Promise(resolve => {
      setTimeout(() => {
        // Simulação: 95% dos vídeos estão disponíveis
        const isAvailable = Math.random() > 0.05

        const result = {
          available: isAvailable,
          restrictions: []
        }

        // Se não estiver disponível, adicionar uma razão
        if (!isAvailable) {
          const reasons = [
            'O vídeo contém conteúdo protegido por direitos autorais',
            'O vídeo está restrito geograficamente',
            'O vídeo requer login',
            'O conteúdo não está disponível para download'
          ]

          result.restrictions.push(
            reasons[Math.floor(Math.random() * reasons.length)]
          )
        }

        resolve(result)
      }, 500)
    })
  }

  /**
   * Obtém formatos disponíveis para um vídeo
   * @param {string} videoId - ID do vídeo
   * @returns {Promise<Array>} - Lista de formatos disponíveis
   */
  async getAvailableFormats(videoId) {
    // Simular obtenção de formatos disponíveis
    return new Promise(resolve => {
      setTimeout(() => {
        // Formatos padrão sempre disponíveis
        const formats = [
          {
            format: 'mp3',
            quality: 'high',
            bitrate: '320kbps',
            extension: 'mp3',
            type: 'audio'
          },
          {
            format: 'mp4',
            quality: 'low',
            resolution: '480p',
            extension: 'mp4',
            type: 'video'
          },
          {
            format: 'mp4',
            quality: 'medium',
            resolution: '720p',
            extension: 'mp4',
            type: 'video'
          }
        ]

        // Aleatoriamente adicionar formatos de alta qualidade
        if (Math.random() > 0.3) {
          formats.push({
            format: 'mp4',
            quality: 'high',
            resolution: '1080p',
            extension: 'mp4',
            type: 'video'
          })
        }

        // Aleatoriamente adicionar mais formatos
        if (Math.random() > 0.5) {
          formats.push({
            format: 'webm',
            quality: 'medium',
            resolution: '720p',
            extension: 'webm',
            type: 'video'
          })

          formats.push({
            format: 'wav',
            quality: 'high',
            bitrate: 'lossless',
            extension: 'wav',
            type: 'audio'
          })
        }

        resolve(formats)
      }, 700)
    })
  }
}
