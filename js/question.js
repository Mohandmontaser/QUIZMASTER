const TIMER_DURATION = 15;
const TIMER_WARNING_THRESHOLD = 5;
const TRANSITION_DELAY = 1500;
const EXIT_ANIMATION_DURATION = 500;
import { soundManager } from './sounds.js';

export default class Question {
  constructor(quiz, container, onQuizEnd) {
    this.quiz = quiz;
    this.container = container;
    this.onQuizEnd = onQuizEnd;
    this.questionData = quiz.getCurrentQuestion();
    this.index = quiz.currentQuestionIndex;
    this.question = this.decodeHtml(this.questionData.question);
    this.correctAnswer = this.decodeHtml(this.questionData.correct_answer);
    this.category = this.decodeHtml(this.questionData.category);
    this.wrongAnswers = this.questionData.incorrect_answers.map((answer) => this.decodeHtml(answer));
    this.allAnswers = this.shuffleAnswers();
    this.answered = false;
    this.timerInterval = null;
    this.timeRemaining = TIMER_DURATION;
    this.keyboardHandler = null;
  }

  decodeHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.documentElement.textContent;
  }

  shuffleAnswers() {
    const answers = [...this.wrongAnswers, this.correctAnswer];
    for (let i = answers.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [answers[i], answers[j]] = [answers[j], answers[i]];
    }
    return answers;
  }

  getProgress() {
    return Math.round(((this.index + 1) / this.quiz.numberOfQuestions) * 100);
  }

  getDifficultyIcon() {
    return { easy: 'fa-face-smile', medium: 'fa-face-meh', hard: 'fa-skull' }[this.quiz.difficulty] || 'fa-gauge-high';
  }

  displayQuestion() {
    this.container.innerHTML = `<div class="game-card question-card">
      <div class="xp-bar-container"><div class="xp-bar-header"><span class="xp-label"><i class="fa-solid fa-bolt"></i> Progress</span><span class="xp-value">Question ${this.index + 1}/${this.quiz.numberOfQuestions}</span></div><div class="xp-bar"><div class="xp-bar-fill" style="width:${this.getProgress()}%"></div></div></div>
      <div class="stats-row">
        <div class="stat-badge category"><i class="fa-solid fa-bookmark"></i><span>${this.category}</span></div>
        <div class="stat-badge difficulty ${this.quiz.difficulty}"><i class="fa-solid ${this.getDifficultyIcon()}"></i><span>${this.quiz.difficulty}</span></div>
        <div class="stat-badge timer"><i class="fa-solid fa-stopwatch"></i><span class="timer-value">${this.timeRemaining}</span>s</div>
        <div class="stat-badge counter"><i class="fa-solid fa-gamepad"></i><span>${this.index + 1}/${this.quiz.numberOfQuestions}</span></div>
      </div>
      <h2 class="question-text">${this.question}</h2>
      <div class="answers-grid">${this.allAnswers.map((answer, i) => `<button class="answer-btn" data-answer="${answer.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"><span class="answer-key">${i + 1}</span><span class="answer-text">${answer}</span></button>`).join('')}</div>
      <p class="keyboard-hint"><i class="fa-regular fa-keyboard"></i> Press 1-${this.allAnswers.length} to select</p>
      <div class="score-panel"><div class="score-item"><div class="score-item-label">Score</div><div class="score-item-value">${this.quiz.score}</div></div></div>
    </div>`;
    this.addEventListeners();
    this.startTimer();
  }

  addEventListeners() {
    const choices = [...this.container.querySelectorAll('.answer-btn')];
    choices.forEach((choice) => choice.addEventListener('click', () => this.checkAnswer(choice)));
    this.keyboardHandler = (event) => {
      if (/^[1-4]$/.test(event.key)) {
        const choice = choices[Number(event.key) - 1];
        if (choice) this.checkAnswer(choice);
      }
    };
    document.addEventListener('keydown', this.keyboardHandler);
  }

  removeEventListeners() {
    if (this.keyboardHandler) document.removeEventListener('keydown', this.keyboardHandler);
    this.keyboardHandler = null;
  }

  startTimer() {
    const display = this.container.querySelector('.timer-value');
    const badge = this.container.querySelector('.stat-badge.timer');
    this.timerInterval = setInterval(() => {
      this.timeRemaining -= 1;
      display.textContent = this.timeRemaining;
      if (this.timeRemaining <= TIMER_WARNING_THRESHOLD && this.timeRemaining > 0) {
        badge.classList.add('warning');
        soundManager.playWarning();
      }
      if (this.timeRemaining <= 0) {
        this.stopTimer();
        if (!this.answered) {
          soundManager.playTimeUp();
          this.handleTimeUp();
        }
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  handleTimeUp() {
    this.answered = true;
    this.removeEventListeners();
    this.highlightCorrectAnswer();
    this.container.querySelectorAll('.answer-btn').forEach((button) => button.classList.add('disabled'));
    const message = document.createElement('div');
    message.className = 'time-up-message';
    message.innerHTML = '<i class="fa-solid fa-clock"></i> TIME\'S UP!';
    this.container.querySelector('.score-panel').before(message);
    this.animateQuestion(EXIT_ANIMATION_DURATION);
  }

  checkAnswer(choice) {
    if (this.answered) return;
    this.answered = true;
    this.stopTimer();
    this.removeEventListeners();
    const isCorrect = choice.dataset.answer.toLowerCase() === this.correctAnswer.toLowerCase();
    this.container.querySelectorAll('.answer-btn').forEach((button) => button.classList.add('disabled'));
    if (isCorrect) {
      choice.classList.remove('disabled');
      choice.classList.add('correct');
      this.quiz.incrementScore();
      soundManager.playCorrect();
    } else {
      choice.classList.remove('disabled');
      choice.classList.add('wrong');
      this.highlightCorrectAnswer();
      soundManager.playWrong();
    }
    this.animateQuestion(EXIT_ANIMATION_DURATION);
  }

  highlightCorrectAnswer() {
    this.container.querySelectorAll('.answer-btn').forEach((button) => {
      if (button.dataset.answer === this.correctAnswer) {
        button.classList.remove('disabled');
        button.classList.add('correct-reveal');
      }
    });
  }

  getNextQuestion() {
    if (this.quiz.nextQuestion()) {
      new Question(this.quiz, this.container, this.onQuizEnd).displayQuestion();
      return;
    }
    this.container.innerHTML = this.quiz.endQuiz();
    this.container.querySelector('.btn-restart').addEventListener('click', this.onQuizEnd);
  }

  animateQuestion(duration) {
    setTimeout(() => {
      this.container.querySelector('.question-card')?.classList.add('exit');
      setTimeout(() => this.getNextQuestion(), duration);
    }, TRANSITION_DELAY);
  }
}
