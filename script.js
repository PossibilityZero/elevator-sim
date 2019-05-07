const FLOORS = 10;
const ELEVATORS = 2;
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

const DEFAULT_ALGORITHM = "First In Line";
const CAPACITY = 12;

class Elevator {
    constructor(floors, capacity) {
        this.floors = floors
        this.height = 1;
        this.capacity = capacity;
        this.riders = [];
        this.destination = null;
        this.shaft = new ElevatorShaft(this);
        this.doors = new ElevatorDoor(this);
        this.remainingDelayTicks = 0;
        this.direction = direction.NONE;
    }

    get delaying() {
        return this.remainingDelayTicks > 0;
    }

    get riderCount() {
        return this.riders.length;
    }

    get hasCapacity() {
        return this.capacity > this.riderCount;
    }

    get canMove() {
        return this.doors.areClosed;
    }

    get floor() {
        return this.isStoppedAtFloor ? this.height : null;
    }

    get isStoppedAtFloor() {
        return this.shaft.velocity === 0;
    }

    get canEnter() {
        // Check that the elevator is stopped, doors are open, and not delaying
        return this.isStoppedAtFloor && this.doors.areOpen && !this.delaying;
    }

    get findRidersForThisFloor() {
        // find all riders with destination floor
        let riders = this.riders.filter(rider => rider.destination === this.floor);
        return riders.length > 0;
    }

    addDelay(ticks) {
        this.remainingDelayTicks += ticks;
    }

    removeRidersForDestination() {
        // remove first rider with current floor as destination
        if (this.canEnter && this.findRidersForThisFloor) {
            let exiter = this.riders.find(rider => rider.destination === this.floor);
            this.riders.splice(this.riders.indexOf(exiter), 1);
            this.addDelay(exiter.actionDelay);
        }
    }
    
    addRider(rider) {
        // return true and add to riders if capacity allows
        if (this.findRidersForThisFloor) {
            // have all riders exit before new riders enter
            return false;
        }
        if (this.riders.length < this.capacity && !this.delaying) {
            this.riders.push(rider);
            this.addDelay(rider.actionDelay);
            return true;
        } else {
            return false;
        }
    }

    setDestination(floor) {
        if (!floor && this.isStoppedAtFloor) {
            // only set destination to null if stopped at a floor
            this.destination = null;
        } else if (Number.isInteger(floor)) {
            this.destination = floor;
        }
    }

