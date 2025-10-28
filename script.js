// Игра в шашки Audi RS6 vs Арбузики
class CheckersGame {
    constructor() {
        this.boardSize = 8;
        this.currentPlayer = 'rs6';
        this.selectedPiece = null;
        this.board = [];
        this.init();
    }

    init() {
        this.createBoard();
        this.setupPieces();
        this.renderBoard();
        this.updateGameInfo();
    }

    createBoard() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';
        
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = `cell ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                
                gameBoard.appendChild(cell);
                this.board[row][col] = null;
            }
        }
    }

    setupPieces() {
        // Расстановка фишек RS6 (игрок 1)
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if ((row + col) % 2 === 1) {
                    this.board[row][col] = { type: 'rs6', isKing: false };
                }
            }
        }

        // Расстановка фишек Арбузиков (игрок 2)
        for (let row = 5; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if ((row + col) % 2 === 1) {
                    this.board[row][col] = { type: 'watermelon', isKing: false };
                }
            }
        }
    }

    renderBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const piece = this.board[row][col];
            
            // Очищаем ячейку
            cell.innerHTML = '';
            cell.classList.remove('available');
            
            if (piece) {
                const pieceElement = document.createElement('div');
                pieceElement.className = `piece ${piece.type} ${piece.isKing ? 'king' : ''}`;
                pieceElement.textContent = piece.type === 'rs6' ? '🚗' : '🍉';
                cell.appendChild(pieceElement);
                
                // Подсвечиваем выбранную фишку
                if (this.selectedPiece && this.selectedPiece.row === row && this.selectedPiece.col === col) {
                    pieceElement.classList.add('selected');
                }
            }
        });

        // Показываем доступные ходы
        if (this.selectedPiece) {
            this.showAvailableMoves(this.selectedPiece.row, this.selectedPiece.col);
        }
    }

    handleCellClick(row, col) {
        const piece = this.board[row][col];
        
        // Если кликнули на фишку текущего игрока
        if (piece && piece.type === this.currentPlayer) {
            this.selectedPiece = { row, col };
            this.renderBoard();
            return;
        }

        // Если есть выбранная фишка и кликнули на доступный ход
        if (this.selectedPiece && this.isValidMove(this.selectedPiece.row, this.selectedPiece.col, row, col)) {
            this.makeMove(this.selectedPiece.row, this.selectedPiece.col, row, col);
            this.selectedPiece = null;
            this.switchPlayer();
            this.renderBoard();
            this.checkGameEnd();
        }
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return false;

        const rowDiff = toRow - fromRow;
        const colDiff = toCol - fromCol;
        const direction = piece.type === 'rs6' ? 1 : -1;

        // Проверка направления для обычных фишек
        if (!piece.isKing && Math.sign(rowDiff) !== direction) {
            return false;
        }

        // Проверка диагонального движения
        if (Math.abs(rowDiff) !== Math.abs(colDiff)) {
            return false;
        }

        // Простой ход
        if (Math.abs(rowDiff) === 1) {
            return !this.board[toRow][toCol];
        }

        // Ход с взятием
        if (Math.abs(rowDiff) === 2) {
            const midRow = (fromRow + toRow) / 2;
            const midCol = (fromCol + toCol) / 2;
            const midPiece = this.board[midRow][midCol];
            
            return midPiece && midPiece.type !== piece.type && !this.board[toRow][toCol];
        }

        return false;
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        // Проверка на становление королем
        if ((piece.type === 'rs6' && toRow === this.boardSize - 1) || 
            (piece.type === 'watermelon' && toRow === 0)) {
            piece.isKing = true;
        }

        // Взятие фишки
        const rowDiff = Math.abs(toRow - fromRow);
        if (rowDiff === 2) {
            const midRow = (fromRow + toRow) / 2;
            const midCol = (fromCol + toCol) / 2;
            this.board[midRow][midCol] = null;
            
            // Воспроизводим звук взятия
            this.playCaptureSound();
        }

        // Воспроизводим звук двигателя для RS6
        if (piece.type === 'rs6') {
            this.playEngineSound();
        }
    }

    showAvailableMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return;

        for (let toRow = 0; toRow < this.boardSize; toRow++) {
            for (let toCol = 0; toCol < this.boardSize; toCol++) {
                if (this.isValidMove(row, col, toRow, toCol)) {
                    const cell = document.querySelector(`.cell[data-row="${toRow}"][data-col="${toCol}"]`);
                    cell.classList.add('available');
                }
            }
        }
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'rs6' ? 'watermelon' : 'rs6';
        this.updateGameInfo();
    }

    updateGameInfo() {
        document.getElementById('currentPlayer').textContent = 
            this.currentPlayer === 'rs6' ? 'Игрок 1 (RS6)' : 'Игрок 2 (Арбузики)';
        
        // Обновляем счет
        const scores = this.getScores();
        document.getElementById('player1Score').textContent = scores.rs6;
        document.getElementById('player2Score').textContent = scores.watermelon;
    }

    getScores() {
        let rs6 = 0, watermelon = 0;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    if (piece.type === 'rs6') rs6++;
                    else watermelon++;
                }
            }
        }
        
        return { rs6, watermelon };
    }

    checkGameEnd() {
        const scores = this.getScores();
        
        if (scores.rs6 === 0) {
            this.showGameResult('Арбузики побеждают! 🍉');
        } else if (scores.watermelon === 0) {
            this.showGameResult('RS6 побеждает! 🚗');
        }
    }

    showGameResult(message) {
        setTimeout(() => {
            alert(message);
            this.reset();
        }, 500);
    }

    reset() {
        this.currentPlayer = 'rs6';
        this.selectedPiece = null;
        this.board = [];
        this.init();
    }

    playEngineSound() {
        const engineSound = document.getElementById('engineSound');
        engineSound.currentTime = 0;
        engineSound.play().catch(e => console.log('Автовоспроизведение заблокировано'));
    }

    playCaptureSound() {
        // Можно добавить звук взятия фишки
        console.log('Фишка взята!');
    }
}

// Инициализация игры
let checkersGame;

// Аудио управление
const backgroundMusic = document.getElementById('backgroundMusic');
const engineSound = document.getElementById('engineSound');

document.getElementById('musicToggle').addEventListener('click', function() {
    if (backgroundMusic.paused) {
        backgroundMusic.play();
        this.classList.add('active');
        this.textContent = '🎵';
    } else {
        backgroundMusic.pause();
        this.classList.remove('active');
        this.textContent = '🔇';
    }
});

document.getElementById('engineToggle').addEventListener('click', function() {
    if (engineSound.paused) {
        engineSound.play();
        this.classList.add('active');
        this.textContent = '🔊';
    } else {
        engineSound.pause();
        this.classList.remove('active');
        this.textContent = '🚗';
    }
});

// Плавная прокрутка
function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({
        behavior: 'smooth'
    });
}

// Модальное окно правил
function showRules() {
    document.getElementById('rulesModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('rulesModal').style.display = 'none';
}

// Сброс игры
function resetGame() {
    checkersGame.reset();
}

// Параллакс эффекты
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.floating-elements div');
    
    parallaxElements.forEach((element, index) => {
        const speed = 0.3 + (index * 0.1);
        element.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.05}deg)`;
    });
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    checkersGame = new CheckersGame();
    
    // Запускаем фоновую музыку с задержкой
    setTimeout(() => {
        backgroundMusic.volume = 0.3;
        backgroundMusic.play().catch(e => {
            console.log('Автовоспроизведение музыки заблокировано');
        });
    }, 1000);

    console.log('🚗🍉 Сайт Булкина с RS6 загружен! Готов к вайбу!');
});

// Эффекты для кнопок
document.querySelectorAll('.cta-button').forEach(button => {
    button.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px) scale(1.05)';
    });
    
    button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Случайные эффекты для вайба
function addRandomEffects() {
    const effects = ['✨', '🌟', '💫', '⭐', '🎆'];
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];
    
    const effectElement = document.createElement('div');
    effectElement.textContent = randomEffect;
    effectElement.style.position = 'fixed';
    effectElement.style.left = Math.random() * window.innerWidth + 'px';
    effectElement.style.top = Math.random() * window.innerHeight + 'px';
    effectElement.style.fontSize = (Math.random() * 2 + 1) + 'rem';
    effectElement.style.opacity = '0.7';
    effectElement.style.zIndex = '9999';
    effectElement.style.pointerEvents = 'none';
    effectElement.style.animation = 'float 2s ease-in-out forwards';
    
    document.body.appendChild(effectElement);
    
    setTimeout(() => {
        effectElement.remove();
    }, 2000);
}

// Добавляем случайные эффекты каждые 3-8 секунд
setInterval(addRandomEffects, 3000 + Math.random() * 5000);