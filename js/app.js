// Importando módulos
import {
  validateYouTubeUrl,
  extractVideoId,
  getVideoInfo
} from './modules/youtube.js'
import { convertVideo } from './modules/converter.js'
import { showError, showSuccess } from './modules/ui.js'

// Elementos DOM
const form = document.getElementById('converter-form')
const urlInput = document.getElementById('youtube-url')
const pasteBtn = document.getElementById('paste-btn')
const resultContainer = document.getElementById('result-container')
const videoThumbnail = document.getElementById('video-thumbnail')
const videoTitle = document.getElementById('video-title')
const videoChannel = document.getElementById('video-channel')
const conversionStatus = document.getElementById('conversion-status')
const downloadContainer = document.getElementById('download-container')
const downloadLink = document.getElementById('download-link')
const qualitySelect = document.getElementById('quality-select')
const errorModal = new bootstrap.Modal(document.getElementById('error-modal'))
const errorMessage = document.getElementById('error-message')

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Botão de colar link
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText()
      urlInput.value = text.trim()
      // Validar imediatamente após colar
      if (validateYouTubeUrl(urlInput.value)) {
        fetchVideoInfo(urlInput.value)
      }
    } catch (error) {
      showError(
        'Não foi possível acessar a área de transferência. Por favor, cole o link manualmente.'
      )
    }
  })

  // Formulário de conversão
  form.addEventListener('submit', handleFormSubmit)

  // Validar URL ao sair do campo
  urlInput.addEventListener('blur', () => {
    if (urlInput.value && !validateYouTubeUrl(urlInput.value)) {
      showError('Por favor, insira um link válido do YouTube.')
    }
  })

  // Mostrar/esconder seletor de qualidade baseado no formato selecionado
  document.querySelectorAll('input[name="format"]').forEach(radio => {
    radio.addEventListener('change', e => {
      const isAudioOnly = ['mp3', 'wav'].includes(e.target.value)
      qualitySelect.parentElement.classList.toggle('d-none', isAudioOnly)
    })
  })

  // Verificar inicialmente se é formato de áudio
  const currentFormat = document.querySelector(
    'input[name="format"]:checked'
  ).value
  qualitySelect.parentElement.classList.toggle(
    'd-none',
    ['mp3', 'wav'].includes(currentFormat)
  )
})

// Buscar informações do vídeo ao inserir URL
async function fetchVideoInfo(url) {
  try {
    const videoId = extractVideoId(url)
    if (!videoId) return

    const videoInfo = await getVideoInfo(videoId)
    if (videoInfo) {
      videoThumbnail.src = videoInfo.thumbnail
      videoTitle.textContent = videoInfo.title
      videoChannel.textContent = videoInfo.channel
    }
  } catch (error) {
    console.error('Erro ao buscar informações do vídeo:', error)
  }
}

// Processar envio do formulário
async function handleFormSubmit(e) {
  e.preventDefault()

  const youtubeUrl = urlInput.value.trim()
  if (!validateYouTubeUrl(youtubeUrl)) {
    showError('Por favor, insira um link válido do YouTube.')
    return
  }

  const format = document.querySelector('input[name="format"]:checked').value
  const quality = qualitySelect.value

  // Exibir área de resultado
  resultContainer.classList.remove('d-none')
  conversionStatus.classList.remove('d-none')
  downloadContainer.classList.add('d-none')

  // Scroll para a área de resultado
  resultContainer.scrollIntoView({ behavior: 'smooth' })

  try {
    // Buscar informações do vídeo (caso ainda não tenha sido feito)
    if (!videoTitle.textContent) {
      await fetchVideoInfo(youtubeUrl)
    }

    // Iniciar conversão
    const result = await convertVideo(youtubeUrl, format, quality)

    // Exibir link de download
    conversionStatus.classList.add('d-none')
    downloadContainer.classList.remove('d-none')
    downloadLink.href = result.downloadUrl
    downloadLink.download = result.filename

    showSuccess('Conversão concluída com sucesso!')
  } catch (error) {
    conversionStatus.classList.add('d-none')
    errorMessage.textContent =
      error.message ||
      'Ocorreu um erro durante a conversão. Por favor, tente novamente.'
    errorModal.show()
  }
}

// Exportar funções para uso em outros módulos
export { showError }
