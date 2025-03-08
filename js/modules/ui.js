/**
 * Módulo UI - Gerencia a interface do usuário
 */

export class UI {
  constructor() {
    // Elementos da UI
    this.resultContainer = document.getElementById('result-container')
    this.conversionStatus = document.getElementById('conversion-status')
    this.downloadContainer = document.getElementById('download-container')
    this.errorModal = document.getElementById('error-modal')
    this.errorMessage = document.getElementById('error-message')

    // Vincular métodos
    this.showResultContainer = this.showResultContainer.bind(this)
    this.updateVideoInfo = this.updateVideoInfo.bind(this)
    this.updateConversionStatus = this.updateConversionStatus.bind(this)
    this.showDownloadButton = this.showDownloadButton.bind(this)
    this.showError = this.showError.bind(this)
    this.closeErrorModal = this.closeErrorModal.bind(this)
    this.initThemeToggle = this.initThemeToggle.bind(this)
    this.toggleTheme = this.toggleTheme.bind(this)
    this.checkSystemTheme = this.checkSystemTheme.bind(this)
    this.initAnimations = this.initAnimations.bind(this)

    // Inicializar manipuladores de eventos para o modal
    this.initModalHandlers()
  }

  /**
   * Inicializa os manipuladores de eventos para o modal de erro
   */
  initModalHandlers() {
    // Encontrar todos os botões que fecham o modal
    const closeButtons = document.querySelectorAll('[data-close-modal]')
    closeButtons.forEach(button => {
      button.addEventListener('click', this.closeErrorModal)
    })

    // Permitir fechar o modal ao clicar fora dele
    this.errorModal.addEventListener('click', event => {
      if (event.target === this.errorModal) {
        this.closeErrorModal()
      }
    })

    // Permitir fechar o modal com a tecla ESC
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.errorModal.open) {
        this.closeErrorModal()
      }
    })
  }

  /**
   * Mostra o container de resultado
   */
  showResultContainer() {
    this.resultContainer.hidden = false
    this.resultContainer.classList.add('animate-fade-in')
    this.downloadContainer.hidden = true
  }

  /**
   * Atualiza as informações do vídeo na UI
   * @param {Object} videoInfo - Informações do vídeo
   */
  updateVideoInfo(videoInfo) {
    document.getElementById('video-title').textContent = videoInfo.title
    document.getElementById('video-channel').textContent =
      videoInfo.channelTitle

    const thumbnail = document.getElementById('video-thumbnail')
    thumbnail.src = videoInfo.thumbnailUrl
    thumbnail.alt = videoInfo.title
  }

  /**
   * Atualiza o status de conversão
   * @param {string} message - Mensagem de status
   * @param {string} type - Tipo de status ('loading', 'success', 'error')
   */
  updateConversionStatus(message, type) {
    // Remover classes de status existentes
    this.conversionStatus.classList.remove('success', 'error')

    // Definir conteúdo HTML com base no tipo
    let html = ''

    switch (type) {
      case 'loading':
        html = `
          <div class="loader-container">
            <div class="loader" aria-hidden="true"></div>
            <span>${message}</span>
          </div>
        `
        break
      case 'success':
        html = `
          <div class="loader-container">
            <i class="fas fa-check-circle" aria-hidden="true"></i>
            <span>${message}</span>
          </div>
        `
        this.conversionStatus.classList.add('success')
        break
      case 'error':
        html = `
          <div class="loader-container">
            <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
            <span>${message}</span>
          </div>
        `
        this.conversionStatus.classList.add('error')
        break
    }

    this.conversionStatus.innerHTML = html
  }

  /**
   * Mostra o botão de download
   * @param {string} url - URL para download
   * @param {string} filename - Nome do arquivo
   */
  showDownloadButton(url, filename) {
    const downloadLink = document.getElementById('download-link')
    downloadLink.href = url

    // Não usar o atributo download para permitir que o navegador abra diretamente
    // No caso de vídeos, isso permitirá que o navegador os reproduza
    // Para áudio, pode abrir o player de áudio do navegador

    this.downloadContainer.hidden = false
    this.downloadContainer.classList.add('animate-fade-in')

    // Adicionar ouvinte de eventos para rastreamento de análise
    downloadLink.addEventListener('click', () => {
      console.log(`Download started: ${filename}`)
      // Abrir em uma nova aba
      window.open(url, '_blank')
      return false // Prevenir o comportamento padrão
    })
  }

  /**
   * Mostra mensagem de erro no modal
   * @param {string} message - Mensagem de erro
   */
  showError(message) {
    this.errorMessage.textContent = message
    this.errorModal.showModal()
    this.errorModal.classList.add('modal-animate-in')
  }

  /**
   * Fecha o modal de erro
   */
  closeErrorModal() {
    this.errorModal.classList.add('modal-animate-out')

    // Esperar o fim da animação antes de fechar o modal
    setTimeout(() => {
      this.errorModal.close()
      this.errorModal.classList.remove('modal-animate-out', 'modal-animate-in')
    }, 300)
  }

  /**
   * Inicializa o botão de alternar tema
   */
  initThemeToggle() {
    // Criar o botão de toggle se ainda não existir
    if (!document.querySelector('.theme-toggle')) {
      const themeToggle = document.createElement('button')
      themeToggle.className = 'theme-toggle'
      themeToggle.setAttribute('aria-label', 'Alternar tema claro/escuro')
      themeToggle.innerHTML = `
        <i class="fas fa-moon moon-icon" aria-hidden="true"></i>
        <i class="fas fa-sun sun-icon" aria-hidden="true"></i>
      `

      document.body.appendChild(themeToggle)
      themeToggle.addEventListener('click', this.toggleTheme)
    }
  }

  /**
   * Alterna entre tema claro e escuro
   */
  toggleTheme() {
    // Adicionar classe de transição antes de alternar o tema
    document.body.classList.add('theme-transition')

    if (document.body.getAttribute('data-theme') === 'dark') {
      document.body.setAttribute('data-theme', 'light')
      localStorage.setItem('theme', 'light')
    } else {
      document.body.setAttribute('data-theme', 'dark')
      localStorage.setItem('theme', 'dark')
    }

    // Remover classe de transição após a conclusão
    setTimeout(() => {
      document.body.classList.remove('theme-transition')
    }, 300)
  }

  /**
   * Verifica tema preferido do sistema
   */
  checkSystemTheme() {
    // Verificar preferência do usuário armazenada
    const savedTheme = localStorage.getItem('theme')

    if (savedTheme) {
      document.body.setAttribute('data-theme', savedTheme)
    } else if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      // Se não houver preferência salva, verificar preferência do sistema
      document.body.setAttribute('data-theme', 'dark')
    }

    // Ouvir mudanças na preferência do sistema
    if (window.matchMedia) {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', e => {
          if (!localStorage.getItem('theme')) {
            document.body.setAttribute(
              'data-theme',
              e.matches ? 'dark' : 'light'
            )
          }
        })
    }
  }

  /**
   * Inicializa animações na interface
   */
  initAnimations() {
    // Animar cards de recursos ao rolar
    const featureCards = document.querySelectorAll('.feature-card')

    if (featureCards.length > 0) {
      // Criar um observador de interseção
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate')
              observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.1 }
      )

      // Observar cada card
      featureCards.forEach(card => {
        observer.observe(card)
      })
    }

    // Adicionar botão "Voltar ao topo" se a página for longa
    if (document.body.scrollHeight > window.innerHeight * 2) {
      this.addBackToTopButton()
    }
  }

  /**
   * Adiciona botão "Voltar ao topo"
   */
  addBackToTopButton() {
    const backToTopBtn = document.createElement('button')
    backToTopBtn.className = 'back-to-top'
    backToTopBtn.setAttribute('aria-label', 'Voltar ao topo')
    backToTopBtn.innerHTML =
      '<i class="fas fa-arrow-up" aria-hidden="true"></i>'

    document.body.appendChild(backToTopBtn)

    // Mostrar botão quando rolar para baixo
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible')
      } else {
        backToTopBtn.classList.remove('visible')
      }
    })

    // Ação de clique para rolar para o topo
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    })
  }
}
