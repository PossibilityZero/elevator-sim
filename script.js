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
    constructor(floors) {
        const startFloor = 1;
        const capacity = 12;
        this.elevator = new Elevator(startFloor, capacity);
        this.floors = floors;
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
        this.shafts.push(new ElevatorShaft(8));
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

        this.drawElevator(shaft, newShaft);
    }

    drawGraphics() {
        this.clearGraphics();
        this.shafts.forEach(e => this.drawElevatorShaft(e));
    }

    update() {
        this.drawGraphics();
        this.shafts.forEach(e => e.update());
    }

    run() {
        this.sim = setInterval(this.update.bind(this), 40);
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
    let maxFloor = 8;
    let start = pickFloor(minFloor, maxFloor);
    let destination = pickFloor(minFloor, maxFloor);
    return new Rider(start, destination);
}


const simulation = new Simulation(20);

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