    update() {
        if (this.delaying) {
            this.remainingDelayTicks--;
        } else {
            if (this.isStoppedAtFloor) {
                if (this.findRidersForThisFloor) {
                    this.doors.open();
                    this.removeRidersForDestination();
                } else {
                    this.doors.close();
                }
            }
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
        if (this.elevator.canMove && destination) {
            if (height > destination) {
                let diff = Math.max(maxSpeed * -1, destination - height);
                this.velocity = diff;
            } else if (height < destination) {
                let diff = Math.min(maxSpeed, destination - height);
                this.velocity = diff;
            } else {
                this.velocity = 0;
            }
        } else {
            this.velocity = 0;
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
        this.remainingDelayTicks = 0;
    }

    get doorsClosedPercentage() {
        let fraction;
        switch (this.state) {
            case doorState.OPEN:
                fraction = 0;
                break
            case doorState.CLOSED:
                fraction = 1;
                break
            case doorState.OPENING:
                fraction = this.remainingDelayTicks / this.delay;
                break
            case doorState.CLOSING:
                fraction = 1 - (this.remainingDelayTicks / this.delay);
                break
        }
        const percentage = fraction * 100 + "%";
        return percentage
    }

    get areClosed() {
        return this.state === doorState.CLOSED;
    }

    get areOpen() {
        return this.state === doorState.OPEN;
    }

    open() {
        if (this.state === doorState.CLOSED) {
            this.state = doorState.OPENING;
            this.remainingDelayTicks = this.delay;
        }
    }

    close() {
        if (this.state === doorState.OPEN) {
            this.state = doorState.CLOSING;
            this.remainingDelayTicks = this.delay;
        }
    }

    update() {
        if (this.state === doorState.OPENING || this.state === doorState.CLOSING) {
            this.remainingDelayTicks--;
            if (this.remainingDelayTicks <= 0) {
                // If it was opening, change to OPEN. Otherwise change to CLOSED
                this.state = this.state === doorState.OPENING ? doorState.OPEN : doorState.CLOSED;
            }
        }
    }
}

class Rider {
    constructor(start, destination, actionDelay=2) {
        this.start = start;
        this.destination = destination;
        // ticks to act
        this.actionDelay = actionDelay;
        // choose random color to distinguish riders
        let colors = ["#111", "#944", "#294", "#331", "#505", "#007", "#280"];
        this.color = colors[Math.floor(Math.random() * colors.length)];
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

class Building {
    // Group of elevators which share the same pool of riders
    constructor(id, elevators, floors) {
        this.elevators = [];
        this.waitingRiders = [];
        this.floors = floors;
        this.controlAlgorithm = DEFAULT_ALGORITHM;
        for (let i = 0; i < elevators; i++) {
            this.addElevator();
        }
    }

    getElevatorsAtFloor(floor) {
        // return array of elevators at a floor
        let elevatorsAtFloor =  this.elevators
                .filter(elevator => elevator.isStoppedAtFloor && elevator.floor === floor);
        return elevatorsAtFloor;
    }

    getRidersAtFloor(floor) {
        let ridersAtFloor = this.waitingRiders
                .filter(rider => rider.start === floor);
        return ridersAtFloor;
    }

    addElevator() {
        this.elevators.push(new Elevator(this.floors, CAPACITY));
    }

    updateRiders() {
        for (let i = this.waitingRiders.length - 1; i >= 0; i--) {
            let rider = this.waitingRiders[i];
            let startFloor = rider.start;
            let availableElevator = this.getElevatorsAtFloor(startFloor)
                    .find(elevator => elevator.canEnter);
            if (availableElevator) {
                if (availableElevator.addRider(rider)) {
                    this.waitingRiders.splice(i, 1);
                }
            }
        }
    }

    directElevators() {
        // Decide which elevators go where
        ElevatorControlAlgorithms[this.controlAlgorithm](this);
    }

    updateController() {
        this.directElevators();
        this.updateRiders();
    }

    createRider() {
        let minFloor = 1;
        let maxFloor = FLOORS;
        let start = pickFloor(minFloor, maxFloor);
        let destination = pickFloor(minFloor, maxFloor);
        while (destination === start) {
            // re-pick if destination is the same floor
            destination = pickFloor(minFloor, maxFloor);
        }
        this.waitingRiders.push(new Rider(start, destination));
    }

    update() {
        this.elevators.forEach(elevator => elevator.update());
        this.updateController();
    }
}

class Simulation {
    constructor() {
        this.graphicsContainer = document.querySelector(".simulation-graphics-container");
        this.debugContainer = document.querySelector(".debug-info-container");

        this.sim = null;
        this.reset();
    }

    reset() {
        this.buildings = [new Building(1, ELEVATORS, FLOORS)];
        this.ticksElapsed = 0;
        this.clearGraphics();

        clearInterval(this.sim);
    }

    // Graphics
    clearGraphics() {
        while (this.graphicsContainer.firstChild) {
            this.graphicsContainer.removeChild(this.graphicsContainer.firstChild);
        }
    }

    drawRidersInElevator(elevator, elevatorElement) {
        for (let i = 0; i < elevator.riderCount; i++) {
            let rider = document.createElement("div");
            rider.classList.add("rider");
            elevatorElement.append(rider);
            rider.style.backgroundColor = elevator.riders[i].color;
        }
    }

    drawWaitingRiders(building, floorElement) {
        let floor = floorElement.dataset.floor;
        building.waitingRiders
                .filter(rider => rider.start == floor)
                .forEach(function(rider) {
                    let riderElement = document.createElement("div");
                    riderElement.classList.add("rider");
                    floorElement.append(riderElement);
                    riderElement.style.backgroundColor = rider.color;
                });
    }

    drawDoor(elevator, elevatorElement) {
        const doorElement = document.createElement("div");
        doorElement.classList.add("elevator-door");
        elevatorElement.append(doorElement);
        doorElement.style.width = elevator.doors.doorsClosedPercentage;
    }

    drawElevator(elevator, shaftElement) {
        const elevatorElement = document.createElement("div");
        elevatorElement.classList.add("elevator");
        shaftElement.append(elevatorElement);
        elevatorElement.style.bottom = ((elevator.height - 1) * 50) + "px";

        this.drawDoor(elevator, elevatorElement);
        this.drawRidersInElevator(elevator, elevatorElement);
    }

    drawElevatorShaft(elevator, buildingElement) {
        const newShaft = document.createElement("div");
        newShaft.classList.add("elevator-shaft");
        buildingElement.appendChild(newShaft);
        newShaft.style.height = elevator.floors * 50 + "px";
        newShaft.style.width = "40px";

        for (let i = 0; i < elevator.floors; i++) {
            let floor = document.createElement("div");
            floor.textContent = i + 1;
            floor.classList.add("elevator-floor");
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

    drawFloors(building, buildingElement) {
        let floorsContainer = document.createElement("div");
        floorsContainer.classList.add("building-floors-container");
        buildingElement.appendChild(floorsContainer);

        for (let i = 0; i < building.floors; i++) {
            let floor = document.createElement("div");
            floor.classList.add("building-floor");
            floor.dataset.floor = i + 1;
            floor.style.bottom = (i * 50) + "px";
            if (i % 2 === 0) {
                floor.style.backgroundColor = "#fff3";
            } else {
                floor.style.backgroundColor = "#fff1";
            }
            this.drawWaitingRiders(building, floor);
            floorsContainer.append(floor);
        }
    }

    drawBuilding(building) {
        const newBuilding = document.createElement("div");
        newBuilding.classList.add("building");
        this.graphicsContainer.appendChild(newBuilding);
        building.elevators.forEach(elevator => this.drawElevatorShaft(elevator, newBuilding));
        this.drawFloors(building, newBuilding);
    }

    drawGraphics() {
        this.clearGraphics();
        this.buildings.forEach(building => this.drawBuilding(building));
    }

    addDebugInfo(name, value) {
        this.debugContainer.textContent += `${name}: ${value} `;
    }

    updateDebugInfo() {
        this.debugContainer.textContent = "";
        this.addDebugInfo("Ticks Elapsed", this.ticksElapsed);
    }

    simulateTick() {
        this.buildings.forEach(building => building.update());

        this.drawGraphics();
        this.updateDebugInfo();

        this.ticksElapsed++;
    }

    run() {
        this.sim = setInterval(this.simulateTick.bind(this), 40);
    }

    pause() {
        clearInterval(this.sim);
    }
}

const ElevatorControlAlgorithms =  {
    "First In Line" : function(building) {
        building.elevators.forEach(function(elevator) {
            if (elevator.isStoppedAtFloor
                    && elevator.hasCapacity
                    && building.getRidersAtFloor(elevator.floor).length > 0) {
                elevator.doors.open();
            } else if (elevator.riderCount === 0) {
                if (building.waitingRiders.length > 0) {
                    elevator.setDestination(building.waitingRiders[0].start);
                } else {
                    elevator.setDestination(null);
                }
            } else {
                elevator.setDestination(elevator.riders[0].destination);
            }
        });
    },
}

function pickFloor(min, max) {
    // inclusive random picker
    const floor = min + Math.floor((1 + max - min) * Math.random());
    return floor;
}

const simulation = new Simulation();

document.querySelector("#create-rider-button").addEventListener("click", function() {
    simulation.buildings[0].createRider();
});

document.querySelector("#create-many-riders-button").addEventListener("click", function() {
    for (let i = 0; i < 50; i++) {
        simulation.buildings[0].createRider();
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

document.querySelector("#reset-sim-button").addEventListener("click", function() {
    simulation.reset();
    simulation.run();
    document.querySelector("#pause-sim-button").textContent = "Pause";
});

simulation.run();
