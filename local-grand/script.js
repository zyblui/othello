let searchDepth = 6;
let boardGrand = [
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
]//1 for black, -1 for white
let initialPositionGrand = [
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
];
let previousMoves = [];
let navigationPosition = [0, 0];
let positionsConsidered = 0;
let playerColor = 1;
let computerColor = -1;
let lastCoord = {
    x: 0,/*1~8 */
    y: 0
}
let maxDepth = 6;
let setupMode = false;
let setupDisc = 1;
const DIRECTIONS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const LETTERS_GRAND = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
for (let i of document.querySelectorAll(".tab")) {
    i.addEventListener("click", function () {
        document.querySelector(".tab.selected").classList.remove("selected");
        i.classList.add("selected");
        document.querySelector(".tab-content.show").classList.remove("show");
        document.querySelector(`.tab-content[data-for='${i.dataset.for}']`).classList.add("show");
    })
}
//let w = new Worker("w.js");
function mainMsg(e) {
    if (e.type == "analysis") {
        document.getElementById("analysisContent").innerHTML = "";
        for (let i of e.analysis) {
            let analysisLine = document.createElement("div");
            analysisLine.classList.add("analysis-line")
            let evaluationSpan = document.createElement("span");
            evaluationSpan.innerText = ((i.evaluation >= 0) ? "+" : "") + i.evaluation.toFixed(2);
            evaluationSpan.classList.add(((i.evaluation >= 0) == (playerColor == 1)) ? "black" : "white");
            analysisLine.appendChild(evaluationSpan);
            let text = document.createTextNode(" " + i.coord);
            analysisLine.appendChild(text);
            document.getElementById("analysisContent").appendChild(analysisLine);
            let hr = document.createElement("hr");
            document.getElementById("analysisContent").appendChild(hr);
        }
        document.getElementById("nodesNumber").innerText = e.nodes;
        pd(e.analysis[0].coord);
    }
}
for (let i = 0; i <= 9; i++) {
    for (let j = 0; j <= 9; j++) {
        document.querySelector(".r" + (i + 1) + ".c" + (j + 1)).addEventListener("click", function () {
            if (!setupMode) pd(LETTERS_GRAND[j] + (i + 1));
            else {
                boardGrand[i][j] = setupDisc;
                initialPositionGrand = JSON.parse(JSON.stringify(boardGrand));
                lastCoord = {
                    x: 0,
                    y: 0
                }
                previousMoves = [];
                navigationPosition = [-1, 1]
                render();
            }
        })
    }
}
document.getElementById("setupButton").addEventListener("click", function () {
    setupMode = !setupMode;
    if (setupMode) document.getElementById("setupButton").classList.add("selected");
    else document.getElementById("setupButton").classList.remove("selected");
});
document.getElementById("setupBlack").addEventListener("click", function () {
    setupDisc = 1;
});
document.getElementById("setupWhite").addEventListener("click", function () {
    setupDisc = -1;
});
document.getElementById("setupErase").addEventListener("click", function () {
    setupDisc = 0;
});
document.getElementById("setupClear").addEventListener("click", function () {
    boardGrand = [
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
    initialPositionGrand = JSON.parse(JSON.stringify(boardGrand));
    lastCoord = {
        x: 0,
        y: 0
    }
    previousMoves = [];
    navigationPosition = [-1, 1]
    render();
})
document.getElementById("startGameButton").addEventListener("click", function () {
    if (playerColor == computerColor) {
        workerMsg({
            type: "computerPlay",
            board: boardGrand,
            color: playerColor,
            depth: searchDepth
        })
    }
})
document.getElementById("computerRoleBlack").addEventListener("click", function () {
    computerColor = 1;
});
document.getElementById("computerRoleWhite").addEventListener("click", function () {
    computerColor = -1;
});
document.getElementById("computerRoleNeither").addEventListener("click", function () {
    computerColor = 0;
});
document.getElementById("sideToMoveBlack").addEventListener("click", function () {
    playerColor = 1;
    render();
})
document.getElementById("sideToMoveWhite").addEventListener("click", function () {
    playerColor = -1;
    render();
});
document.getElementById("searchDepth6").addEventListener("click", function () {
    searchDepth = 6;
});
document.getElementById("searchDepth8").addEventListener("click", function () {
    searchDepth = 8;
});
function render() {
    let validMoves = validMovesArr();
    for (let i = 0; i <= 9; i++) {
        for (let j = 0; j <= 9; j++) {
            if (boardGrand[i][j] == 1) {
                document.querySelector(".r" + (i + 1) + ".c" + (j + 1)).classList.add("black");
                document.querySelector(".r" + (i + 1) + ".c" + (j + 1)).classList.remove("white");
                document.querySelector(".r" + (i + 1) + ".c" + (j + 1)).classList.remove("move");
            } else if (boardGrand[i][j] == -1) {
                document.querySelector(".r" + (i + 1) + ".c" + (j + 1)).classList.add("white");
                document.querySelector(".r" + (i + 1) + ".c" + (j + 1)).classList.remove("black");
                document.querySelector(".r" + (i + 1) + ".c" + (j + 1)).classList.remove("move");
            } else if (validMoves.includes(i * 10 + j)) {
                document.querySelector(".r" + (i + 1) + ".c" + (j + 1)).classList.remove("white");
                document.querySelector(".r" + (i + 1) + ".c" + (j + 1)).classList.remove("black");
                document.querySelector(".r" + (i + 1) + ".c" + (j + 1)).classList.add("move");
            } else {
                document.querySelector(".r" + (i + 1) + ".c" + (j + 1)).classList.remove("white");
                document.querySelector(".r" + (i + 1) + ".c" + (j + 1)).classList.remove("black");
                document.querySelector(".r" + (i + 1) + ".c" + (j + 1)).classList.remove("move");
            }
        }
    }
    let discs = discCount(boardGrand);
    document.getElementById("blackScore").innerText = discs.black;
    document.getElementById("whiteScore").innerText = discs.white;
    if (playerColor == 1) {
        document.getElementById("indicatorBlack").classList.add("active");
        document.getElementById("indicatorWhite").classList.remove("active");
    } else {
        document.getElementById("indicatorBlack").classList.remove("active");
        document.getElementById("indicatorWhite").classList.add("active");
    }
    if (document.querySelector(".lastMove")) document.querySelector(".lastMove").classList.remove("lastMove")
    if (lastCoord.x != 0) document.querySelector(".r" + lastCoord.x + ".c" + lastCoord.y).classList.add("lastMove");
    document.getElementById("notation").innerHTML = ""
    for (let i = 0; i < previousMoves.length; i++) {
        let span1 = document.createElement("span");
        span1.innerText = previousMoves[i][0];
        let spanContainer = document.createElement("span");
        spanContainer.appendChild(span1);
        span1.addEventListener("click", function () {
            navigate(i, 0);
        });
        if (previousMoves[i][1]) {
            let span2 = document.createElement("span");
            span2.innerText = previousMoves[i][1];
            spanContainer.appendChild(span2);
            span2.addEventListener("click", function () {
                navigate(i, 1);
            })
        }
        document.getElementById("notation").appendChild(spanContainer);
    }
    if (document.querySelector(".navigationPosition")) document.querySelector(".navigationPosition").classList.remove("navigationPosition");
    if (document.getElementById("notation").children[navigationPosition[0]]) document.getElementById("notation").children[navigationPosition[0]].children[navigationPosition[1]].classList.add("navigationPosition");
    if (playerColor == 1) {
        document.getElementById("sideToMoveBlack").checked = "checked";
        document.getElementById("sideToMoveWhite").checked = "";
    }
    else {
        document.getElementById("sideToMoveWhite").checked = "checked";
        document.getElementById("sideToMoveBlack").checked = "";
    }
}
function navigate(moveNo, side/*0,1*/) {
    boardGrand = JSON.parse(JSON.stringify(initialPositionGrand));
    if (moveNo == -1) {
        lastCoord = {
            x: 0,
            y: 0
        }
    } else {
        for (let i = 0; i < moveNo; i++) {
            if (previousMoves[i][0] && previousMoves[i][0] != "--") boardGrand = placeDisc(boardGrand, Number(previousMoves[i][0][1]) - 1, LETTERS_GRAND.indexOf(previousMoves[i][0][0]), 1).board;
            if (previousMoves[i][1] && previousMoves[i][1] != "--") boardGrand = placeDisc(boardGrand, Number(previousMoves[i][1][1]) - 1, LETTERS_GRAND.indexOf(previousMoves[i][1][0]), -1).board;
        }
        if (previousMoves[moveNo][0] && previousMoves[moveNo][0] != "--") boardGrand = placeDisc(boardGrand, Number(previousMoves[moveNo][0][1]) - 1, LETTERS_GRAND.indexOf(previousMoves[moveNo][0][0]), 1).board;
        if (side == 1 && previousMoves[moveNo][1] && previousMoves[moveNo][1] != "--") boardGrand = placeDisc(boardGrand, Number(previousMoves[moveNo][1][1]) - 1, LETTERS_GRAND.indexOf(previousMoves[moveNo][1][0]), -1).board;
        if (previousMoves[moveNo][side] != "--") {
            lastCoord = {
                x: Number(previousMoves[moveNo][side][1]),
                y: LETTERS_GRAND.indexOf(previousMoves[moveNo][side][0]) + 1
            }
        } else {
            lastCoord = {
                x: 0,
                y: 0
            }
        }
    }
    navigationPosition = [moveNo, side];
    if (side == 1) playerColor = 1;
    else playerColor = -1;
    render();
}
function pd(coord) {
    let y = LETTERS_GRAND.indexOf(coord[0]);
    let x = Number(coord.slice(1,3)) - 1;
    let placeResult = placeDisc(boardGrand, x, y, playerColor);
    if (!placeResult.isValid){
        return;
    }
    lastCoord = {
        x: x + 1,
        y: y + 1
    }
    boardGrand = placeResult.board;
    if (previousMoves.length) {
        if (playerColor == 1) {
            previousMoves.push([coord, ""])
            if (!previousMoves[previousMoves.length - 2][1]) previousMoves[previousMoves.length - 2][1] = "--"
        } else {
            if (!previousMoves[previousMoves.length - 1][1]) previousMoves[previousMoves.length - 1][1] = coord;
            else previousMoves.push(["--", coord]);
        }
    } else {
        if (playerColor == 1) previousMoves = [[coord, ""]]
        else previousMoves = [["--", coord]];
    }
    navigationPosition = [previousMoves.length - 1, ((playerColor == 1) ? 0 : 1)]
    playerColor = -playerColor;
    if (!validMovesArr().length) playerColor = -playerColor;
    let boardStr = "";
    for (let i of boardGrand) {
        for (let j of i) {
            switch (j) {
                case 0:
                    boardStr += "."
                    break;
                case 1:
                    boardStr += "x"
                    break;
                case -1:
                    boardStr += "o"
            }
        }
        boardStr += "\r\n"
    }
    console.log(((arguments[1]) ? "Computer" : "You") + " placed a disc on " + coord);
    console.log("The current board is");
    console.log(boardStr);
    render();
    if (computerColor == playerColor) {
        workerMsg({
            type: "computerPlay",
            board: boardGrand,
            color: playerColor,
            depth: searchDepth
        });
    }
}
function validMovesArr() {
    let situations = []
    for (let m = 0; m <= 9; m++) {
        for (let n = 0; n <= 9; n++) {
            let placeResult = placeDisc(boardGrand, m, n, playerColor);
            if (placeResult.isValid) {
                situations.push(m * 10 + n);
            }
        }
    }
    return situations;
}
function placeDisc(currentBoard, x, y/*0~9 */, color) {
    let tempBoard = JSON.parse(JSON.stringify(currentBoard));
    if (tempBoard[x][y]) return { isValid: false };
    let isValidMove = false;
    for (let i of DIRECTIONS) {
        let dirFlip = directionalFlip(tempBoard, x, y, i, color);
        isValidMove = isValidMove || dirFlip.flip;
        if (dirFlip.flip) tempBoard = dirFlip.board;
    }
    if (isValidMove) {
        tempBoard[x][y] = color;
        return {
            isValid: true,
            board: tempBoard
        }
    }
    return { isValid: false }
}
function directionalFlip(currentBoard, x, y, direction, color) {
    let tempBoard = JSON.parse(JSON.stringify(currentBoard));
    let flipCounter = 0;
    do {
        flipCounter++;
        if (!(x + direction[0] * flipCounter >= 0 && x + direction[0] * flipCounter <= 9 && y + direction[1] * flipCounter >= 0 && y + direction[1] *
            flipCounter <= 9) || !tempBoard[x + direction[0] * flipCounter][y + direction[1] * flipCounter]) return { flip: false };
    } while (tempBoard[x + direction[0] * flipCounter][y + direction[1] * flipCounter] == -color);
    flipCounter--;
    if (!flipCounter) return { flip: false };
    for (let i = 1; i <= flipCounter; i++) {
        tempBoard[x + direction[0] * i][y + direction[1] * i] = color;
    }
    return {
        flip: true,
        board: tempBoard
    };
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
render();
document.getElementById("toStartPosition").addEventListener("click", function () {
    navigate(-1, 1);
})
document.getElementById("previousMove").addEventListener("click", function () {
    if (navigationPosition[1] == 1 && navigationPosition[0] >= 0) navigate(navigationPosition[0], 0)
    else if (navigationPosition[1] == 0) navigate(navigationPosition[0] - 1, 1);
})
document.getElementById("nextMove").addEventListener("click", function () {
    if (navigationPosition[1] == 0) {
        if (previousMoves[navigationPosition[0]][1] != "") navigate(navigationPosition[0], 1);
    }
    else if (previousMoves[navigationPosition[0] + 1]) navigate(navigationPosition[0] + 1, 0);
})
document.getElementById("lastMove").addEventListener("click", function () {
    navigate(previousMoves.length - 1, ((previousMoves[previousMoves.length - 1]) ? 1 : 0));
});
document.addEventListener("keydown", function (e) {
    switch (e.key) {
        case "ArrowLeft":
            document.getElementById("previousMove").click();
            break;
        case "ArrowRight":
            document.getElementById("nextMove").click();
            break;
        case "ArrowUp":
            document.getElementById("toStartPosition").click();
            break;
        case "ArrowDown":
            document.getElementById("lastMove").click();
    }
})
document.getElementById("deleteMoveButton").addEventListener("click", function () {
    if (navigationPosition[0] < 0) return;
    if (navigationPosition[1] == 0) {
        previousMoves = previousMoves.slice(0, navigationPosition[0]);
        navigate(navigationPosition[0] - 1, 1);
    } else {
        previousMoves = previousMoves.slice(0, navigationPosition[0] + 1);
        previousMoves[previousMoves.length - 1][1] = "";
        navigate(navigationPosition[0], 0);
    }
})