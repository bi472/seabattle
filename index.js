class SeaBattle {
  constructor(gameAreaId) {
    // Получаем элемент с заданным идентификатором
    this.gameGrid = document.getElementById(gameAreaId);
  
    // Массивы для определения границ игрового поля
    this.boarderWidth = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    this.boarderHeight = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  
    // Константы для обозначения занятой и свободной ячеек
    this.CELL_OCCUPIED = 1;
    this.CELL_EMPTY = 0;
  
    // Задержка перед ходом компьютера (в миллисекундах)
    this.pcShotDelay = 2000;
    
    // Конфигурация кораблей
    this.shipsConfiguration = [
      { maxShips: 1, pointCount: 4 },  
      { maxShips: 2, pointCount: 3 },   
      { maxShips: 3, pointCount: 2 },  
      { maxShips: 4, pointCount: 1 }    
    ];
    
    // Общее количество попаданий, необходимых для победы
    this.requiredHits = this.shipsConfiguration.reduce((total, config) => {
      return total + (config.maxShips * config.pointCount);
    }, 0);
  }
  

  run() {
      this.buildToolbar();
      this.buildGameFields();
      this.buildFooter();
      this.startNewGame();
  }

  buildToolbar() {
      this.toolbar = document.createElement('div');
      this.difficultybar = document.createElement('div');
      this.toolbar.setAttribute('class', 'toolbar');
      this.gameGrid.appendChild(this.toolbar);
  }

  buildGameFields() {
      let pcGameArea = document.createElement('div');
      pcGameArea.setAttribute('class', 'pcGameArea');
      this.gameGrid.appendChild(pcGameArea);

      let userGameArea = document.createElement('div');
      userGameArea.setAttribute('class', 'userGameArea');
      this.gameGrid.appendChild(userGameArea);

      this.pcStatus = document.createElement('div');
      pcGameArea.appendChild(this.pcStatus);

      this.userStatus = document.createElement('div');
      userGameArea.appendChild(this.userStatus);

      this.pcGameField = document.createElement('div');
      this.pcGameField.setAttribute('class', 'gameField');
      this.userGameField = document.createElement('div');
      this.userGameField.setAttribute('class', 'gameField');
      pcGameArea.appendChild(this.pcGameField);
      userGameArea.appendChild(this.userGameField);
  }

  buildFooter() {
    let footer = document.createElement('div');
    footer.setAttribute('class', 'footer');
  
    this.startGameButton = document.createElement('button');
    this.startGameButton.innerHTML = 'Start Game';
    this.startGameButton.addEventListener('click', () => this.startNewGame());
  
    footer.appendChild(this.startGameButton);
    this.gameGrid.appendChild(footer);
  }

  startNewGame() {
    this.startGameButton.innerHTML = 'Начать заново';
    this.pcStatus.innerHTML = "Игровое поле компьютера";
    this.userStatus.innerHTML = "Ваше поле";
  
    this._pcShipGrid = this.generateRandomShipMap();
    this._userShipGrid = this.generateRandomShipMap();

    this._pcShotMap = this.generateShotMap();
    this._userHits = 0;
    this._pcHits = 0;
    this._gameStopped = false;
    this._pcGoing = false;
  
    this.drawGameCells();
    this.updateToolbar();
  }

  
  stopGame(){
    this._gameStopped = true;
    this._pcGoing = false;
    this.startGameButton.innerHTML = 'Сыграть еще раз';
    this.updateToolbar();
  }

  isGameStopped(){
    return this._gameStopped;
  }

  getFireSuccessTemplate(){
    return 'X';
  }

  getFireFailTemplate(){
    return 'O';
  }


  drawGameCells() {
    for (let rowIndex = 0; rowIndex < this.boarderHeight.length; rowIndex++) {
      for (let columnIndex = 0; columnIndex < this.boarderWidth.length; columnIndex++) {
        const pcFieldSquare = this.obtainOrCreateBlock(rowIndex, columnIndex);
        pcFieldSquare.onclick = (e) => {
          this.userFire(e);
        };
        // Если нужно отобразить корабли компьютера
        // if (this._pcShipGrid[rowIndex][columnIndex] === this.CELL_OCCUPIED) {
        //   pcFieldSquare.setAttribute('class', 'ship');
        // }
  
        const userFieldSquare = this.obtainOrCreateBlock(rowIndex, columnIndex, 'user');
        if (this._userShipGrid[rowIndex][columnIndex] === this.CELL_OCCUPIED) {
          userFieldSquare.setAttribute('class', 'ship');
        }

        
      }
    }
  }
  

obtainOrCreateBlock(rowIndex, columnIndex, type) {
  const id = this.getPointBlockIdByCoords(rowIndex, columnIndex, type);
  
  let block = document.getElementById(id);

  if (block) {
    // Если блок уже существует, очищаем его содержимое и удаляем классы стилей
    block.innerHTML = '';
    block.setAttribute('class', '');
  } else {
    // Если блока еще нет, создаем новый элемент div и устанавливаем ему нужные атрибуты
    block = document.createElement('div');
    block.setAttribute('id', id);
    block.setAttribute('data-x', columnIndex);
    block.setAttribute('data-y', rowIndex);

    // Добавляем блок на игровое поле пользователя или компьютера в зависимости от типа
    if (type && type === 'user') {
      this.userGameField.appendChild(block);
    } else {
      this.pcGameField.appendChild(block);
    }
  }

  // Устанавливаем ширину блока в процентах от ширины строки игрового поля
  block.style.width = `${100 / this.boarderHeight.length}%`;

  // Если высота блока еще не установлена, сохраняем ее, используя ширину текущего блока
  if (!this._blockHeight) {
    this._blockHeight = block.clientWidth;
  }

  // Устанавливаем высоту блока, выравнивание содержимого по центру и размер шрифта
  block.style.height = `${this._blockHeight}px`;
  block.style.lineHeight = `${this._blockHeight}px`;
  block.style.fontSize = `${this._blockHeight}px`;

  return block;
}


getPointBlockIdByCoords(rowIndex, columnIndex, type) {
  // Определяем префикс идентификатора в зависимости от типа (пользователь или компьютер)
  const prefix = type && type === 'user' ? 'user' : 'pc';

  // Формируем идентификатор блока, используя координаты строки и столбца
  // в формате "тип_xСтолбец_yСтрока"
  return `${prefix}_x${columnIndex}_y${rowIndex}`;
}


generateShotMap() {
  const map = [];

  // Проходим по каждой строке на игровом поле
  for (let rowIndex = 0; rowIndex < this.boarderHeight.length; rowIndex++) {
    // Проходим по каждому столбцу на игровом поле
    for (let columnIndex = 0; columnIndex < this.boarderWidth.length; columnIndex++) {
      // Создаем объект с координатами (x, y) текущей ячейки и добавляем его в карту
      map.push({ y: rowIndex, x: columnIndex });
    }
  }

  // Возвращаем сгенерированную карту выстрелов
  return map;
}


generateRandomShipMap() {
  const map = [];

  // Генерация пустой карты
  for (let rowIndex = -1; rowIndex < this.boarderHeight.length + 1; rowIndex++) {
    map[rowIndex] = [];
    for (let columnIndex = -1; columnIndex < this.boarderWidth.length + 1; columnIndex++) {
      map[rowIndex][columnIndex] = this.CELL_EMPTY;
    }
  }

  // Создание копии настроек кораблей для дальнейших манипуляций
  const shipsConfiguration = JSON.parse(JSON.stringify(this.shipsConfiguration));

  // Размещение кораблей
  for (const shipConfig of shipsConfiguration) {
    for (let i = 0; i < shipConfig.maxShips; i++) {
      let shipPlaced = false;

      while (!shipPlaced) {
        // Генерация случайных координат
        const columnIndex = this.getRandomInt(0, this.boarderWidth.length);
        const rowIndex = this.getRandomInt(0, this.boarderHeight.length);

        // Проверка, что точка свободна для размещения корабля
        if (this.isPointFree(map, columnIndex, rowIndex)) {
          const pointCount = shipConfig.pointCount;

          // Проверка возможности размещения корабля горизонтально
          if (this.canPutHorizontal(map, columnIndex, rowIndex, pointCount, this.boarderWidth.length)) {
            for (let j = 0; j < pointCount; j++) {
              // Заполнение ячеек карты значением, указывающим на занятость кораблем
              map[rowIndex][columnIndex + j] = this.CELL_OCCUPIED;
            }
            shipPlaced = true;
          }
          // Проверка возможности размещения корабля вертикально
          else if (this.canPutVertical(map, columnIndex, rowIndex, pointCount, this.boarderHeight.length)) {
            for (let j = 0; j < pointCount; j++) {
              // Заполнение ячеек карты значением, указывающим на занятость кораблем
              map[rowIndex + j][columnIndex] = this.CELL_OCCUPIED;
            }
            shipPlaced = true;
          }
        }
      }
    }
  }

  return map;
}



getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

isPointFree(map, columnIndex, rowIndex) {
  // Определение координат соседних точек
  const surroundingCoordinates = [
    { x: columnIndex, y: rowIndex },
    { x: columnIndex - 1, y: rowIndex },
    { x: columnIndex - 1, y: rowIndex + 1 },
    { x: columnIndex, y: rowIndex + 1 },
    { x: columnIndex + 1, y: rowIndex + 1 },
    { x: columnIndex + 1, y: rowIndex },
    { x: columnIndex + 1, y: rowIndex - 1 },
    { x: columnIndex, y: rowIndex - 1 },
    { x: columnIndex - 1, y: rowIndex - 1 },
  ];

  // Проверка каждой соседней точки на занятость
  for (const { x, y } of surroundingCoordinates) {
    if (map[y][x] !== this.CELL_EMPTY) {
      // Если хотя бы одна точка занята, возвращаем false
      return false;
    }
  }

  // Если все соседние точки свободны, возвращаем true
  return true;
}


canPutHorizontal(map, columnIndex, rowIndex, shipLength, coordLength) {
  let freePoints = 0;

  // Проверка каждой точки в горизонтальном направлении
  for (let x = columnIndex; x < coordLength; x++) {
    // Определение координат соседних точек для текущей точки
    const surroundingCoordinates = [
      { x: x, y: rowIndex },
      { x: x, y: rowIndex - 1 },
      { x: x + 1, y: rowIndex - 1 },
      { x: x + 1, y: rowIndex },
      { x: x + 1, y: rowIndex + 1 },
      { x: x, y: rowIndex + 1 },
    ];

    let isFree = true;
    for (const { x, y } of surroundingCoordinates) {
      // Проверка каждой соседней точки на занятость
      if (map[y][x] !== this.CELL_EMPTY) {
        // Если хотя бы одна точка занята, устанавливаем флаг занятости
        isFree = false;
        break;
      }
    }

    if (isFree) {
      // Если все соседние точки свободны, увеличиваем счетчик свободных точек
      freePoints++;
    } else {
      // Если хотя бы одна соседняя точка занята, прекращаем проверку
      break;
    }
  }

  // Проверяем, достаточно ли свободных точек для размещения корабля
  return freePoints >= shipLength;
}


canPutVertical(map, columnIndex, rowIndex, shipLength, coordLength) {
  let freePoints = 0;

  // Проверка каждой точки в вертикальном направлении
  for (let y = rowIndex; y < coordLength; y++) {
    // Определение координат соседних точек для текущей точки
    const surroundingCoordinates = [
      { x: columnIndex, y: y },
      { x: columnIndex + 1, y: y },
      { x: columnIndex + 1, y: y + 1 },
      { x: columnIndex, y: y + 1 },
      { x: columnIndex - 1, y: y },
      { x: columnIndex - 1, y: y - 1 },
    ];

    let isFree = true;
    for (const { x, y } of surroundingCoordinates) {
      // Проверка каждой соседней точки на занятость
      if (map[y][x] !== this.CELL_EMPTY) {
        // Если хотя бы одна точка занята, устанавливаем флаг занятости
        isFree = false;
        break;
      }
    }

    if (isFree) {
      // Если все соседние точки свободны, увеличиваем счетчик свободных точек
      freePoints++;
    } else {
      // Если хотя бы одна соседняя точка занята, прекращаем проверку
      break;
    }
  }

  // Проверяем, достаточно ли свободных точек для размещения корабля
  return freePoints >= shipLength;
}


userFire(event) {
  // Проверка, остановлена ли игра или находится ли компьютер в процессе хода
  if (this.isGameStopped() || this.isPCGoing()) {
    return;
  }

  const { target } = event;
  const x = target.dataset.x;
  const y = target.dataset.y;

  // Проверка, пустая ли ячейка, на которую произведен выстрел
  if (this._pcShipGrid[y][x] === this.CELL_EMPTY) {
    // Если попал в пустую ячейку, отображаем шаблон неудачного выстрела
    target.innerHTML = this.getFireFailTemplate();
    // Подготовка компьютера к своему ходу
    this.prepareToPcFire();
  } else {
    // Если попал в корабль, отображаем шаблон успешного выстрела
    target.innerHTML = this.getFireSuccessTemplate();
    // Добавляем класс 'ship' к ячейке, чтобы отобразить попадание по кораблю
    target.classList.add('ship');
    // Увеличиваем счетчик попаданий пользователя
    this._userHits++;
    // Обновляем панель инструментов
    this.updateToolbar();

    // Проверка, достигнуто ли требуемое количество попаданий для победы
    if (this._userHits >= this.requiredHits) {
      // Если достигнуто, останавливаем игру
      this.stopGame();
    }
  }

  // Отключаем обработчик клика для выбранной ячейки
  target.onclick = null;
}


isPCGoing() {
  return this._pcGoing;
}

prepareToPcFire() {
  this._pcGoing = true;
  this.updateToolbar();
  setTimeout(() => {
    this.pcFire();
  }, this.pcShotDelay);
}

takeRandomShot() {
  // Генерация случайного индекса выстрела в пределах доступных координат на карте
  const randomShotIndex = this.getRandomInt(0, this._pcShotMap.length);
  // Получение следующего выстрела по случайно выбранному индексу
  const nextShot = this._pcShotMap[randomShotIndex];
  // Удаление выбранного выстрела из списка доступных выстрелов
  this._pcShotMap.splice(randomShotIndex, 1);
  // Возвращение следующего выстрела
  return nextShot;
}


pcFire() {
  if (this.isGameStopped()) {
    return;
  }

  let nextShot;

  // Если компьютер еще не попал, генерируется случайный выстрел
  if (!this._previousHit) {
    nextShot = this.takeRandomShot();
  } else {
    const { y, x } = this._previousHit;
    const neighbors = [];

    // Потенциальные соседние клетки вокруг предыдущего попадания
    const possibleNeighbors = [
      { y: y - 1, x }, // Клетка выше
      { y: y + 1, x }, // Клетка ниже
      { y, x: x - 1 }, // Клетка слева
      { y, x: x + 1 }  // Клетка справа
    ];

    // Проверка, являются ли потенциальные соседние клетки допустимыми выстрелами
    for (const neighbor of possibleNeighbors) {
      if (this._pcShotMap.some(coord => coord.y === neighbor.y && coord.x === neighbor.x)) {
        neighbors.push(neighbor);
      }
    }

    if (neighbors.length > 0) {
      // Если есть доступные соседние клетки, выбирается случайная из них
      const randomNeighborIndex = this.getRandomInt(0, neighbors.length);
      nextShot = neighbors[randomNeighborIndex];
      // Удаление выбранной клетки из списка доступных выстрелов
      const nextShotIndex = this._pcShotMap.findIndex(coord => coord.y === nextShot.y && coord.x === nextShot.x);
      this._pcShotMap.splice(nextShotIndex, 1);
    } else {
      
      // Если нет доступных соседних клеток, сбрасывается предыдущее попадание и генерируется случайный выстрел
      this._previousHit = null;
      nextShot = this.takeRandomShot();
    }
  }

  // Получение элемента на игровом поле пользователя, соответствующего выбранной клетке для выстрела
  const firedEl = document.getElementById(this.getPointBlockIdByCoords(nextShot.y, nextShot.x, 'user'));

  if (this._userShipGrid[nextShot.y][nextShot.x] === this.CELL_EMPTY) {
    // Если выстрел компьютера промахнулся, обновляется состояние игры и отображение клетки на поле
    this._pcGoing = false;
    this.updateToolbar();
    firedEl.innerHTML = this.getFireFailTemplate();
  } else {
    // Если выстрел компьютера попал, обновляется состояние игры, отображение клетки на поле, и проводится дополнительная проверка
    firedEl.innerHTML = this.getFireSuccessTemplate();
    this._previousHit = nextShot;

    // Удаление клеток по диагонали от попадания
    const diagonalCells = [
      { y: nextShot.y - 1, x: nextShot.x - 1 }, // Клетка вверх-влево
      { y: nextShot.y - 1, x: nextShot.x + 1 }, // Клетка вверх-вправо
      { y: nextShot.y + 1, x: nextShot.x - 1 }, // Клетка вниз-влево
      { y: nextShot.y + 1, x: nextShot.x + 1 }  // Клетка вниз-вправо
    ];

    // Удаление клеток по диагонали из списка доступных выстрелов
    for (const cell of diagonalCells) {
      const cellIndex = this._pcShotMap.findIndex(coord => coord.y === cell.y && coord.x === cell.x);
      if (cellIndex !== -1) {
        this._pcShotMap.splice(cellIndex, 1);
      }
    }

    // Обновление счетчика попаданий и панели инструментов
    this._pcHits++;
    this.updateToolbar();

    // Если компьютер достиг необходимого количества попаданий, игра завершается
    if (this._pcHits >= this.requiredHits) {
      this.stopGame();
    } else {
      // В противном случае компьютер готовится к следующему выстрелу
      this.prepareToPcFire();
    }
  }
}

updateToolbar(){
    this.toolbar.innerHTML = `Счет - ${this._userHits} : ${this._pcHits}`;
    if(this.isGameStopped()){
        if(this._userHits >= this.requiredHits){
            this.toolbar.innerHTML += ', вы победили!';
        }else{
            this.toolbar.innerHTML += ', победил ваш противник.';
        }
    }else if(this.isPCGoing()){
        this.toolbar.innerHTML += ', ходит ваш противник.';
    }else{
        this.toolbar.innerHTML += ', сейчас ваш ход.';
    }
  }
}

