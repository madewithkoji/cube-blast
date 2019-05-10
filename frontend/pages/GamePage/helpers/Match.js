import Util from './Util.js';

function find(newBoard, marked, target) {
    const type = newBoard[target.x][target.y].type;
    if(marked.length === 4) marked.push({ x: target.x, y: target.y, rowPower: true });
    else if(marked.length === 7) marked.push({ x: target.x, y: target.y, typePower: true });
    else marked.push(target);

    if (target.x < newBoard.length - 1
        && findCheck(newBoard, marked, { x: target.x + 1, y: target.y }, type)) marked.concat(find(newBoard, marked, { x: target.x + 1, y: target.y }));
    if (target.x > 0
        && findCheck(newBoard, marked, { x: target.x - 1, y: target.y }, type)) marked.concat(find(newBoard, marked, { x: target.x - 1, y: target.y }));
    if (target.y < newBoard[0].length - 1 
        && findCheck(newBoard, marked, { x: target.x, y: target.y + 1 }, type)) marked.concat(find(newBoard, marked, { x: target.x, y: target.y + 1 }));
    if (target.y > 0
        && findCheck(newBoard, marked, { x: target.x, y: target.y - 1 }, type)) marked.concat(find(newBoard, marked, { x: target.x, y: target.y - 1 }));

    return marked;
}

function findCheck(newBoard, marked, target, type) {
    if(newBoard[target.x][target.y].type === type && !marked.some((e) => e.x === target.x && e.y === target.y)) return true;
    return false;
}

function addMarked(x, y, length, direction) {
    let marked = [];

    for(let k = 0; k < length; k++) {
        // add a new thing to marked
        marked.push({x, y});

        if(length === 4 && k === 1) {
            marked[marked.length - 1].rowPower = true;
        } else if(length === 5 && k === 2) {
            marked[marked.length - 1].typePower = true;
        }

        if(direction === 'x') x ++;
        else y ++;
    }

    return marked;
}

function pruneMarked(marked) {
    // some quick set theory for your afternoon
    return marked.filter((a, i, self) => self.findIndex(b => a.x === b.x && a.y === b.y) === i);
}

function findPowerups(newBoard, marked) {
    let newMarked = [];
    marked.forEach((p) => {
        if (newBoard[p.x][p.y].rowPower) {
            newMarked = newMarked.concat(addRow(newBoard, p.y));
        } else if(newBoard[p.x][p.y].typePower) {
            newMarked = newMarked.concat(addType(newBoard, newBoard[p.x][p.y].type));
        }
    });

    return pruneMarked(marked.concat(newMarked));
}

function addRow(newBoard, row) {
    let marked = [];
    for(let x = 0; x < newBoard.length; x++) {
        marked.push({ x, y: row });
    }
    return marked;
}

function addType(newBoard, type) {
    let marked = [];
    for(let x = 0; x < newBoard.length; x++) {
        for(let y = 0; y < newBoard[0].length; y++) {
            if (newBoard[x][y].type === type) {
                marked.push({ x, y });
            }
        }
    }
    return marked;
}

function addPieces(newBoard, marked) {
    let numTypes = Util.getNumTypes();
    marked.forEach((mark) => {
        if(!mark.rowPower && !mark.typePower) {
            newBoard[mark.x].push(Util.newElement(numTypes));
        }
    })
    return newBoard;
}

function mark(newBoard, marked, width, height) {
    marked.forEach((mark) => {
        let { x, y } = mark;

        if (mark.rowPower) {
            newBoard[x][y].rowPower = true;
            newBoard[x][y].deleted = false;
        } else if (mark.typePower) {
            newBoard[x][y].typePower = true;
            newBoard[x][y].deleted = false;
        } else {
            // dont delete the same block twice
            if(newBoard[x][y].deleted !== true) {
                newBoard[x][y].deleted = true;
                while(--y >= 0) {
                    newBoard[x][y].deltaY ++;
                }
            }
        }
    });

    for(let i=0;i<width;i++) {
        if (newBoard[i].length > height) {
            // there are shadow elements, deal with them
            for (let j=height;j<newBoard[i].length;j++) {
                newBoard[i][j].deltaY += newBoard[i].length - height;
            }
        }
    }

    return newBoard;
}

function sweep(newBoard, width, height) {
    for(let i = 0; i < width; i++) {
        for(let j = 0; j < height; j++) {
            newBoard[i][j].deltaY = 0;
            if(newBoard[i][j].deleted) {
                newBoard[i].splice(j, 1);
                newBoard[i].unshift(newBoard[i].splice(height - 1, 1)[0]);
                newBoard[i][0].deltaY = 0;
            }
        }
    }
    return newBoard;
}

export default {
    find,
    findPowerups,
    mark,
    addPieces,
    sweep,
}
