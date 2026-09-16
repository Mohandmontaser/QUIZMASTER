const API_BASE_URL = 'https://opentdb.com/api.php';
const HIGH_SCORES_KEY = 'quizHighScores';
const MAX_HIGH_SCORES = 10;
import { soundManager } from './sounds.js';

export default class Quiz {
  constructor(category, difficulty, numberOfQuestions, playerName = 'Player') {
    this.category = category;
    this.difficulty = difficulty;
    this.numberOfQuestions = Number.parseInt(numberOfQuestions, 10);
    this.playerName = playerName;
    this.score = 0;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }

  async getQuestions() {
    const multipleCount = Math.ceil(this.numberOfQuestions / 2);
    const booleanCount = Math.floor(this.numberOfQuestions / 2);
    const requests = [this.fetchQuestions(multipleCount, 'multiple')];

    // Request both API formats, then randomize their order in the quiz.
    // With one requested question, only one format is possible.
    if (booleanCount > 0) requests.push(this.fetchQuestions(booleanCount, 'boolean'));
    this.questions = this.shuffleQuestions((await Promise.all(requests)).flat());
    return this.questions;
  }

  async fetchQuestions(amount, type) {
    const response = await fetch(this.buildApiUrl(amount, type));
    if (!response.ok) throw new Error(`Could not load questions (HTTP ${response.status}).`);

    const data = await response.json();
    if (data.response_code !== 0) throw new Error(this.getApiErrorMessage(data.response_code));
    return data.results;
  }

  buildApiUrl(amount, type) {
    const params = new URLSearchParams({
      amount,
      difficulty: this.difficulty,
      type,
    });
    if (this.category) params.append('category', this.category);
    return `${API_BASE_URL}?${params}`;
  }

  shuffleQuestions(questions) {
    for (let index = questions.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [questions[index], questions[randomIndex]] = [questions[randomIndex], questions[index]];
    }
    return questions;
  }

  getApiErrorMessage(code) {
    const messages = {
      1: 'Not enough questions match those options. Try fewer questions or another category.',
      2: 'One of the quiz options is invalid.',
      3: 'The quiz session was not found.',
      4: 'The quiz session has run out of questions. Please try again.',
    };
    return messages[code] || 'The question service returned an unknown error.';
  }

  incrementScore() { this.score += 1; }
  getCurrentQuestion() { return this.questions[this.currentQuestionIndex] || null; }

  nextQuestion() {
    this.currentQuestionIndex += 1;
    return this.currentQuestionIndex < this.questions.length;
  }

  isComplete() { return this.currentQuestionIndex >= this.questions.length; }
  getScorePercentage() { return Math.round((this.score / this.numberOfQuestions) * 100); }

  getHighScores() {
    try {
      const scores = localStorage.getItem(HIGH_SCORES_KEY);
      return scores ? JSON.parse(scores) : [];
    } catch {
      return [];
    }
  }

  isHighScore() {
    const scores = this.getHighScores();
    return scores.length < MAX_HIGH_SCORES || this.getScorePercentage() > scores.at(-1).percentage;
  }

  saveHighScore() {
    const scores = this.getHighScores();
    scores.push({
      name: this.playerName,
      score: this.score,
      total: this.numberOfQuestions,
      percentage: this.getScorePercentage(),
      difficulty: this.difficulty,
      date: new Date().toLocaleDateString(),
    });
    scores.sort((a, b) => b.percentage - a.percentage);
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores.slice(0, MAX_HIGH_SCORES)));
  }

  endQuiz() {
    soundManager.playComplete();
    const percentage = this.getScorePercentage();
    const isNewHighScore = this.isHighScore();
    if (isNewHighScore) this.saveHighScore();
    const leaderboard = this.getHighScores().map((score, index) => {
      const medal = ['gold', 'silver', 'bronze'][index] || '';
      return `<li class="leaderboard-item ${medal}">
        <span class="leaderboard-rank">#${index + 1}</span>
        <span class="leaderboard-name">${score.name}</span>
        <span class="leaderboard-score">${score.percentage}%</span>
      </li>`;
    }).join('');

    return `<div class="game-card results-card">
      <h2 class="results-title">Quiz Complete!</h2>
      <p class="results-score-display">${this.score}/${this.numberOfQuestions}</p>
      <p class="results-percentage">${percentage}% Accuracy</p>
      ${isNewHighScore ? '<div class="new-record-badge"><i class="fa-solid fa-star"></i> New High Score!</div>' : ''}
      <div class="leaderboard"><h4 class="leaderboard-title"><i class="fa-solid fa-trophy"></i> Leaderboard</h4><ul class="leaderboard-list">${leaderboard}</ul></div>
      <div class="action-buttons"><button class="btn-restart"><i class="fa-solid fa-rotate-right"></i> Play Again</button></div>
    </div>`;
  }
}
