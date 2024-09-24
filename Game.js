

export class Game {
  constructor() {
    this.words = [];
    this.guesses = [];
    this.player = '';
    this.victoryScore = 0;
    this.defeatScore = 0;
    this.currentWord = '';
    this.wordToGuess = '';
    this.maxAttempts = 6;
    this.attemptCount = 0;
    this.url = './data.json';
  }

  // Fetch Data
  async fetchData() {
    try {
      const response = await fetch(this.url);
      if (!response.ok) {
        throw new Error('Erreur réseau');
      }
      const data = await response.json();
      this.words = data.map(item => item.mot);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    }
  }
  async fetchOtherResults() {
      //todo A modifier pour interroger une DB
    try {
      const allPlayersScores = await JSON.parse(localStorage.getItem('scores')) || 'No data';
      console.log(allPlayersScores);
      return allPlayersScores;
    }
    catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    }
  }
    
// Game Operations
  async init() {
    await this.fetchData();
    this.currentWord = this.getWord();
    this.wordToGuess = this.displayWordToGuess();
    document.getElementById('wordToGuess').appendChild(this.wordToGuess);
    this.updateAttempts();
    this.displayScores();
    this.displayCheckBtn();
    this.displayNewWordBtn();
    this.displayUserForm();
  }
  newGame() {
    this.resetGame();
    this.init();
  }
  newPlayer() {
    const pseudo = document.getElementById('pseudo').value;
    const firstLetter = pseudo.slice(0,1).toUpperCase();
    this.player = firstLetter + pseudo.slice(1);
    localStorage.setItem('pseudo', this.player);
    this.newGame();
  }
  newWord() {
    this.currentWord = this.getWord();
    this.wordToGuess = this.displayWordToGuess();
    document.getElementById('wordToGuess').textContent = '';
    document.getElementById('wordToGuess').appendChild(this.wordToGuess);
  }
  resetGame() {
    this.guesses = [];
    this.attemptCount = 0;
    document.getElementById('attemptsContainer').textContent = '';
    document.getElementById('attemptsContainer').classList.remove('result_container');
    document.getElementById('result').textContent = '';
    document.getElementById('error').textContent = '';
    document.getElementById('wordToGuess').textContent = '';
    document.getElementById('checkBtn').disabled = false;
    this.updateAttempts();
  }
  saveScore() {
        //todo A modifier pour sauvegarder dans une DB
      const scores = JSON.parse(localStorage.getItem('scores')) || [];
      const pseudo = localStorage.getItem('pseudo');
      const score = {
        pseudo,
        victoryScore: this.victoryScore,
        defeatScore: this.defeatScore,
      };
      scores.push(score);
      localStorage.setItem('scores', JSON.stringify(scores));
      this.updateScoresDisplay();
  
  }
  getWord() {
    return this.words[Math.floor(Math.random() * this.words.length)];
  }

  // Display Game Elements
  displayCheckBtn() {
    const checkBtn = document.getElementById('checkBtn');
    checkBtn.textContent = 'Vérifier';
    checkBtn.addEventListener('click', () => {
      this.handleGuess();
    });
  }
  displayNewWordBtn() {
    const newWordBtn = document.getElementById('newWordBtn');
    newWordBtn.textContent = 'Nouveau mot';
    newWordBtn.addEventListener('click', () => {
      this.resetGame();
      this.newWord();
    });
  }
  displayCaseToGuess() {
    const letters = this.currentWord.length - 1;
    const container = document.createElement('div');
    for (let i = 0; i < letters; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'case_guess';
        input.className = 'case';
        input.maxLength = '1';
        container.appendChild(input);
    }
    return container;
  }
  displayWordToGuess() {
    const wordContainer = document.createElement('div');
    wordContainer.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        this.handleGuess();
      }
    });
    wordContainer.classList.add('wordToGuess_container');
    const firstLetter = document.createElement('span');
    firstLetter.className = 'case';
    firstLetter.textContent = this.currentWord[0];    
      wordContainer.appendChild(firstLetter);
      const caseToGuess = this.displayCaseToGuess();
      wordContainer.appendChild(caseToGuess);
    return wordContainer;
  }
  displayAttempts() {
    const attemptsContainer = document.getElementById('attemptsContainer');
    attemptsContainer.classList.add('result_container');

    if (this.guesses.length !== 0) {
      const lastGuessIndex = this.guesses.length - 1;
      const lastGuess = this.guesses[lastGuessIndex];
      const guessElement = document.createElement('div');

      const firstLetter = document.createElement('span');
      firstLetter.classList.add('result_case');
      firstLetter.textContent = this.currentWord[0];
      guessElement.appendChild(firstLetter);

      const targetLetterCounts = {};
      this.currentWord.slice(1).split('').forEach(letter => {
        targetLetterCounts[letter] = (targetLetterCounts[letter] || 0) + 1;
      });  
      const correctPositions = lastGuess.map((letter, index) => this.checkLetterPosition(letter, index));
  
      lastGuess.forEach((letter, index) => {
        const letterElement = document.createElement('span');
        letterElement.classList.add('result_case');
        letterElement.textContent = letter;
  
       if (correctPositions[index]) {
        letterElement.style.color = 'green';
        targetLetterCounts[letter]--;
      } else {
        const isLetterInWord = this.checkLetterInWord(letter);
        if (isLetterInWord && targetLetterCounts[letter] > 0) {
          letterElement.style.color = 'orange';
          targetLetterCounts[letter]--;
        } else {
          letterElement.style.color = 'red';
        }
      }
        guessElement.appendChild(letterElement);
      });
      attemptsContainer.appendChild(guessElement);
    }
  }
  async displayScores() {
    const scores_container = document.getElementById('scores');
    scores_container.textContent = '';
    const tilte = document.createElement('h2');
    tilte.textContent = 'Historique des scores';
    scores_container.appendChild(tilte);
    const scoresContainer = document.createElement('div');
    scoresContainer.className = 'scores_container';
    const player = document.createElement('span');
    player.id = 'player';
    player.textContent = `Joueur : ${localStorage.getItem('pseudo')}`;

    const div = document.createElement('div');
    const victoryScore = document.createElement('span');
    victoryScore.id = 'victoryScore';
    const defeatScore = document.createElement('span');
    defeatScore.id = 'defeatScore';

    const saveBtn = document.createElement('button');
    saveBtn.id = 'saveBtn';
    saveBtn.textContent = 'Sauvegarder';
    saveBtn.addEventListener('click', () => {
      this.saveScore();
    });
    scoresContainer.appendChild(player);
    div.appendChild(victoryScore);
    div.appendChild(defeatScore);
    scoresContainer.appendChild(div);
    scoresContainer.appendChild(saveBtn);

    const playersScores = document.createElement('div');
    playersScores.id = 'playersScores';
    const tilte1 = document.createElement('h2');
    tilte1.textContent = 'Scores des autres joueurs';
    playersScores.appendChild(tilte1);
    scoresContainer.appendChild(playersScores);
    scores_container.appendChild(scoresContainer);
    await this.updateScoresDisplay();
  }
  displayUserForm() {
    const userForm = document.getElementById('userForm');
    const input = document.createElement('input');
    input.id = 'pseudo';
    input.placeholder = 'Entrez votre pseudo';
    const button = document.createElement('button');
    button.textContent = 'Valider';
    button.addEventListener('click', () => {
      this.newPlayer();
    }
    );
    userForm.appendChild(input);
    userForm.appendChild(button);

    const pseudo = localStorage.getItem('pseudo');
    if (pseudo) {
      userForm.style.display = 'none';
      const player = document.getElementById('playerName');
      player.textContent = `Joueur : ${pseudo}`;
      const br = document.createElement('br');
      player.appendChild(br);
      const newPlayerBtn = document.createElement('button');
      newPlayerBtn.textContent = 'Changer de joueur';
      newPlayerBtn.addEventListener('click', () => {
        localStorage.removeItem('pseudo');
        userForm.style.display = 'block';
        player.textContent = '';
        newPlayerBtn.textContent = '';
      });
      player.appendChild(newPlayerBtn);

    } else {
      userForm.style.display = 'block';
    }
  }

  // Game Logic
  handleGuess() {
    while (this.attemptCount < this.maxAttempts) {

    const inputElements = Array.from(document.querySelectorAll('#case_guess'));
    const currentAttempt = inputElements.map(input => input.value.trim());
    const allFilled = currentAttempt.every(value => value !== '');

    if (allFilled) {
        this.guesses.push(currentAttempt);
        this.attemptCount++;
        this.updateAttempts();
        this.displayAttempts();
        this.checkWin();
        document.getElementById('error').textContent = '';
    } else {
        document.getElementById('error').textContent = 'Veuillez remplir toutes les cases.';
        document.getElementById('error').classList.add('error');

    }
    break;
    }
  }
  checkWin() {
    const lastGuessIndex = this.guesses.length - 1;
    const lastGuess = this.guesses[lastGuessIndex];
    const isWin = lastGuess.every((letter, index) => this.checkLetterPosition(letter, index));
    if (isWin) {
      document.getElementById('result').textContent = 'Bravo ! Vous avez gagné';
      document.getElementById('result').removeAttribute('class');
      document.getElementById('result').classList.add('correct');
      document.getElementById('checkBtn').disabled = true;
      this.victoryScore++;
      this.updateScores();
      
    } else if (this.attemptCount === this.maxAttempts) {
      document.getElementById('result').textContent = `Perdu ! Le mot était : ${this.currentWord}`;
      document.getElementById('result').removeAttribute('class');

      document.getElementById('result').classList.add('error');
      this.defeatScore++;
      this.updateScores();

    }
  }
  checkLetterPosition(letter, index) {
    const word = this.currentWord.slice(1);
    return word[index] === letter;
  }
  checkLetterInWord(letter) {
    const word = this.currentWord;
    let isLetterInWord = false;
    for (let i = 0; i < word.length; i++) {
      if (word[i] === letter) {
        isLetterInWord = true;
        break;
      }
    }
    return isLetterInWord;
  }
  updateAttempts() {
    const attempts = this.maxAttempts - this.attemptCount;
    let color = '';
    if (attempts <= 2) {
      color = 'red';
    } else if (attempts <= 4) {
      color = 'orange';
    } else {
      color = 'green';
    }

    const number = document.createElement('span');
    number.textContent = attempts;
    number.style.color = color;
    

    document.getElementById('attempts').textContent = `Essais restants : `;
    document.getElementById('attempts').appendChild(number);
  }
  updateScores() {
    document.getElementById('victoryScore').textContent = `Victoires : ${this.victoryScore}  `;
    document.getElementById('defeatScore').textContent = `Défaites : ${this.defeatScore}`;
  }
  async updateScoresDisplay() {
    const playersScores = document.getElementById('playersScores');
    playersScores.innerHTML = '';
    const tilte1 = document.createElement('h2');
    tilte1.textContent = 'Scores des autres joueurs';
    playersScores.appendChild(tilte1);
  
    const allPlayersScores = await this.fetchOtherResults();
    allPlayersScores.forEach((score, index) => {
      const player = document.createElement('span');
      player.textContent = `Joueur : ${score.pseudo}`;
      playersScores.appendChild(player);
      const br1 = document.createElement('br');
      playersScores.appendChild(br1);
  
      const div = document.createElement('div');
      playersScores.appendChild(div);

      const victoryScore = document.createElement('span');
      victoryScore.textContent = `Victoires : ${score.victoryScore}`;
      div.appendChild(victoryScore);
  
      const defeatScore = document.createElement('span');
      defeatScore.textContent = `Défaites : ${score.defeatScore}`;
      div.appendChild(defeatScore);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Supprimer';
    deleteBtn.addEventListener('click', () => {
      allPlayersScores.splice(index, 1);
      localStorage.setItem('scores', JSON.stringify(allPlayersScores));
      this.updateScoresDisplay();
    });
    
    playersScores.appendChild(deleteBtn);
    const br = document.createElement('br');
    playersScores.appendChild(br);
  });
  }

}

