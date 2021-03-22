import React, { useState, useEffect } from "react";
import "./Board.css";
import {
  randomIntFromInterval,
  useInterval,
  reverseLinkedList,
} from "../utils/utils";

//Setting Direction for KeyStrokes
const Direction = {
  UP: "UP",
  RIGHT: "RIGHT",
  LEFT: "LEFT",
  DOWN: "DOWN",
};

//Setting up the Linked List

//Class for a single node in Linked List
class LinkedListNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

//The Linked List Class that takes a node from LinkedList Node
class LinkedList {
  constructor(value) {
    const node = new LinkedListNode(value);
    this.head = node;
    this.tail = node;
  }
}

//Board Size and Prob to reverse direction of food
const BOARD_SIZE = 10;
const PROBABILITY_OF_DIRECTION_REVERSAL_FOOD = 0.3;

//Get the starting spot for Snake based of the size of the board
const getStartingSnakeValue = (board) => {
  const rowSize = board.length;
  const colSize = board[0].length;
  const startingRow = Math.round(rowSize / 3);
  const startingCol = Math.round(colSize / 3);
  const startingCell = board[startingRow][startingCol];

  return {
    row: startingRow,
    col: startingCol,
    cell: startingCell,
  };
};

//Start of component
const Board = () => {
  const [score, setScore] = useState(0);
  const [board, setBoard] = useState(createBoard(BOARD_SIZE));
  //Initialzing snake with the starting value
  const [snake, setSnake] = useState(
    new LinkedList(getStartingSnakeValue(board))
  );
  //Initilizing the board and where the snake is
  const [snakeCells, setSnakeCells] = useState(
    new Set([snake.head.value.cell])
  );

  //Initialzing the food cell
  const [foodCell, setFoodCell] = useState(snake.head.value.cell + 5);
  //Starting direction -- RIGHT
  const [direction, setDirection] = useState(Direction.RIGHT);
  const [foodShouldReverseDirection, setFoodShouldReverseDirection] = useState(
    false
  );

  //UseEffect for listenting for key strokes
  useEffect(() => {
    window.addEventListener("keydown", (e) => {
      handleKeyDown(e);
    });
  }, []);

  //Moving the snake every interval
  useInterval(() => {
    moveSnake();
  }, 150);

  //handlind keystrokes once pressed
  const handleKeyDown = (e) => {
    const newDirection = getDirectionFromKey(e.key);
    const isValidDirection = newDirection != "";
    if (!isValidDirection) return;
    const snakeHitItself =
      getOppositeDirection(newDirection) === direction && snakeCells.size > 1;
    if (snakeHitItself) return;
    setDirection(newDirection);
  };

  //check if gameover
  const handleGameOver = () => {
    alert(`Game over, you scored: ${score}`);
    setScore(0);
    const snakeLLStartingValue = getStartingSnakeValue(board);
    setSnake(new LinkedList(snakeLLStartingValue));
    setFoodCell(snakeLLStartingValue.cell + 5);
    setSnakeCells(new Set([snakeLLStartingValue.cell]));
    setDirection(Direction.RIGHT);
  };

  //moving the snake
  const moveSnake = () => {
    //getting the current row/col for the head of the snake
    const currentHeadCoords = {
      row: snake.head.value.row,
      col: snake.head.value.col,
    };

    //setting the next head coord
    const nextHeadCoords = getCoordsInDirection(currentHeadCoords, direction);
    //check if the next coord is OOB and if so end the game
    if (isOutOfBounds(nextHeadCoords, board)) {
      handleGameOver();
      return;
    }
    //getting the next head cell
    const nextHeadCell = board[nextHeadCoords.row][nextHeadCoords.col];
    //if the cell already exists end game
    if (snakeCells.has(nextHeadCell)) {
      handleGameOver();
      return;
    }
    //setting the new head as a Node in the linked list
    const newHead = new LinkedListNode({
      row: nextHeadCoords.row,
      col: nextHeadCoords.col,
      cell: nextHeadCell,
    });

    //getting current head
    const currentHead = snake.head;
    snake.head = newHead;
    currentHead.next = newHead;

    //setting the new cells
    const newSnakeCells = new Set(snakeCells);
    newSnakeCells.delete(snake.tail.value.cell);
    newSnakeCells.add(nextHeadCell);

    //setting the tail
    snake.tail = snake.tail.next;
    //if the snake is only one node big
    if (snake.tail === null) snake.tail = snake.head;

    //checking if the next move is a food cell
    const foodConsumed = nextHeadCell === foodCell;
    if (foodConsumed) {
      // This function mutates newSnakeCells.
      growSnake(newSnakeCells);
      if (foodShouldReverseDirection) reverseSnake();
      handleEat(newSnakeCells);
    }

    setSnakeCells(newSnakeCells);
  };

  //reversing the snake upon food
  const reverseSnake = () => {
    const tailNextNodeDirection = getNextNodeDirection(snake.tail, direction);
    const newDirection = getOppositeDirection(tailNextNodeDirection);
    setDirection(newDirection);

    // The tail of the snake is really the head of the linked list, which
    // is why we have to pass the snake's tail to `reverseLinkedList`.
    reverseLinkedList(snake.tail);
    const snakeHead = snake.head;
    snake.head = snake.tail;
    snake.tail = snakeHead;
  };

  const growSnake = () => {
    const growthNodeCoords = getGrowthNodeCoords(snake.tail, direction);
    if (isOutOfBounds(growthNodeCoords, board)) {
      return;
    }
    const newTailCell = board[growthNodeCoords.row][growthNodeCoords.col];
    const newTail = new LinkedListNode({
      row: growthNodeCoords.row,
      col: growthNodeCoords.col,
      cell: newTailCell,
    });
    const currentTail = snake.tail;
    snake.tail = newTail;
    snake.tail.next = currentTail;

    const newSnakeCells = new Set(snakeCells);
    newSnakeCells.add(newTailCell);
    setSnakeCells(newSnakeCells);
  };

  const handleEat = (newSnakeCells) => {
    const maxPossibleCellValue = BOARD_SIZE * BOARD_SIZE;
    let nextFoodCell;
    // In practice, this will never be a time-consuming operation. Even
    // in the extreme scenario where a snake is so big that it takes up 90%
    // of the board (nearly impossible), there would be a 10% chance of generating
    // a valid new food cell--so an average of 10 operations: trivial.
    while (true) {
      nextFoodCell = randomIntFromInterval(1, maxPossibleCellValue);
      if (newSnakeCells.has(nextFoodCell) || foodCell === nextFoodCell)
        continue;
      break;
    }

    const nextFoodShouldReverseDirection =
      Math.random() < PROBABILITY_OF_DIRECTION_REVERSAL_FOOD;

    setFoodCell(nextFoodCell);
    setFoodShouldReverseDirection(nextFoodShouldReverseDirection);
    setScore(score + 1);
  };

  return (
    <>
      Use the arrow keys to move the snake
      <h1>Score: {score}</h1>
      <div className="container">
        <div className="board">
          {board.map((row, rowIdx) => (
            <div key={rowIdx} className="row">
              {row.map((cellValue, cellIdx) => {
                const className = getCellClassName(
                  cellValue,
                  foodCell,
                  foodShouldReverseDirection,
                  snakeCells
                );
                return <div key={cellIdx} className={className}></div>;
              })}
            </div>
          ))}
        </div>
        <div className="key">
          <h3>Regular Food: </h3>
          <div className="cell cell-red"></div> <br />
          <h3>Reverse Food: </h3>
          <div className="cell cell-purple"></div>
        </div>
      </div>
    </>
  );
};

