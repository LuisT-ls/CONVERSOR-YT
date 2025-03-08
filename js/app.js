/**
 * Conversor YouTube - Script Principal
 *
 * Este é o arquivo JavaScript principal que inicializa a aplicação
 * e coordena a interação entre os diferentes módulos.
 */

// Importar módulos
import { UI } from './modules/ui.js'
import { YouTube } from './modules/youtube.js'
import { Converter } from './modules/converter.js'

class App {
  constructor() {
    // Inicializar módulos
    this.ui = new UI()
    this.youtube = new YouTube()
    this.converter = new Converter()

    // Vincular métodos para manter o contexto
    this.handleFormSubmit = this.handleFormSubmit.bind(this)
    this.handlePasteButton = this.handlePasteButton.bind(this)
    this.handleDownload = this.handleDownload.bind(this)
    this.handleFormatChange = this.handleFormatChange.bind(this)
    this.init = this.init.bind(this)

    // Inicializar a aplicação
    this.init()
  }

  /**
   * Inicializa a aplicação e configura os event listeners
   */
  init() {
    // Evento de envio do formulário
    document
      .getElementById('converter-form')
      .addEventListener('submit', this.handleFormSubmit)

    // Evento do botão de colar
    document
      .getElementById('paste-btn')
      .addEventListener('click', this.handlePasteButton)

    // Evento de alteração de formato
    const formatRadios = document.querySelectorAll('input[name="format"]')
    formatRadios.forEach(radio => {
      radio.addEventListener('change', this.handleFormatChange)
    })

    // Inicializar UI
    this.ui.initThemeToggle()
    this.ui.initAnimations()

    // Verificar modo escuro do sistema
    this.ui.checkSystemTheme()

    // Iniciar com foco no campo de URL
    document.getElementById('youtube-url').focus()

    console.log('App initialized successfully')
  }

  /**
   * Manipula o envio do formulário de conversão
   * @param {Event} event - O evento de submit do formulário
   */
  async handleFormSubmit(event) {
    event.preventDefault()

    // Obter valores do formulário
    const youtubeUrl = document.getElementById('youtube-url').value
    const format = document.querySelector('input[name="format"]:checked').value
    const quality = document.getElementById('quality-select').value

    // Validar URL
    if (!this.youtube.validateUrl(youtubeUrl)) {
      this.ui.showError(
        'URL inválida. Por favor, insira um link do YouTube válido.'
      )
      return
    }

    try {
      // Mostrar área de resultado e status de conversão
      this.ui.showResultContainer()
      this.ui.updateConversionStatus(
        'Obtendo informações do vídeo...',
        'loading'
      )

      // Obter informações do vídeo
      const videoInfo = await this.youtube.getVideoInfo(youtubeUrl)

      // Atualizar interface com informações do vídeo
      this.ui.updateVideoInfo(videoInfo)

      // Iniciar processo de conversão
      this.ui.updateConversionStatus('Convertendo vídeo...', 'loading')
      const downloadUrl = await this.converter.convert(
        youtubeUrl,
        format,
        quality
      )

      // Conversão concluída com sucesso
      this.ui.updateConversionStatus(
        'Conversão concluída com sucesso!',
        'success'
      )
      this.ui.showDownloadButton(downloadUrl, `${videoInfo.title}.${format}`)
    } catch (error) {
      console.error('Error during conversion:', error)
      this.ui.updateConversionStatus(
        `Erro ao converter vídeo: ${error.message}`,
        'error'
      )
    }
  }

  /**
   * Manipula o clique no botão de colar
   */
  async handlePasteButton() {
    try {
      const text = await navigator.clipboard.readText()
      document.getElementById('youtube-url').value = text
    } catch (error) {
      this.ui.showError(
        'Não foi possível acessar a área de transferência. Por favor, verifique as permissões do navegador.'
      )
    }
  }

  /**
   * Manipula a alteração do formato selecionado
   */
  handleFormatChange(event) {
    const format = event.target.value
    const qualitySelect = document.getElementById('quality-select')

    // Mostrar ou ocultar seleção de qualidade com base no formato
    if (format === 'mp3' || format === 'wav') {
      qualitySelect.parentElement.style.display = 'none'
    } else {
      qualitySelect.parentElement.style.display = 'block'
    }
  }

  /**
   * Manipula o clique no botão de download
   */
  handleDownload() {
    // Registrar estatísticas de download ou eventos de análise aqui
    console.log('Download initiated')
  }
}

// Inicializar a aplicação quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', () => {
  const app = new App()
})

// Exportar a classe App para possível reutilização
export { App }
