import Quiz from './quiz.js';
import Question from './question.js';
import { soundManager } from './sounds.js';

class QuizApp {
  static MIN_QUESTIONS = 1;
  static MAX_QUESTIONS = 50;
  static DEFAULT_DIFFICULTY = 'easy';

  constructor() {
    this.form = document.getElementById('quizOptions');
    this.playerNameInput = document.getElementById('playerName');
    this.categoryInput = document.getElementById('categoryMenu');
    this.difficultyInput = document.getElementById('difficultyOptions');
    this.questionsInput = document.getElementById('questionsNumber');
    this.startButton = document.getElementById('startQuiz');
    this.questionsContainer = document.querySelector('.questions-container');
    this.currentQuiz = null;
    this.startQuiz = this.startQuiz.bind(this);
    this.resetToStart = this.resetToStart.bind(this);
  }

  init() {
    this.startButton.addEventListener('click', this.startQuiz);
    this.questionsInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.startQuiz();
      }
    });
  }

  showLoading() {
    this.questionsContainer.innerHTML = `<div class="loading-overlay"><div class="loading-spinner"></div><p class="loading-text">Loading Questions...</p></div>`;
  }

  hideLoading() {
    this.questionsContainer.querySelector('.loading-overlay')?.remove();
  }

  showError(message) {
    this.questionsContainer.innerHTML = `<div class="game-card error-card"><div class="error-icon"><i class="fa-solid fa-triangle-exclamation"></i></div><h3 class="error-title">Oops! Something went wrong</h3><p class="error-message">${message}</p><button class="btn-play retry-btn"><i class="fa-solid fa-rotate-right"></i> Try Again</button></div>`;
    this.questionsContainer.querySelector('.retry-btn')?.addEventListener('click', this.resetToStart);
  }

  validateForm() {
    const count = Number.parseInt(this.questionsInput.value, 10);
    if (!this.questionsInput.value || Number.isNaN(count)) return { isValid: false, error: 'Please enter the number of questions.' };
    if (count < QuizApp.MIN_QUESTIONS) return { isValid: false, error: `Minimum ${QuizApp.MIN_QUESTIONS} question required.` };
    if (count > QuizApp.MAX_QUESTIONS) return { isValid: false, error: `Maximum ${QuizApp.MAX_QUESTIONS} questions allowed.` };
    return { isValid: true, error: null };
  }

  showFormError(message) {
    this.form.querySelector('.form-error')?.remove();
    const error = document.createElement('div');
    error.className = 'form-error';
    error.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
    this.startButton.before(error);
    setTimeout(() => {
      error.style.opacity = '0';
      error.style.transform = 'translateY(-10px)';
      setTimeout(() => error.remove(), 300);
    }, 3000);
  }

  resetToStart() {
    this.questionsContainer.innerHTML = '';
    this.playerNameInput.value = '';
    this.categoryInput.value = '';
    this.difficultyInput.value = QuizApp.DEFAULT_DIFFICULTY;
    this.questionsInput.value = '10';
    this.form.classList.remove('hidden');
    this.currentQuiz = null;
  }

  async startQuiz() {
    const validation = this.validateForm();
    if (!validation.isValid) return this.showFormError(validation.error);

    soundManager.init();
    this.currentQuiz = new Quiz(this.categoryInput.value, this.difficultyInput.value || QuizApp.DEFAULT_DIFFICULTY, Number.parseInt(this.questionsInput.value, 10), this.playerNameInput.value.trim() || 'Player');
    this.form.classList.add('hidden');
    this.showLoading();
    try {
      await this.currentQuiz.getQuestions();
      this.hideLoading();
      if (!this.currentQuiz.questions.length) throw new Error('No questions received from the API.');
      new Question(this.currentQuiz, this.questionsContainer, this.resetToStart).displayQuestion();
    } catch (error) {
      this.hideLoading();
      this.showError(error.message || 'Failed to load questions. Please try again.');
    }
  }
}

new QuizApp().init();