const createBoard = (BOARD_SIZE) => {
  let counter = [];
  const board = [];
  for (let row = 0; row < 10; row++) {
    const currentRow = [];
    for (let col = 0; col < 10; col++) {
      currentRow.push(counter++);
    }
    board.push(currentRow);
  }
  return board;
};

const getCoordsInDirection = (coords, direction) => {
  if (direction === Direction.UP) {
    return {
      row: coords.row - 1,
      col: coords.col,
    };
  }
  if (direction === Direction.RIGHT) {
    return {
      row: coords.row,
      col: coords.col + 1,
    };
  }
  if (direction === Direction.DOWN) {
    return {
      row: coords.row + 1,
      col: coords.col,
    };
  }
  if (direction === Direction.LEFT) {
    return {
      row: coords.row,
      col: coords.col - 1,
    };
  }
};

const isOutOfBounds = (coords, board) => {
  const { row, col } = coords;
  if (row < 0 || col < 0) return true;
  if (row >= board.length || col >= board[0].length) return true;
  return false;
};

const getGrowthNodeCoords = (snakeTail, currentDirection) => {
  const tailNextNodeDirection = getNextNodeDirection(
    snakeTail,
    currentDirection
  );
  const growthDirection = getOppositeDirection(tailNextNodeDirection);
  const currentTailCoords = {
    row: snakeTail.value.row,
    col: snakeTail.value.col,
  };
  const growthNodeCoords = getCoordsInDirection(
    currentTailCoords,
    growthDirection
  );
  return growthNodeCoords;
};

const getOppositeDirection = (direction) => {
  if (direction === Direction.UP) return Direction.DOWN;
  if (direction === Direction.DOWN) return Direction.UP;
  if (direction === Direction.LEFT) return Direction.RIGHT;
  if (direction === Direction.RIGHT) return Direction.LEFT;
};

const getDirectionFromKey = (key) => {
  if (key === "ArrowUp") return Direction.UP;
  if (key === "ArrowRight") return Direction.RIGHT;
  if (key === "ArrowLeft") return Direction.LEFT;
  if (key === "ArrowDown") return Direction.DOWN;
  return "";
};

const getNextNodeDirection = (node, currentDirection) => {
  if (node.next === null) return currentDirection;
  const { row: currentRow, col: currentCol } = node.value;
  const { row: nextRow, col: nextCol } = node.next.value;
  if (nextRow === currentRow && nextCol === currentCol + 1) {
    return Direction.RIGHT;
  }
  if (nextRow === currentRow && nextCol === currentCol - 1) {
    return Direction.LEFT;
  }
  if (nextCol === currentCol && nextRow === currentRow + 1) {
    return Direction.DOWN;
  }
  if (nextCol === currentCol && nextRow === currentRow - 1) {
    return Direction.UP;
  }
  return "";
};

//function for naming the class based on if it is a snake or food or reg cell
const getCellClassName = (
  cellValue,
  foodCell,
  foodShouldReverseDirection,
  snakeCells
) => {
  let className = "cell";
  if (cellValue === foodCell) {
    if (foodShouldReverseDirection) {
      className = "cell cell-purple";
    } else {
      className = "cell cell-red";
    }
  }
  if (snakeCells.has(cellValue)) className = "cell cell-green";

  return className;
};

export default Board;
