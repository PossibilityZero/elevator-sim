const FLOORS = 7;
const ELEVATORS = 5;

class Elevator {
    constructor(floor, capacity) {
        this.floor = floor;
        this.height = floor;
        this.capacity = capacity;
        this.riders = [];
        this.destination = null;
    }

    get riderCount() {
        return this.riders.length;
    }

    removeRidersForDestination() {
        // remove all riders with destination floor
        if (!this.destination) {
            let exiters = this.riders.filter(rider => rider.destination === this.floor);
            this.riders = this.riders.filter(rider => rider.destination !== this.floor);
            return exiters;
        }
    }
    
    addRider(rider) {
        // return true and add to riders if capacity allows
        if (this.riders.length < this.capacity) {
            this.riders.push(rider);
            return true;
        } else {
            return false;
        }
    }

    chooseDestination() {
        if (this.riderCount === 0) {
            this.destination = null;
        } else {
            this.destination = this.riders[0].destination;
        }
    }

    update() {
        if (!this.destination) {
            this.floor = this.height;
            this.removeRidersForDestination();
        }
        
        this.chooseDestination();
    }
}

class ElevatorShaft {
    constructor(id, floors) {
        const startFloor = 1;
        const capacity = 12;
        this.elevator = new Elevator(startFloor, capacity);
        this.floors = floors;
        this.id = id;
    }

    update() {
        // update one tick
        let destination = this.elevator.destination;
        let height = this.elevator.height;
        let maxSpeed = 0.05;
        if (destination) {
            if (height > destination) {
                let diff = Math.max(maxSpeed * -1, destination - height);
                this.elevator.height += diff;
            } else if (height < destination) {
                let diff = Math.min(maxSpeed, destination - height);
                this.elevator.height += diff;
            } else {
                this.elevator.destination = null;
            }
        }
        this.elevator.update();
    }
}

class Rider {
    constructor(start, destination) {
        this.start = start;
        this.destination = destination;
    }
}

class Simulation {
    constructor(shafts) {
        this.shafts = []
        for (let i = 0; i < shafts; i++) {
            this.addShaft();
        }
        this.graphicsContainer = document.querySelector(".simulation-graphics-container");
    }

    addShaft() {
        // add shaft and assign unique ID
        this.shafts.push(new ElevatorShaft(this.shafts.length, FLOORS));
    }

    clearGraphics() {
        while (this.graphicsContainer.firstChild) {
            this.graphicsContainer.removeChild(this.graphicsContainer.firstChild);
        }
    }

    drawRiders(elevator, elevatorElement) {
        for (let i = 0; i < elevator.riderCount; i++) {
            let rider = document.createElement("div");
            rider.classList.add("rider");
            elevatorElement.append(rider);
        }
    }

    drawElevator(shaft, shaftElement) {
        const elevator = document.createElement("div");
        elevator.classList.add("elevator");
        shaftElement.append(elevator);
        elevator.style.bottom = ((shaft.elevator.height - 1) * 50) + "px";

        this.drawRiders(shaft.elevator, elevator);
    }

    drawElevatorShaft(shaft) {
        const newShaft = document.createElement("div");
        newShaft.classList.add("elevator-shaft");
        this.graphicsContainer.appendChild(newShaft);
        newShaft.style.height = shaft.floors * 50 + "px";
        newShaft.style.width = "40px";

        for (let i = 0; i < shaft.floors; i++) {
            let floor = document.createElement("div");
            floor.textContent = i + 1;
            floor.classList.add("floor");
            floor.dataset.floor = i + 1;
            floor.style.bottom = (i * 50) + "px";
            if (i % 2 === 0) {
                floor.style.backgroundColor = "#fff3";
            } else {
                floor.style.backgroundColor = "#fff1";
            }
            newShaft.append(floor);
        }

        this.drawElevator(shaft, newShaft);
    }

    drawGraphics() {
        this.clearGraphics();
        this.shafts.forEach(e => this.drawElevatorShaft(e));
    }

    simulateTick() {
        this.drawGraphics();
        this.shafts.forEach(e => e.update());
    }

    run() {
        this.sim = setInterval(this.simulateTick.bind(this), 40);
    }

    pause() {
        clearInterval(this.sim);
    }
}

function pickFloor(min, max) {
    // inclusive random picker
    const floor = min + Math.floor((1 + max - min) * Math.random());
    return floor;
}

function createNewRider() {
    let minFloor = 1;
    let maxFloor = FLOORS;
    let start = pickFloor(minFloor, maxFloor);
    let destination = pickFloor(minFloor, maxFloor);
    return new Rider(start, destination);
}


const simulation = new Simulation(ELEVATORS);

document.querySelector("#create-rider-button").addEventListener("click", function() {
    for (let i = 0; i < simulation.shafts.length; i++) {
        let rider = createNewRider();
        let elevator = simulation.shafts[i].elevator;
        elevator.addRider(rider);
        console.log(elevator.riders);
    }
});

document.querySelector("#pause-sim-button").addEventListener("click", function() {
    if (this.textContent === "Pause") {
        simulation.pause();
        this.textContent = "Start";
    } else {
        simulation.run();
        this.textContent = "Pause";
    }
});

simulation.run();
