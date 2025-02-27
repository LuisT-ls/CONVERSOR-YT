/**
 * Módulo para gerenciar elementos da interface do usuário
 */

// Função para exibir mensagens de erro
export function showError(message) {
  const errorModal = new bootstrap.Modal(document.getElementById('error-modal'))
  const errorMessage = document.getElementById('error-message')

  errorMessage.textContent = message
  errorModal.show()
}

// Função para exibir mensagens de sucesso
export function showSuccess(message) {
  // Criar um toast de notificação
  const toastContainer = document.createElement('div')
  toastContainer.className = 'position-fixed bottom-0 end-0 p-3'
  toastContainer.style.zIndex = '11'

  const toastHtml = `
    <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header bg-success text-white">
        <i class="fas fa-check-circle me-2"></i>
        <strong class="me-auto">Sucesso</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    </div>
  `

  toastContainer.innerHTML = toastHtml
  document.body.appendChild(toastContainer)

  // Configurar o toast
  const toastElement = toastContainer.querySelector('.toast')
  const toast = new bootstrap.Toast(toastElement, {
    autohide: true,
    delay: 5000
  })

  // Remover o toast após fechamento
  toastElement.addEventListener('hidden.bs.toast', () => {
    document.body.removeChild(toastContainer)
  })

  toast.show()
}

// Função para mostrar indicador de carregamento
export function showLoading(element, message = 'Carregando...') {
  element.innerHTML = `
    <div class="d-flex align-items-center">
      <div class="spinner-border spinner-border-sm me-2" role="status"></div>
      <span>${message}</span>
    </div>
  `
}

// Função para limpar indicador de carregamento
export function hideLoading(element, originalContent) {
  element.innerHTML = originalContent
}
