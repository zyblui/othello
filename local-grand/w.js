let workerScope = {}
workerScope.board = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, -1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, -1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
]
workerScope.playerColor = 1;
workerScope.searchDepth = 6;
function workerMsg(e) {
    if (e.type == "computerPlay") {
        workerScope.playerColor = e.color;
        workerScope.board = e.board;
        workerScope.searchDepth = e.depth;
        if (!validMovesArr().length) return;
        mainMsg({
            type: "analysis",
            analysis: cpu(),
            nodes: workerScope.positionsConsidered
        })
    }
}
workerScope.positionsConsidered = 0;
function cpu() {
    let discs = discCount(workerScope.board).black + discCount(workerScope.board).white;
    let result = initSearchSort(workerScope.board, workerScope.searchDepth, workerScope.playerColor);
    console.log(result);
    result.sort(function (a, b) {
        return b.evaluation - a.evaluation;
    });
    result = result.slice(0, 3);
    let analysis = []
    for (let r of result) {
        for (let i = 0; i <= 9; i++) {
            for (let j = 0; j <= 9; j++) {
                if (workerScope.board[i][j] == 0 && r.board[i][j] != 0) {
                    analysis.push({
                        coord: LETTERS_GRAND[j] + (i + 1),
                        evaluation: r.evaluation
                    });
                }
            }
        }
    }
    return analysis;
}
function placeDisc(currentBoard, x, y, color) {
    if (currentBoard[x][y]) return { isValid: false };
    let tempBoard = JSON.parse(JSON.stringify(currentBoard));
    let isValidMove = false;
    for (let i of DIRECTIONS) {
        if (directionalFlip(tempBoard, x, y, i, color)) {
            isValidMove = true;
        }
    }
    if (isValidMove) {
        tempBoard[x][y] = color;
        return {
            isValid: true,
            board: tempBoard
        }
    }
    return { isValid: false };
}
function directionalFlip(currentBoard, x, y, direction, color) {//return value: is a valid directional flip
    let flipCounter = 0;
    do {
        flipCounter++;
        if (!(x + direction[0] * flipCounter >= 0 && x + direction[0] * flipCounter <= 9 && y + direction[1] * flipCounter >= 0 && y + direction[1] *
            flipCounter <= 9) || !currentBoard[x + direction[0] * flipCounter][y + direction[1] * flipCounter]) return false;
    } while (currentBoard[x + direction[0] * flipCounter][y + direction[1] * flipCounter] == -color);
    flipCounter--;
    if (!flipCounter) return false;
    for (let i = 1; i <= flipCounter; i++) {
        currentBoard[x + direction[0] * i][y + direction[1] * i] = color;
    }
    return true;
}
function getValidMoves(currentBoard, color) {
    let situations = []
    for (let m = 0; m <= 9; m++) {
        for (let n = 0; n <= 9; n++) {
            let placeResult = placeDisc(currentBoard, m, n, color);
            if (placeResult.isValid) {
                let placeResultBoard = placeResult.board
                situations.push({
                    board: placeResultBoard,
                    lastColorPlayed: color
                });
            }
        }
    }
    return situations;
}
function searchAlpha(currentMove, depth, color, playerColor, parentBestVal, clearNextMoves, isShallowSearch, isLastPass) {
    let currentBoard = currentMove.board;
    if (currentMove.nextMoves.length) {
        for (let i of currentMove.nextMoves) {
            searchAlpha(i, depth - 1, -color, playerColor, currentMove.evaluation, true, false, false);
            if (color == playerColor) {//current move is a maximizer, parent is a minimizer
                currentMove.evaluation = Math.max(currentMove.evaluation, i.evaluation);
                if (currentMove.evaluation > parentBestVal) {
                    break;
                }
            } else {//current move is a minimizer, parent is a maximizer
                currentMove.evaluation = Math.min(currentMove.evaluation, i.evaluation);
                if (currentMove.evaluation < parentBestVal) {
                    break;
                }
            }
        }
    } else {
        outerFor: for (let m = 0; m <= 9; m++) {
            for (let n = 0; n <= 9; n++) {
                let placeResult = placeDisc(currentBoard, m, n, color);
                if (placeResult.isValid) {
                    let placeResultBoard = placeResult.board;
                    currentMove.nextMoves.push({
                        board: placeResultBoard,
                        lastColorPlayed: color,
                        evaluation: (color == playerColor) ? +Infinity : -Infinity,
                        nextMoves: []
                    });
                    if (depth > 1) {
                        searchAlpha(currentMove.nextMoves[currentMove.nextMoves.length - 1], depth - 1, -color, playerColor, currentMove.evaluation, !isShallowSearch, isShallowSearch, false);
                    } else {
                        currentMove.nextMoves[currentMove.nextMoves.length - 1].evaluation = evaluateNew(placeResultBoard, playerColor);
                    }
                    if (color == playerColor) {//current move is a maximizer, parent is a minimizer
                        currentMove.evaluation = Math.max(currentMove.evaluation, currentMove.nextMoves[currentMove.nextMoves.length - 1].evaluation)
                        if (!isShallowSearch && currentMove.evaluation > parentBestVal) {
                            break outerFor;
                        }
                    } else {//current move is a minimizer, parent is a maximizer
                        currentMove.evaluation = Math.min(currentMove.evaluation, currentMove.nextMoves[currentMove.nextMoves.length - 1].evaluation);
                        if (!isShallowSearch && currentMove.evaluation < parentBestVal) {
                            break outerFor;
                        }
                    }
                }
            }
        }
        if (!currentMove.nextMoves.length) {
            currentMove.nextMoves = [{
                board: currentBoard,
                lastColorPlayed: -color,
                evaluation: (color == playerColor) ? +Infinity : -Infinity,
                nextMoves: []
            }]
            if (depth > 1 && !isLastPass) {
                searchAlpha(currentMove.nextMoves[0], depth, -color, playerColor, currentMove.evaluation, !isShallowSearch, isShallowSearch, true);
            } else if (isLastPass) {
                currentMove.nextMoves[0].evaluation = calculateFinalEval(currentBoard, playerColor);
            } else {
                currentMove.nextMoves[0].evaluation = evaluateNew(currentBoard, playerColor);
            }
            currentMove.evaluation = currentMove.nextMoves[0].evaluation;
        }
    }
    if (clearNextMoves) currentMove.nextMoves = [];
    return currentMove;
}
function initSearchAlpha(currentBoard, depth, color) {
    return searchAlpha({
        board: currentBoard,
        nextMoves: [],
        evaluation: -Infinity,
        lastColorPlayed: -color
    }, depth, color, color, +Infinity, false, false, false).nextMoves;
}
function initSearchSort(currentBoard, depth, color) {
    workerScope.positionsConsidered = 0;
    let shallowDepth = 0, exactDepth = 0;
    if (depth >= 8) {
        shallowDepth = 4;
        exactDepth = 12;
    } else {
        shallowDepth = 2;
        exactDepth = 12;
    }
    let sortedFlat = currentBoard.flat().sort();
    let shallowResult = shallowSearch(currentBoard, shallowDepth, color);
    //Continue searching to the depth set
    let blanks = sortedFlat.indexOf(1) - sortedFlat.indexOf(0);
    if (blanks <= exactDepth) {
        return searchAlpha(shallowResult, Infinity/*blanks+2*/, color, color, +Infinity, false, false, false).nextMoves;
    } else {
        return searchAlpha(shallowResult, depth, color, color, +Infinity, false, false, false).nextMoves;
    }
}
function shallowSearch(currentBoard, shallowDepth, color) {
    let shallowResult = searchAlpha({
        board: currentBoard,
        nextMoves: [],
        evaluation: -Infinity,
        lastColorPlayed: -color
    }, shallowDepth, color, color, +Infinity, false, true, false);
    //Sort and reset evaluations
    sort(shallowResult, false);
    return shallowResult;
}
function sort(move, evalIsInfinity) {
    if (move.nextMoves.length) {
        move.nextMoves.sort((a, b) => (evalIsInfinity) ? (a.evaluation - b.evaluation) : (b.evaluation - a.evaluation));
        for (let i of move.nextMoves) {
            sort(i, !evalIsInfinity);
        }
    }
    move.evaluation = (evalIsInfinity) ? Infinity : -Infinity;
}
function calculateFinalEval(bd, player) {
    workerScope.positionsConsidered++;
    let discs = discCount(bd);
    let blackAdvantageAnti = 0;
    if (discs.black != discs.white) {
        blackAdvantageAnti = (100 - discs.black - discs.white + Math.abs(discs.black - discs.white)) * ((discs.black < discs.white) ? 1 : -1)
    }
    return blackAdvantageAnti * -player;
}
function evaluateNew(bd, player) {
    workerScope.positionsConsidered++;
    let evaluation = 0;
    let discs = discCount(bd);
    let moveIndex = discs.black + discs.white - 4 - 1;
    evaluation += coeffs[moveIndex]["corner33"][Math.min(
        getPatternNo(bd[0][0], bd[0][1], bd[0][2], bd[1][0], bd[1][1], bd[1][2], bd[2][0], bd[2][1], bd[2][2]),
        getPatternNo(bd[0][0], bd[1][0], bd[2][0], bd[0][1], bd[1][1], bd[2][1], bd[0][2], bd[1][2], bd[2][2])
    )] || 0
    evaluation += coeffs[moveIndex]["corner33"][Math.min(
        getPatternNo(bd[0][9], bd[0][8], bd[0][7], bd[1][9], bd[1][8], bd[1][7], bd[2][9], bd[2][8], bd[2][7]),
        getPatternNo(bd[0][9], bd[1][9], bd[2][9], bd[0][8], bd[1][8], bd[2][8], bd[0][7], bd[1][7], bd[2][7])
    )] || 0
    evaluation += coeffs[moveIndex]["corner33"][Math.min(
        getPatternNo(bd[9][0], bd[9][1], bd[9][2], bd[8][0], bd[8][1], bd[8][2], bd[7][0], bd[7][1], bd[7][2]),
        getPatternNo(bd[9][0], bd[8][0], bd[7][0], bd[9][1], bd[8][1], bd[7][1], bd[9][2], bd[8][2], bd[7][2])
    )] || 0
    evaluation += coeffs[moveIndex]["corner33"][Math.min(
        getPatternNo(bd[9][9], bd[9][8], bd[9][7], bd[8][9], bd[8][8], bd[8][7], bd[7][9], bd[7][8], bd[7][7]),
        getPatternNo(bd[9][9], bd[8][9], bd[7][9], bd[9][8], bd[8][8], bd[7][8], bd[9][7], bd[8][7], bd[7][7])
    )] || 0
    evaluation += coeffs[moveIndex]["corner52"][
        getPatternNo(bd[0][0], bd[0][1], bd[0][2], bd[0][3], bd[0][4], bd[1][0], bd[1][1], bd[1][2], bd[1][3], bd[1][4])
    ] || 0
    evaluation += coeffs[moveIndex]["corner52"][
        getPatternNo(bd[0][0], bd[1][0], bd[2][0], bd[3][0], bd[4][0], bd[0][1], bd[1][1], bd[2][1], bd[3][1], bd[4][1])
    ] || 0
    evaluation += coeffs[moveIndex]["corner52"][
        getPatternNo(bd[9][0], bd[9][1], bd[9][2], bd[9][3], bd[9][4], bd[8][0], bd[8][1], bd[8][2], bd[8][3], bd[8][4])
    ] || 0
    evaluation += coeffs[moveIndex]["corner52"][
        getPatternNo(bd[9][0], bd[8][0], bd[7][0], bd[6][0], bd[5][0], bd[9][1], bd[8][1], bd[7][1], bd[6][1], bd[5][1])
    ] || 0
    evaluation += coeffs[moveIndex]["corner52"][
        getPatternNo(bd[0][9], bd[0][8], bd[0][7], bd[0][6], bd[0][5], bd[1][9], bd[1][8], bd[1][7], bd[1][6], bd[1][5])
    ] || 0
    evaluation += coeffs[moveIndex]["corner52"][
        getPatternNo(bd[0][9], bd[1][9], bd[2][9], bd[3][9], bd[4][9], bd[0][8], bd[1][8], bd[2][8], bd[3][8], bd[4][8])
    ] || 0
    evaluation += coeffs[moveIndex]["corner52"][
        getPatternNo(bd[9][9], bd[8][9], bd[7][9], bd[6][9], bd[5][9], bd[9][8], bd[8][8], bd[7][8], bd[6][8], bd[5][8])
    ] || 0
    evaluation += coeffs[moveIndex]["corner52"][
        getPatternNo(bd[9][9], bd[9][8], bd[9][7], bd[9][6], bd[9][5], bd[8][9], bd[8][8], bd[8][7], bd[8][6], bd[8][5])
    ] || 0
    evaluation += coeffs[moveIndex]["row1"][Math.min(
        getPatternNo(bd[0][0], bd[0][1], bd[0][2], bd[0][3], bd[0][4], bd[0][5], bd[0][6], bd[0][7], bd[0][8], bd[0][9]),
        getPatternNo(bd[0][9], bd[0][8], bd[0][7], bd[0][6], bd[0][5], bd[0][4], bd[0][3], bd[0][2], bd[0][1], bd[0][0])
    )] || 0
    evaluation += coeffs[moveIndex]["row1"][Math.min(
        getPatternNo(bd[9][0], bd[9][1], bd[9][2], bd[9][3], bd[9][4], bd[9][5], bd[9][6], bd[9][7], bd[9][8], bd[9][9]),
        getPatternNo(bd[9][9], bd[9][8], bd[9][7], bd[9][6], bd[9][5], bd[9][4], bd[9][3], bd[9][2], bd[9][1], bd[9][0])
    )] || 0
    evaluation += coeffs[moveIndex]["row1"][Math.min(
        getPatternNo(bd[0][0], bd[1][0], bd[2][0], bd[3][0], bd[4][0], bd[5][0], bd[6][0], bd[7][0], bd[8][0], bd[9][0]),
        getPatternNo(bd[9][0], bd[8][0], bd[7][0], bd[6][0], bd[5][0], bd[4][0], bd[3][0], bd[2][0], bd[1][0], bd[0][0])
    )] || 0
    evaluation += coeffs[moveIndex]["row1"][Math.min(
        getPatternNo(bd[0][9], bd[1][9], bd[2][9], bd[3][9], bd[4][9], bd[5][9], bd[6][9], bd[7][9], bd[8][9], bd[9][9]),
        getPatternNo(bd[9][9], bd[8][9], bd[7][9], bd[6][9], bd[5][9], bd[4][9], bd[3][9], bd[2][9], bd[1][9], bd[0][9])
    )] || 0
    evaluation += coeffs[moveIndex]["row2"][Math.min(
        getPatternNo(bd[1][0], bd[1][1], bd[1][2], bd[1][3], bd[1][4], bd[1][5], bd[1][6], bd[1][7], bd[1][8], bd[1][9]),
        getPatternNo(bd[1][9], bd[1][8], bd[1][7], bd[1][6], bd[1][5], bd[1][4], bd[1][3], bd[1][2], bd[1][1], bd[1][0])
    )] || 0
    evaluation += coeffs[moveIndex]["row2"][Math.min(
        getPatternNo(bd[8][0], bd[8][1], bd[8][2], bd[8][3], bd[8][4], bd[8][5], bd[8][6], bd[8][7], bd[8][8], bd[8][9]),
        getPatternNo(bd[8][9], bd[8][8], bd[8][7], bd[8][6], bd[8][5], bd[8][4], bd[8][3], bd[8][2], bd[8][1], bd[8][0])
    )] || 0
    evaluation += coeffs[moveIndex]["row2"][Math.min(
        getPatternNo(bd[0][1], bd[1][1], bd[2][1], bd[3][1], bd[4][1], bd[5][1], bd[6][1], bd[7][1], bd[8][1], bd[9][1]),
        getPatternNo(bd[9][1], bd[8][1], bd[7][1], bd[6][1], bd[5][1], bd[4][1], bd[3][1], bd[2][1], bd[1][1], bd[0][1])
    )] || 0
    evaluation += coeffs[moveIndex]["row2"][Math.min(
        getPatternNo(bd[0][8], bd[1][8], bd[2][8], bd[3][8], bd[4][8], bd[5][8], bd[6][8], bd[7][8], bd[8][8], bd[9][8]),
        getPatternNo(bd[9][8], bd[8][8], bd[7][8], bd[6][8], bd[5][8], bd[4][8], bd[3][8], bd[2][8], bd[1][8], bd[0][8])
    )] || 0
    evaluation += coeffs[moveIndex]["row3"][Math.min(
        getPatternNo(bd[2][0], bd[2][1], bd[2][2], bd[2][3], bd[2][4], bd[2][5], bd[2][6], bd[2][7], bd[2][8], bd[2][9]),
        getPatternNo(bd[2][9], bd[2][8], bd[2][7], bd[2][6], bd[2][5], bd[2][4], bd[2][3], bd[2][2], bd[2][1], bd[2][0])
    )] || 0
    evaluation += coeffs[moveIndex]["row3"][Math.min(
        getPatternNo(bd[7][0], bd[7][1], bd[7][2], bd[7][3], bd[7][4], bd[7][5], bd[7][6], bd[7][7], bd[7][8], bd[7][9]),
        getPatternNo(bd[7][9], bd[7][8], bd[7][7], bd[7][6], bd[7][5], bd[7][4], bd[7][3], bd[7][2], bd[7][1], bd[7][0])
    )] || 0
    evaluation += coeffs[moveIndex]["row3"][Math.min(
        getPatternNo(bd[0][2], bd[1][2], bd[2][2], bd[3][2], bd[4][2], bd[5][2], bd[6][2], bd[7][2], bd[8][2], bd[9][2]),
        getPatternNo(bd[9][2], bd[8][2], bd[7][2], bd[6][2], bd[5][2], bd[4][2], bd[3][2], bd[2][2], bd[1][2], bd[0][2])
    )] || 0
    evaluation += coeffs[moveIndex]["row3"][Math.min(
        getPatternNo(bd[0][7], bd[1][7], bd[2][7], bd[3][7], bd[4][7], bd[5][7], bd[6][7], bd[7][7], bd[8][7], bd[9][7]),
        getPatternNo(bd[9][7], bd[8][7], bd[7][7], bd[6][7], bd[5][7], bd[4][7], bd[3][7], bd[2][7], bd[1][7], bd[0][7])
    )] || 0
    evaluation += coeffs[moveIndex]["row4"][Math.min(
        getPatternNo(bd[3][0], bd[3][1], bd[3][2], bd[3][3], bd[3][4], bd[3][5], bd[3][6], bd[3][7], bd[3][8], bd[3][9]),
        getPatternNo(bd[3][9], bd[3][8], bd[3][7], bd[3][6], bd[3][5], bd[3][4], bd[3][3], bd[3][2], bd[3][1], bd[3][0])
    )] || 0
    evaluation += coeffs[moveIndex]["row4"][Math.min(
        getPatternNo(bd[6][0], bd[6][1], bd[6][2], bd[6][3], bd[6][4], bd[6][5], bd[6][6], bd[6][7], bd[6][8], bd[6][9]),
        getPatternNo(bd[6][9], bd[6][8], bd[6][7], bd[6][6], bd[6][5], bd[6][4], bd[6][3], bd[6][2], bd[6][1], bd[6][0])
    )] || 0
    evaluation += coeffs[moveIndex]["row4"][Math.min(
        getPatternNo(bd[0][3], bd[1][3], bd[2][3], bd[3][3], bd[4][3], bd[5][3], bd[6][3], bd[7][3], bd[8][3], bd[9][3]),
        getPatternNo(bd[9][3], bd[8][3], bd[7][3], bd[6][3], bd[5][3], bd[4][3], bd[3][3], bd[2][3], bd[1][3], bd[0][3])
    )] || 0
    evaluation += coeffs[moveIndex]["row4"][Math.min(
        getPatternNo(bd[0][6], bd[1][6], bd[2][6], bd[3][6], bd[4][6], bd[5][6], bd[6][6], bd[7][6], bd[8][6], bd[9][6]),
        getPatternNo(bd[9][6], bd[8][6], bd[7][6], bd[6][6], bd[5][6], bd[4][6], bd[3][6], bd[2][6], bd[1][6], bd[0][6])
    )] || 0
    evaluation += coeffs[moveIndex]["row5"][Math.min(
        getPatternNo(bd[4][0], bd[4][1], bd[4][2], bd[4][3], bd[4][4], bd[4][5], bd[4][6], bd[4][7], bd[4][8], bd[4][9]),
        getPatternNo(bd[4][9], bd[4][8], bd[4][7], bd[4][6], bd[4][5], bd[4][4], bd[4][3], bd[4][2], bd[4][1], bd[4][0])
    )] || 0
    evaluation += coeffs[moveIndex]["row5"][Math.min(
        getPatternNo(bd[5][0], bd[5][1], bd[5][2], bd[5][3], bd[5][4], bd[5][5], bd[5][6], bd[5][7], bd[5][8], bd[5][9]),
        getPatternNo(bd[5][9], bd[5][8], bd[5][7], bd[5][6], bd[5][5], bd[5][4], bd[5][3], bd[5][2], bd[5][1], bd[5][0])
    )] || 0
    evaluation += coeffs[moveIndex]["row5"][Math.min(
        getPatternNo(bd[0][4], bd[1][4], bd[2][4], bd[3][4], bd[4][4], bd[5][4], bd[6][4], bd[7][4], bd[8][4], bd[9][4]),
        getPatternNo(bd[9][4], bd[8][4], bd[7][4], bd[6][4], bd[5][4], bd[4][4], bd[3][4], bd[2][4], bd[1][4], bd[0][4])
    )] || 0
    evaluation += coeffs[moveIndex]["row5"][Math.min(
        getPatternNo(bd[0][5], bd[1][5], bd[2][5], bd[3][5], bd[4][5], bd[5][5], bd[6][5], bd[7][5], bd[8][5], bd[9][5]),
        getPatternNo(bd[9][5], bd[8][5], bd[7][5], bd[6][5], bd[5][5], bd[4][5], bd[3][5], bd[2][5], bd[1][5], bd[0][5])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal4"][Math.min(
        getPatternNo(bd[0][3], bd[1][2], bd[2][1], bd[3][0]),
        getPatternNo(bd[3][0], bd[2][1], bd[1][2], bd[0][3])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal4"][Math.min(
        getPatternNo(bd[0][6], bd[1][7], bd[2][8], bd[3][9]),
        getPatternNo(bd[3][9], bd[2][8], bd[1][7], bd[0][6])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal4"][Math.min(
        getPatternNo(bd[6][0], bd[7][1], bd[8][2], bd[9][3]),
        getPatternNo(bd[9][3], bd[8][2], bd[7][1], bd[6][0])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal4"][Math.min(
        getPatternNo(bd[6][9], bd[7][8], bd[8][7], bd[9][6]),
        getPatternNo(bd[9][6], bd[8][7], bd[7][8], bd[6][9])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal5"][Math.min(
        getPatternNo(bd[0][4], bd[1][3], bd[2][2], bd[3][1], bd[4][0]),
        getPatternNo(bd[4][0], bd[3][1], bd[2][2], bd[1][3], bd[0][4])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal5"][Math.min(
        getPatternNo(bd[0][5], bd[1][6], bd[2][7], bd[3][8], bd[4][9]),
        getPatternNo(bd[4][9], bd[3][8], bd[2][7], bd[1][6], bd[0][5])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal5"][Math.min(
        getPatternNo(bd[5][0], bd[6][1], bd[7][2], bd[8][3], bd[9][4]),
        getPatternNo(bd[9][4], bd[8][3], bd[7][2], bd[6][1], bd[5][0])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal5"][Math.min(
        getPatternNo(bd[5][9], bd[6][8], bd[7][7], bd[8][6], bd[9][5]),
        getPatternNo(bd[9][5], bd[8][6], bd[7][7], bd[6][8], bd[5][9])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal6"][Math.min(
        getPatternNo(bd[0][5], bd[1][4], bd[2][3], bd[3][2], bd[4][1], bd[5][0]),
        getPatternNo(bd[5][0], bd[4][1], bd[3][2], bd[2][3], bd[1][4], bd[0][5])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal6"][Math.min(
        getPatternNo(bd[0][4], bd[1][5], bd[2][6], bd[3][7], bd[4][8], bd[5][9]),
        getPatternNo(bd[5][9], bd[4][8], bd[3][7], bd[2][6], bd[1][5], bd[0][4])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal6"][Math.min(
        getPatternNo(bd[4][0], bd[5][1], bd[6][2], bd[7][3], bd[8][4], bd[9][5]),
        getPatternNo(bd[9][5], bd[8][4], bd[7][3], bd[6][2], bd[5][1], bd[4][0])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal6"][Math.min(
        getPatternNo(bd[4][9], bd[5][8], bd[6][7], bd[7][6], bd[8][5], bd[9][4]),
        getPatternNo(bd[9][4], bd[8][5], bd[7][6], bd[6][7], bd[5][8], bd[4][9])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal7"][Math.min(
        getPatternNo(bd[0][6], bd[1][5], bd[2][4], bd[3][3], bd[4][2], bd[5][1], bd[6][0]),
        getPatternNo(bd[6][0], bd[5][1], bd[4][2], bd[3][3], bd[2][4], bd[1][5], bd[0][6])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal7"][Math.min(
        getPatternNo(bd[9][6], bd[8][5], bd[7][4], bd[6][3], bd[5][2], bd[4][1], bd[3][0]),
        getPatternNo(bd[3][0], bd[4][1], bd[5][2], bd[6][3], bd[7][4], bd[8][5], bd[9][6])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal7"][Math.min(
        getPatternNo(bd[0][3], bd[1][4], bd[2][5], bd[3][6], bd[4][7], bd[5][8], bd[6][9]),
        getPatternNo(bd[6][9], bd[5][8], bd[4][7], bd[3][6], bd[2][5], bd[1][4], bd[0][3])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal7"][Math.min(
        getPatternNo(bd[9][3], bd[8][4], bd[7][5], bd[6][6], bd[5][7], bd[4][8], bd[3][9]),
        getPatternNo(bd[3][9], bd[4][8], bd[5][7], bd[6][6], bd[7][5], bd[8][4], bd[9][3])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal8"][Math.min(
        getPatternNo(bd[0][7], bd[1][6], bd[2][5], bd[3][4], bd[4][3], bd[5][2], bd[6][1], bd[7][0]),
        getPatternNo(bd[7][0], bd[6][1], bd[5][2], bd[4][3], bd[3][4], bd[2][5], bd[1][6], bd[0][7])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal8"][Math.min(
        getPatternNo(bd[0][2], bd[1][3], bd[2][4], bd[3][5], bd[4][6], bd[5][7], bd[6][8], bd[7][9]),
        getPatternNo(bd[7][9], bd[6][8], bd[5][7], bd[4][6], bd[3][5], bd[2][4], bd[1][3], bd[0][2])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal8"][Math.min(
        getPatternNo(bd[9][7], bd[8][6], bd[7][5], bd[6][4], bd[5][3], bd[4][2], bd[3][1], bd[2][0]),
        getPatternNo(bd[2][0], bd[3][1], bd[4][2], bd[5][3], bd[6][4], bd[7][5], bd[8][6], bd[9][7])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal8", Math.min(
        getPatternNo(bd[9][2], bd[8][3], bd[7][4], bd[6][5], bd[5][6], bd[4][7], bd[3][8], bd[2][9]),
        getPatternNo(bd[2][9], bd[3][8], bd[4][7], bd[5][6], bd[6][5], bd[7][4], bd[8][3], bd[9][2])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal9"][Math.min(
        getPatternNo(bd[0][8], bd[1][7], bd[2][6], bd[3][5], bd[4][4], bd[5][3], bd[6][2], bd[7][1], bd[8][0]),
        getPatternNo(bd[8][0], bd[7][1], bd[6][2], bd[5][3], bd[4][4], bd[3][5], bd[2][6], bd[1][7], bd[0][8])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal9"][Math.min(
        getPatternNo(bd[0][1], bd[1][2], bd[2][3], bd[3][4], bd[4][5], bd[5][6], bd[6][7], bd[7][8], bd[8][9]),
        getPatternNo(bd[1][0], bd[2][1], bd[3][2], bd[4][3], bd[5][4], bd[6][5], bd[7][6], bd[8][7], bd[9][8])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal9"][Math.min(
        getPatternNo(bd[9][8], bd[8][7], bd[7][6], bd[6][5], bd[5][4], bd[4][3], bd[3][2], bd[2][1], bd[1][0]),
        getPatternNo(bd[8][9], bd[7][8], bd[6][7], bd[5][6], bd[4][5], bd[3][4], bd[2][3], bd[1][2], bd[0][1])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal9"][Math.min(
        getPatternNo(bd[9][1], bd[8][2], bd[7][3], bd[6][4], bd[5][5], bd[4][6], bd[3][7], bd[2][8], bd[1][9]),
        getPatternNo(bd[1][9], bd[2][8], bd[3][7], bd[4][6], bd[5][5], bd[6][4], bd[7][3], bd[8][2], bd[9][1])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal10"][Math.min(
        getPatternNo(bd[0][0], bd[1][1], bd[2][2], bd[3][3], bd[4][4], bd[5][5], bd[6][6], bd[7][7], bd[8][8], bd[9][9]),
        getPatternNo(bd[9][9], bd[8][8], bd[7][7], bd[6][6], bd[5][5], bd[4][4], bd[3][3], bd[2][2], bd[1][1], bd[0][0])
    )] || 0
    evaluation += coeffs[moveIndex]["diagonal10"][Math.min(
        getPatternNo(bd[0][9], bd[1][8], bd[2][7], bd[3][6], bd[4][5], bd[5][4], bd[6][3], bd[7][2], bd[8][1], bd[9][0]),
        getPatternNo(bd[9][0], bd[8][1], bd[7][2], bd[6][3], bd[5][4], bd[4][5], bd[3][6], bd[2][7], bd[1][8], bd[0][9])
    )] || 0
    evaluation /= 57;
    if (negateEval) evaluation *= -1;
    return evaluation * player;
}
function discCount(currentBoard) {
    let discs = {
        black: 0,
        white: 0
    };
    for (let i of currentBoard.flat()) {
        if (i == 1) discs.black++;
        else if (i == -1) discs.white++;
    }
    return discs;
}
function getPatternNo() {
    let no = 0;
    for (let i = 0; i < arguments.length; i++) {
        //empty:0 black:1 white:2
        if (arguments[i] == 1) no += 1 * 3 ** (arguments.length - 1 - i);
        else if (arguments[i] == -1) no += 2 * 3 ** (arguments.length - 1 - i);
    }
    return no;
}