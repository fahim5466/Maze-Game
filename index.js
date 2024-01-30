const {World, Engine, Runner, Render, Bodies, Body, Events} = Matter;

const cells = 3;
const width = 600;
const height = 600;
const unitLength = width / cells;
const unitThickness = 5;
const unitVelocity = 5;

const engine = Engine.create();
// Disable gravity.
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: true,
        width,
        height
    }
});
Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// Walls.
const walls = [
    Bodies.rectangle(width / 2, 0, width, 2, {isStatic: true}),
    Bodies.rectangle(width / 2, height, width, 2, {isStatic: true}),
    Bodies.rectangle(0, height / 2, 2, height, {isStatic: true}),
    Bodies.rectangle(width, height / 2, 2, height, {isStatic: true})
];
World.add(world, walls);

// Maze.
const grid = Array(cells).fill(null).map(() => Array(cells).fill(false));
const verticals = Array(cells).fill(null).map(() => Array(cells-1).fill(false));
const horizontals = Array(cells-1).fill(null).map(() => Array(cells).fill(false));

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
        if(nextRow < 0 || nextRow >= cells || nextColumn < 0 || nextColumn >= cells){
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

const startRow = Math.floor(Math.random() * cells);
const startColumn = Math.floor(Math.random() * cells);
generateMaze(startRow, startColumn);

// Add horizontal walls.
horizontals.forEach((row, rowIndex) => {
    row.forEach((isOpen, columnIndex) => {
        if(isOpen){
            return;
        }
        const horizontalWall = Bodies.rectangle(
            (columnIndex * unitLength) + (unitLength / 2),
            (rowIndex * unitLength) + unitLength,
            unitLength,
            unitThickness,
            {
                label: 'wall',
                isStatic: true
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
            (columnIndex * unitLength) + unitLength,
            (rowIndex * unitLength) + (unitLength / 2),
            unitThickness,
            unitLength,
            {
                label: 'wall',
                isStatic: true
            }
        );
        World.add(world, verticalWall);
    });
});

// Add goal.
const goal = Bodies.rectangle(
    width - (unitLength / 2),
    height - (unitLength / 2),
    unitLength * 0.7,
    unitLength * 0.7,
    {
        label: 'goal',
        isStatic: true
    }
);
World.add(world, goal);

// Add ball.
const ball = Bodies.circle(
    unitLength / 2,
    unitLength / 2,
    unitLength * 0.25,
    {
        label: 'ball'
    }
);
World.add(world, ball);

// Add ball movement.
document.addEventListener('keydown', e => {
    const {x, y} = ball.velocity;

    if(e.keyCode === 87){
        // Move up.
        Body.setVelocity(ball, {x, y: y - unitVelocity});
    }
    else if(e.keyCode === 68){
        // Move right.
        Body.setVelocity(ball, {x: x + unitVelocity, y});
    }
    else if(e.keyCode === 83){
        // Move down.
        Body.setVelocity(ball, {x, y: y + unitVelocity});
    }
    else if(e.keyCode === 65){
        // Move left.
        Body.setVelocity(ball, {x: x - unitVelocity, y});
    }
});

// Add win condition.
Events.on(engine, 'collisionStart', e => {
    e.pairs.forEach(collision => {
        if((collision.bodyA.label === 'goal' && collision.bodyB.label === 'ball') ||
           (collision.bodyA.label === 'ball' && collision.bodyB.label === 'goal')){
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