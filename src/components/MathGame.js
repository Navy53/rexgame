import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './MathGame.css';

const MathGame = () => {
  // Game state
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState({ num1: 0, num2: 0, operator: '+', result: 0 });
  const [ghostValues, setGhostValues] = useState([]);
  const [playerPosition, setPlayerPosition] = useState({ x: 18, y: 4 });
  const [ghostPositions, setGhostPositions] = useState([]);
  const [gameActive, setGameActive] = useState(false);
  const [message, setMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  
  // 背景音乐引用
  const backgroundMusicRef = useRef(null);
  
  // Use useMemo to prevent gridSize from changing on every render
  const gridSize = useMemo(() => ({ width: 20, height: 8 }), []);
  const gridRef = useRef(null);
  
  // 控制背景音乐
  useEffect(() => {
    if (gameActive) {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.play().catch(error => {
          console.log("自动播放受限：", error);
        });
      }
    } else {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
      }
    }
  }, [gameActive]);
  
  // 监听静音状态变化
  useEffect(() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.muted = isMuted;
    }
  }, [isMuted]);
  
  // 切换静音状态
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Generate a random math question
  const generateQuestion = () => {
    const operators = ['+', '-', '*', '/'];
    const operatorIndex = Math.floor(Math.random() * operators.length);
    const operator = operators[operatorIndex];
    
    let num1, num2, result;
    
    // Generate appropriate numbers based on the operator
    switch (operator) {
      case '+':
        num1 = Math.floor(Math.random() * 9) + 1;
        num2 = Math.floor(Math.random() * 9) + 1;
        result = num1 + num2;
        break;
      case '-':
        num2 = Math.floor(Math.random() * 9) + 1;
        num1 = Math.floor(Math.random() * 9) + 1 + num2; // Ensure positive result
        result = num1 - num2;
        break;
      case '*':
        num1 = Math.floor(Math.random() * 9) + 1;
        num2 = Math.floor(Math.random() * 9) + 1;
        result = num1 * num2;
        break;
      case '/':
        num2 = Math.floor(Math.random() * 9) + 1;
        result = Math.floor(Math.random() * 9) + 1;
        num1 = num2 * result; // Ensure clean division
        break;
      default:
        num1 = Math.floor(Math.random() * 9) + 1;
        num2 = Math.floor(Math.random() * 9) + 1;
        result = num1 + num2;
    }
    
    return { num1, num2, operator, result };
  };
  
  // Generate answer options
  const generateAnswers = (correctAnswer) => {
    const answers = [];
    
    // Generate 3 wrong answers that are different from the correct one (for 4 ghosts total)
    while (answers.length < 3) {
      const wrongAnswer = Math.floor(Math.random() * 20) + 1;
      if (!answers.includes(wrongAnswer) && wrongAnswer !== correctAnswer) {
        answers.push(wrongAnswer);
      }
    }
    
    // Add the correct answer and shuffle all answers
    answers.push(correctAnswer);
    return answers.sort(() => Math.random() - 0.5);
  };
  
  // Initialize ghost positions
  const initializeGhosts = () => {
    // Create 4 ghosts at different positions in different areas of the grid
    const ghosts = [];
    
    // Divide the grid into 4 sections to ensure better distribution
    const sections = [
      { minX: 3, maxX: 6, minY: 1, maxY: 3 },     // Top-left section
      { minX: 13, maxX: 17, minY: 1, maxY: 3 },    // Top-right section
      { minX: 3, maxX: 6, minY: 4, maxY: 6 },    // Bottom-left section
      { minX: 13, maxX: 17, minY: 4, maxY: 6 }    // Bottom-right section
    ];
    
    // Create one ghost in each section
    for (let i = 0; i < 4; i++) {
      const section = sections[i];
      const x = Math.floor(Math.random() * (section.maxX - section.minX + 1)) + section.minX;
      const y = Math.floor(Math.random() * (section.maxY - section.minY + 1)) + section.minY;
      
      ghosts.push({ x, y });
    }
    
    return ghosts;
  };
  
  // Exit the game
  const exitGame = useCallback(() => {
    setMessage('BYE BYE');
    setGameActive(false);
    
    setTimeout(() => {
      window.location.href = 'test.html';
    }, 2000);
  }, []);
  
  // Start a new game
  const startGame = useCallback(() => {
    const newQuestion = generateQuestion();
    const allAnswers = generateAnswers(newQuestion.result);
    
    // Reset player position to right side
    setPlayerPosition({ x: 18, y: 4 });
    
    // Generate new ghost positions
    setGhostPositions(initializeGhosts());
    
    // Set up the new question and answers
    setQuestion(newQuestion);
    setGhostValues(allAnswers);
    
    // Reset game state
    setScore(0);
    setGameActive(true);
    setMessage('');
    
    // 尝试播放背景音乐
    if (backgroundMusicRef.current && !isMuted) {
      backgroundMusicRef.current.currentTime = 0;
      backgroundMusicRef.current.play().catch(error => {
        console.log("自动播放受限：", error);
      });
    }
  }, [isMuted]);
  
  // Move to next question - keep this as a manual option
  const nextQuestion = useCallback(() => {
    if (!gameActive) return;
    
    const newQuestion = generateQuestion();
    const allAnswers = generateAnswers(newQuestion.result);
    
    // Reset player position to right side
    setPlayerPosition({ x: 18, y: 4 });
    
    // Generate new ghost positions
    setGhostPositions(initializeGhosts());
    
    // Set up the new question and answers
    setQuestion(newQuestion);
    setGhostValues(allAnswers);
    
    // Clear any messages
    setMessage('');
  }, [gameActive]);
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameActive) return;
      
      const { x, y } = playerPosition;
      let newX = x;
      let newY = y;
      
      // Arrow key navigation
      switch (e.key) {
        case 'ArrowUp':
          newY = Math.max(0, y - 1);
          break;
        case 'ArrowDown':
          newY = Math.min(gridSize.height - 1, y + 1);
          break;
        case 'ArrowLeft':
          newX = Math.max(0, x - 1);
          break;
        case 'ArrowRight':
          newX = Math.min(gridSize.width - 1, x + 1);
          break;
        default:
          return;
      }
      
      setPlayerPosition({ x: newX, y: newY });
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPosition, gameActive, gridSize]);
  
  // Ghost movement and collision detection
  useEffect(() => {
    if (!gameActive) return;
    
    const moveGhosts = () => {
      if (!gameActive) return;
      
      const updatedGhosts = ghostPositions.map(ghost => {
        // Random movement in one of four directions
        const direction = Math.floor(Math.random() * 4);
        let { x, y } = ghost;
        
        switch (direction) {
          case 0: // Up
            y = Math.max(0, y - 1);
            break;
          case 1: // Down
            y = Math.min(gridSize.height - 1, y + 1);
            break;
          case 2: // Left
            x = Math.max(0, x - 1);
            break;
          case 3: // Right
            x = Math.min(gridSize.width - 1, x + 1);
            break;
          default:
            break;
        }
        
        return { x, y };
      });
      
      setGhostPositions(updatedGhosts);
    };
    
    // Move ghosts every 5000ms (reduced to 10% of original speed)
    const ghostMoveInterval = setInterval(moveGhosts, 5000);
    
    return () => clearInterval(ghostMoveInterval);
  }, [ghostPositions, gameActive, gridSize]);
  
  // Check for collisions
  useEffect(() => {
    if (!gameActive) return;
    
    // Check for collision with ghosts
    const collidedGhostIndex = ghostPositions.findIndex(
      ghost => ghost.x === playerPosition.x && ghost.y === playerPosition.y
    );
    
    if (collidedGhostIndex !== -1) {
      // Get the value of the ghost the player collided with
      const collidedGhostValue = ghostValues[collidedGhostIndex];
      
      // Check if the ghost value is the correct answer
      if (collidedGhostValue === question.result) {
        // Correct answer!
        setMessage('好棒');
        setScore(score + 1);
        
        // Generate a new question after a delay
        setTimeout(() => {
          // Create new question
          const newQuestion = generateQuestion();
          const allAnswers = generateAnswers(newQuestion.result);
          
          // Update game state with new question
          setQuestion(newQuestion);
          setGhostValues(allAnswers);
          setGhostPositions(initializeGhosts());
          setPlayerPosition({ x: 18, y: 4 }); // Reset to right side
          setMessage('');
        }, 1500);
        
      } else {
        // Incorrect answer - just show message and continue same question
        setMessage('再試試');
        
        // Reset player position but keep same question
        setTimeout(() => {
          setMessage(''); // Clear message after a delay
          setPlayerPosition({ x: 18, y: 4 }); // Reset to right side
        }, 1500);
      }
    }
  }, [
    playerPosition, 
    ghostPositions, 
    ghostValues,
    question,
    gameActive, 
    score
  ]);
  
  // Render game grid
  const renderGrid = () => {
    const grid = [];
    
    // Create grid dots
    for (let y = 0; y < gridSize.height; y++) {
      for (let x = 0; x < gridSize.width; x++) {
        grid.push(
          <div 
            key={`dot-${x}-${y}`} 
            className="grid-dot" 
            style={{ 
              left: `${(x * 5) + 2}%`, 
              top: `${(y * 12) + 30}%` 
            }}
          />
        );
      }
    }
    
    return grid;
  };
  
  // Render player
  const renderPlayer = () => {
    return (
      <div
        className="player"
        style={{
          left: `${(playerPosition.x * 5) + 2}%`,
          top: `${(playerPosition.y * 12) + 30}%`
        }}
      />
    );
  };
  
  // Render ghosts
  const renderGhosts = () => {
    return ghostPositions.map((ghost, index) => (
      <div
        key={`ghost-${index}`}
        className={`ghost ghost-${index + 1}`}
        style={{
          left: `${(ghost.x * 5) + 2}%`,
          top: `${(ghost.y * 12) + 30}%`
        }}
      >
        {ghostValues[index]}
      </div>
    ));
  };
  
  // Render math question
  const getOperatorSymbol = (operator) => {
    switch (operator) {
      case '+': return '+';
      case '-': return '-';
      case '*': return '×';
      case '/': return '÷';
      default: return '+';
    }
  };
  
  return (
    <div className="math-game">
      <div className="game-header">
        <div className="lives">漢威數學遊戲</div>
        <div className="question">
          {question.num1} {getOperatorSymbol(question.operator)} {question.num2} = ?
        </div>
        <div className="score">Score: {score}</div>
      </div>
      
      <div className="game-board" ref={gridRef}>
        {renderGrid()}
        {gameActive && renderPlayer()}
        {gameActive && renderGhosts()}
        
        {message && (
          <div className="message">
            {message}
          </div>
        )}
      </div>
      
      <div className="game-controls">
        <button className="exit-btn" onClick={exitGame}>
          離開
        </button>
        <button className="start-btn" onClick={startGame}>
          開始
        </button>
        <button className="next-btn" onClick={nextQuestion}>
          下一題
        </button>
        <button className="sound-btn" onClick={toggleMute}>
          {isMuted ? '音樂：關' : '音樂：開'}
        </button>
      </div>
      
      {/* 背景音乐 */}
      <audio 
        ref={backgroundMusicRef} 
        src="/audio/pacman-theme.mp3" 
        loop
      />
    </div>
  );
};

export default MathGame; 