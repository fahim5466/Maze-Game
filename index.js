const {World, Engine, Runner, Render, Bodies} = Matter;

const cells = 3;
const width = 600;
const height = 600;

const engine = Engine.create();
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

// Walls.
const walls = [
    Bodies.rectangle(width / 2, 0, width, 40, {isStatic: true}),
    Bodies.rectangle(width / 2, height, width, 40, {isStatic: true}),
    Bodies.rectangle(0, height / 2, 40, height, {isStatic: true}),
    Bodies.rectangle(width, height / 2, 40, height, {isStatic: true})
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