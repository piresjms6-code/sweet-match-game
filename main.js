(() => {
  'use strict';
  const SIZE = 8;
  const TYPES = ['🍓', '🍋', '🍇', '🍏', '🍊', '🫐'];
  const START_MOVES = 25;
  const boardEl = document.getElementById('board');
  const scoreEl = document.getElementById('score');
  const movesEl = document.getElementById('moves');
  const levelEl = document.getElementById('level');
  const targetEl = document.getElementById('target');
  const progressEl = document.getElementById('progress');
  const messageEl = document.getElementById('message');
  const dialogEl = document.getElementById('dialog');
  const dialogTitle = document.getElementById('dialogTitle');
  const dialogText = document.getElementById('dialogText');
  const dialogIcon = document.getElementById('dialogIcon');
  const continueBtn = document.getElementById('continueBtn');
  let board = [];
  let score = 0;
  let moves = START_MOVES;
  let level = 1;
  let target = 500;
  let selected = null;
  let busy = false;
  let hintTimer;
  let soundOn = false;

  function randomType() { return Math.floor(Math.random() * TYPES.length); }
  function freshBoard() {
    const result = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      let type;
      do {
        type = randomType();
      } while ((c >= 2 && result[r][c - 1] === type && result[r][c - 2] === type) ||
               (r >= 2 && result[r - 1][c] === type && result[r - 2][c] === type));
      result[r][c] = type;
    }
    if (!findMove(result)) return freshBoard();
    return result;
  }
  function matchCells(grid) {
    const found = new Set();
    for (let r = 0; r < SIZE; r++) {
      let start = 0;
      while (start < SIZE) {
        let end = start + 1;
        while (end < SIZE && grid[r][end] === grid[r][start]) end++;
        if (grid[r][start] !== null && end - start >= 3) for (let c = start; c < end; c++) found.add(`${r},${c}`);
        start = end;
      }
    }
    for (let c = 0; c < SIZE; c++) {
      let start = 0;
      while (start < SIZE) {
        let end = start + 1;
        while (end < SIZE && grid[end][c] === grid[start][c]) end++;
        if (grid[start][c] !== null && end - start >= 3) for (let r = start; r < end; r++) found.add(`${r},${c}`);
        start = end;
      }
    }
    return found;
  }
  function swap(grid, a, b) { [grid[a.r][a.c], grid[b.r][b.c]] = [grid[b.r][b.c], grid[a.r][a.c]]; }
  function findMove(grid) {
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const next = { r: r + dr, c: c + dc };
        if (next.r >= SIZE || next.c >= SIZE) continue;
        const here = { r, c };
        swap(grid, here, next);
        const works = matchCells(grid).size > 0;
        swap(grid, here, next);
        if (works) return { from: here, to: next };
      }
    }
    return null;
  }
  function render() {
    boardEl.replaceChildren();
    const fragment = document.createDocumentFragment();
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell' + (selected && selected.r === r && selected.c === c ? ' selected' : '');
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `${TYPES[board[r][c]]}, row ${r + 1}, column ${c + 1}`);
      cell.dataset.r = r;
      cell.dataset.c = c;
      const candy = document.createElement('span');
      candy.className = 'candy';
      candy.textContent = TYPES[board[r][c]];
      cell.append(candy);
      cell.addEventListener('click', () => onCell(r, c));
      fragment.append(cell);
    }
    boardEl.append(fragment);
  }
  function updateHud() {
    scoreEl.textContent = score;
    movesEl.textContent = moves;
    levelEl.textContent = level;
    targetEl.textContent = `/ ${target}`;
    progressEl.style.width = `${Math.min(100, score / target * 100)}%`;
  }
  function onCell(r, c) {
    if (busy || dialogEl.hidden === false) return;
    clearHint();
    if (!selected) { selected = { r, c }; render(); return; }
    if (selected.r === r && selected.c === c) { selected = null; render(); return; }
    if (Math.abs(selected.r - r) + Math.abs(selected.c - c) !== 1) { selected = { r, c }; render(); return; }
    const first = selected;
    selected = null;
    swap(board, first, { r, c });
    if (matchCells(board).size === 0) {
      swap(board, first, { r, c });
      messageEl.textContent = 'That swap doesn’t make a match. Try another!';
      render();
      return;
    }
    moves--;
    busy = true;
    messageEl.textContent = 'Nice match!';
    updateHud();
    render();
    window.setTimeout(resolveBoard, 140);
  }
  function resolveBoard() {
    const matches = matchCells(board);
    if (!matches.size) { finishTurn(); return; }
    for (const key of matches) {
      const [r, c] = key.split(',').map(Number);
      const cell = boardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
      if (cell) cell.classList.add('clearing');
    }
    score += matches.size * 10;
    updateHud();
    window.setTimeout(() => {
      for (const key of matches) {
        const [r, c] = key.split(',').map(Number);
        board[r][c] = null;
      }
      for (let c = 0; c < SIZE; c++) {
        let write = SIZE - 1;
        for (let r = SIZE - 1; r >= 0; r--) if (board[r][c] !== null) board[write--][c] = board[r][c];
        while (write >= 0) board[write--][c] = randomType();
      }
      render();
      window.setTimeout(resolveBoard, 120);
    }, 190);
  }
  function finishTurn() {
    busy = false;
    updateHud();
    if (score >= target) {
      openDialog('Level complete!', `You reached ${score} points. Ready for the next sweet challenge?`, '🎉', 'Next level', true);
    } else if (moves <= 0) {
      openDialog('Good try!', `You scored ${score} points. Your next round is waiting!`, '💪', 'Play again', false);
    } else if (!findMove(board)) {
      board = freshBoard();
      messageEl.textContent = 'The board got a little stuck, so your sweets have been shuffled!';
      render();
    } else {
      messageEl.textContent = 'Swap two sweets to match three or more!';
    }
  }
  function openDialog(title, text, icon, button, won) {
    dialogTitle.textContent = title;
    dialogText.textContent = text;
    dialogIcon.textContent = icon;
    continueBtn.textContent = button;
    continueBtn.dataset.won = String(won);
    dialogEl.hidden = false;
    continueBtn.focus();
  }
  function startRound(nextLevel = false) {
    if (nextLevel) { level++; target += 250; }
    score = 0;
    moves = START_MOVES;
    selected = null;
    busy = false;
    board = freshBoard();
    dialogEl.hidden = true;
    messageEl.textContent = 'Swap two sweets to match three or more!';
    updateHud();
    render();
  }
  function showHint() {
    if (busy || !dialogEl.hidden) return;
    clearHint();
    const move = findMove(board);
    if (!move) { board = freshBoard(); render(); return; }
    const a = boardEl.querySelector(`[data-r="${move.from.r}"][data-c="${move.from.c}"]`);
    const b = boardEl.querySelector(`[data-r="${move.to.r}"][data-c="${move.to.c}"]`);
    a?.classList.add('hint'); b?.classList.add('hint');
    messageEl.textContent = 'Try swapping the glowing sweets!';
    hintTimer = window.setTimeout(clearHint, 1400);
  }
  function clearHint() { window.clearTimeout(hintTimer); boardEl.querySelectorAll('.hint').forEach(cell => cell.classList.remove('hint')); }
  document.getElementById('hintBtn').addEventListener('click', showHint);
  document.getElementById('restartBtn').addEventListener('click', () => startRound(false));
  continueBtn.addEventListener('click', () => startRound(continueBtn.dataset.won === 'true'));
  document.getElementById('soundBtn').addEventListener('click', event => {
    soundOn = !soundOn;
    event.currentTarget.textContent = soundOn ? '♫' : '♪';
    event.currentTarget.setAttribute('aria-label', soundOn ? 'Sound on' : 'Sound off');
    messageEl.textContent = soundOn ? 'Sound toggle is ready for future sound effects.' : 'Sound off.';
  });
  startRound();
})();
