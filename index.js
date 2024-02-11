const {World, Engine, Runner, Render, Bodies, Body, Events} = Matter;

const xCells = 15;
const yCells = 10;
const width = window.innerWidth * 0.995;
const height = window.innerHeight * 0.995;
const unitLengthX = width / xCells;
const unitLengthY = height / yCells;
const unitThickness = 2;
const unitVelocity = 3;

const engine = Engine.create();
// Disable gravity.
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width,
        height
    }
});
Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// Border alls.
const walls = [
    Bodies.rectangle(width / 2, 0, width, 2, {isStatic: true}),
    Bodies.rectangle(width / 2, height, width, 2, {isStatic: true}),
    Bodies.rectangle(0, height / 2, 2, height, {isStatic: true}),
    Bodies.rectangle(width, height / 2, 2, height, {isStatic: true})
];
World.add(world, walls);

// Maze.
const grid = Array(yCells).fill(null).map(() => Array(xCells).fill(false));
const verticals = Array(yCells).fill(null).map(() => Array(xCells-1).fill(false));
const horizontals = Array(yCells-1).fill(null).map(() => Array(xCells).fill(false));

const shuffle = (arr) => {
    let curr = arr.length;
    while(curr > 0){
        let rand = Math.floor(Math.random() * curr);
        curr--;
        let temp = arr[curr];
        arr[curr] = arr[rand];
        arr[rand] = temp;
    }
    return arr;
}

const generateMaze = (row, column) => {
    // If cell has been visited before, return.
    if(grid[row][column]){
        return;
    }

    // Mark cell as visited.
    grid[row][column] = true;

    // Create neighbor list in random order.
    let neighbors = shuffle([
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left']
    ]);

    // Loop through neighbors.
    for(let neighbor of neighbors){
        const [nextRow, nextColumn, direction] = neighbor;

        // If neighbor is out of bounds, continue.
        if(nextRow < 0 || nextRow >= yCells || nextColumn < 0 || nextColumn >= xCells){
            continue;
        }

        // If neighbor has been visited, continue.
        if(grid[nextRow][nextColumn]){
            continue;
        }

        // Remove the wall between current cell and neighbor.
        if (direction === 'left') {
            verticals[row][column - 1] = true;
        } else if (direction === 'right') {
            verticals[row][column] = true;
        } else if (direction === 'up') {
            horizontals[row - 1][column] = true;
        } else if (direction === 'down') {
            horizontals[row][column] = true;
        }

        // Visit neighbor.
        generateMaze(nextRow, nextColumn);
    }
};

const startRow = Math.floor(Math.random() * yCells);
const startColumn = Math.floor(Math.random() * xCells);
generateMaze(startRow, startColumn);

// Add horizontal walls.
horizontals.forEach((row, rowIndex) => {
    row.forEach((isOpen, columnIndex) => {
        if(isOpen){
            return;
        }
        const horizontalWall = Bodies.rectangle(
            (columnIndex * unitLengthX) + (unitLengthX / 2),
            (rowIndex * unitLengthY) + unitLengthY,
            unitLengthX,
            unitThickness,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'white'
                }
            }
        );
        World.add(world, horizontalWall);
    });
});

// Add vertical walls.
verticals.forEach((row, rowIndex) => {
    row.forEach((isOpen, columnIndex) => {
        if(isOpen){
            return;
        }
        const verticalWall = Bodies.rectangle(
            (columnIndex * unitLengthX) + unitLengthX,
            (rowIndex * unitLengthY) + (unitLengthY / 2),
            unitThickness,
            unitLengthY,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'white'
                }
            }
        );
        World.add(world, verticalWall);
    });
});

// Add goal.
const goal = Bodies.rectangle(
    width - (unitLengthX / 2),
    height - (unitLengthY / 2),
    unitLengthX * 0.7,
    unitLengthY * 0.7,
    {
        label: 'goal',
        isStatic: true,
        render: {
            fillStyle: '#A1EEBD'
        }
    }
);
World.add(world, goal);

// Add ball.
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    ballRadius,
    {
        label: 'ball',
        render: {
            fillStyle: '#7BD3EA'
        }
    }
);
World.add(world, ball);

// Add ball movement.
document.addEventListener('keydown', e => {
    const xMax = 30.0;
    const yMax = 30.0;
    const {x, y} = ball.velocity;
    console.log(x, y);

    if(e.keyCode === 87){
        // Move up.
        let newY = Math.max(y - unitVelocity, -yMax);
        Body.setVelocity(ball, {x, y: newY});
    }
    else if(e.keyCode === 68){
        // Move right.
        let newX = Math.min(x + unitVelocity, xMax);
        Body.setVelocity(ball, {x: newX, y});
    }
    else if(e.keyCode === 83){
        // Move down.
        let newY = Math.min(y + unitVelocity, yMax);
        Body.setVelocity(ball, {x, y: newY});
    }
    else if(e.keyCode === 65){
        // Move left.
        let newX = Math.max(x - unitVelocity, -xMax);
        Body.setVelocity(ball, {x: newX, y});
    }
});

// Add win condition.
Events.on(engine, 'collisionStart', e => {
    e.pairs.forEach(collision => {
        if((collision.bodyA.label === 'goal' && collision.bodyB.label === 'ball') ||
           (collision.bodyA.label === 'ball' && collision.bodyB.label === 'goal')){
            // Display win text.
            document.querySelector(".winner").classList.remove("hidden");
            // Turn gravity on.
            world.gravity.y = 1;
            world.bodies.forEach(body => {
                // Let the maze walls fall down.
                if(body.label === 'wall'){
                    Body.setStatic(body, false);
                }
            });
        }
    });
});