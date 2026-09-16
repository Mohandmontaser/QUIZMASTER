class UIControls {
  constructor() {
    this.selects = document.querySelectorAll('.custom-select');
    this.numberButtons = document.querySelectorAll('.number-btn');
  }

  init() {
    this.initCustomSelects();
    this.initNumberInputs();
    document.addEventListener('click', this.closeAllSelects.bind(this));
  }

  initCustomSelects() {
    this.selects.forEach((select) => {
      const trigger = select.querySelector('.custom-select-trigger');
      const options = select.querySelectorAll('.custom-select-option');
      const hiddenInput = select.parentElement.querySelector('input[type="hidden"]');
      const text = trigger.querySelector('.custom-select-text');
      const icon = trigger.querySelector('.custom-select-icon');
      trigger.addEventListener('click', (event) => {
        event.stopPropagation();
        this.selects.forEach((item) => { if (item !== select) item.classList.remove('open'); });
        select.classList.toggle('open');
      });
      options.forEach((option) => option.addEventListener('click', () => {
        select.dataset.value = option.dataset.value;
        hiddenInput.value = option.dataset.value;
        text.textContent = option.textContent.trim();
        icon.innerHTML = option.querySelector('i').outerHTML;
        options.forEach((item) => item.classList.remove('selected'));
        option.classList.add('selected');
        select.classList.remove('open');
      }));
    });
  }

  initNumberInputs() {
    this.numberButtons.forEach((button) => button.addEventListener('click', () => {
      const input = button.closest('.number-input-wrapper').querySelector('input[type="number"]');
      const min = Number.parseInt(input.min, 10) || 1;
      const max = Number.parseInt(input.max, 10) || 50;
      const value = Number.parseInt(input.value, 10) || min;
      if (button.dataset.action === 'increment' && value < max) input.value = value + 1;
      if (button.dataset.action === 'decrement' && value > min) input.value = value - 1;
    }));
  }

  closeAllSelects() {
    this.selects.forEach((select) => select.classList.remove('open'));
  }
}

document.addEventListener('DOMContentLoaded', () => new UIControls().init());
