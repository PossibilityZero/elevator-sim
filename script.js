const FLOORS = 7;
const ELEVATORS = 1;
const direction = {
    UP: "up",
    DOWN: "down",
    NONE: "none"
}
const doorState = {
    CLOSED: "closed",
    OPENING: "opening",
    OPEN: "open",
    CLOSING: "closing"
}

const CAPACITY = 12;

class Elevator {
    constructor(floors, capacity) {
        this.floor = 1;
        this.floors = floors
        this.height = 1;
        this.capacity = capacity;
        this.riders = [];
        this.destination = null;
        this.shaft = new ElevatorShaft(this);
        this.doors = new ElevatorDoor(this);
    }

    get riderCount() {
        return this.riders.length;
    }

    get hasCapacity() {
        return this.capacity > this.riderCount;
    }

    get canMove() {
        return this.doors.areClosed && this.destination !== null;
    }

    get findRidersForThisFloor() {
        // find all riders with destination floor
        let riders = this.riders.filter(rider => rider.destination === this.floor);
        return riders.length > 0;
    }

    removeRidersForDestination() {
        // remove all riders with destination floor
        if (this.doors.areOpen) {
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
        if (this.shaft.velocity === 0) {
            this.floor = this.height;
            if (this.findRidersForThisFloor) {
                this.doors.open();
            } else if (this.riders.length > 0) {
                this.doors.close();
            }
            this.removeRidersForDestination();
            this.chooseDestination();
        }
        
        this.shaft.update();
        this.doors.update();
    }
}

class ElevatorShaft {
    // Handle Elevator movement
    constructor(elevator) {
        this.elevator = elevator
        this.velocity = 0;
    }

    update() {
        // update one tick
        let destination = this.elevator.destination;
        let height = this.elevator.height;
        let maxSpeed = 0.05;
        if (this.elevator.canMove) {
            if (height > destination) {
                let diff = Math.max(maxSpeed * -1, destination - height);
                this.velocity = diff;
            } else if (height < destination) {
                let diff = Math.min(maxSpeed, destination - height);
                this.velocity = diff;
            } else {
                this.velocity = 0;
                this.elevator.destination = null;
            }
        }
        this.elevator.height += this.velocity;
    }
}

class ElevatorDoor {
    // Handle Elevator stopping
    constructor(elevator) {
        this.elevator = elevator;
        this.state = doorState.OPEN;
        // ticks required to open or close;
        this.delay = 12;
        this.remainingTicks = 0;
    }

    get areClosed() {
        return this.state === doorState.CLOSED;
    }

    get areOpen() {
        return this.state === doorState.OPEN;
    }

    open() {
        if (this.state != doorState.OPEN && this.state != doorState.OPENING) {
            this.state = doorState.OPENING;
            this.remainingTicks = this.delay;
        }
    }

    close() {
        if (this.state != doorState.CLOSED && this.state != doorState.CLOSING) {
            this.state = doorState.CLOSING;
            this.remainingTicks = this.delay;
        }
    }

    update() {
        if (this.state === doorState.OPENING || this.state === doorState.CLOSING) {
            this.remainingTicks--;
            if (this.remainingTicks <= 0) {
                // If it was opening, change to OPEN. Otherwise change to CLOSED
                this.state = this.state === doorState.OPENING ? doorState.OPEN : doorState.CLOSED;
            }
        }
    }
}

class Rider {
    constructor(start, destination) {
        this.start = start;
        this.destination = destination;
    }
    
    get direction() {
        if (start < destination) {
            return directions.UP;
        } else if (start > destination) {
            return directions.DOWN;
        } else {
            return directions.NONE;
        }
    }
}

class Simulation {
    constructor(shafts) {
        this.elevators = []
        this.waitingRiders = [];
        for (let i = 0; i < shafts; i++) {
            this.addElevator();
        }
        this.graphicsContainer = document.querySelector(".simulation-graphics-container");
    }

    addElevator() {
        this.elevators.push(new Elevator(FLOORS, CAPACITY));
    }

    getElevatorsAtFloor(floor) {
        // return array of elevators at a floor
        let elevatorsAtFloor =  this.elevators.filter(function(elevator) {
            return elevator.height === floor && !elevator.destination
        });
        return elevatorsAtFloor;
    }

    createRider() {
        this.waitingRiders.push(createNewRider());
    }

    directElevators() {
        this.elevators.forEach(function(elevator) {
        });
    }

    updateRiders() {
        for (let i = this.waitingRiders.length - 1; i >= 0; i--) {
            let rider = this.waitingRiders[i];
            let startFloor = rider.start;
            let availableElevator = this.getElevatorsAtFloor(startFloor)
                    .find(elevator => elevator.hasCapacity);
            if (availableElevator) {
                availableElevator.addRider(rider);
                this.waitingRiders.splice(i, 1);
            }
        }
    }

    updateController() {
        this.directElevators();
        this.updateRiders();
    }

    // Graphics
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

    drawElevator(elevator, shaftElement) {
        const elevatorElement = document.createElement("div");
        elevatorElement.classList.add("elevator");
        shaftElement.append(elevatorElement);
        elevatorElement.style.bottom = ((elevator.height - 1) * 50) + "px";

        this.drawRiders(elevator, elevatorElement);
    }

    drawElevatorShaft(elevator) {
        const newShaft = document.createElement("div");
        newShaft.classList.add("elevator-shaft");
        this.graphicsContainer.appendChild(newShaft);
        newShaft.style.height = elevator.floors * 50 + "px";
        newShaft.style.width = "40px";

        for (let i = 0; i < elevator.floors; i++) {
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

        this.drawElevator(elevator, newShaft);
    }

    drawGraphics() {
        this.clearGraphics();
        this.elevators.forEach(elevator => this.drawElevatorShaft(elevator));
    }

    simulateTick() {
        this.drawGraphics();
        this.elevators.forEach(elevator => elevator.update());
        this.updateController();
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
    return new Rider(1, destination);
}


const simulation = new Simulation(ELEVATORS);

document.querySelector("#create-rider-button").addEventListener("click", function() {
    simulation.createRider();
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
