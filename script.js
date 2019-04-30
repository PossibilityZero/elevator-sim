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

    removeRidersForDestination(floor) {
        // remove all riders with destination floor
        let exiters = this.riders.filter(rider => rider.destination === floor);
        this.riders = this.riders.filter(rider => rider.destination !== floor);
        return exiters;
    }
    
    sendToFloor(floor) {
        this.floor = floor;
        this.removeRidersForDestination(floor);
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
}

class ElevatorShaft {
    constructor(floors) {
        const startFloor = 1;
        const capacity = 5;
        this.elevator = new Elevator(startFloor, capacity);
        this.floors = floors;
    }

    update() {
        // update one tick
        let destination = this.elevator.destination;
        let height = this.elevator.height;
        if (destination) {
            if (height > destination) {
                let diff = Math.max(-0.05, destination - height);
                this.elevator.height += diff;
            } else if (height < destination) {
                let diff = Math.min(0.05, destination - height);
                this.elevator.height += diff;
            } else {
                this.elevator.destination = null;
            }
        } else {
            if (Math.random() > 0.99) {
                this.elevator.destination = pickFloor(1,8);
            }
        }
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

    drawElevatorShaft(shaft) {
        const newShaft = document.createElement("div");
        newShaft.classList.add("elevator-shaft");
        this.graphicsContainer.appendChild(newShaft);
        newShaft.style.height = shaft.floors * 50 + "px";
        newShaft.style.width = "50px";

        const elevator = document.createElement("div");
        elevator.classList.add("elevator");
        newShaft.append(elevator);

        elevator.style.bottom = ((shaft.elevator.height - 1) * 50) + "px";
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
        setInterval(this.update.bind(this), 40);
    }
}

function pickFloor(min, max) {
    // inclusive random picker
    const floor = min + Math.floor((1 + max - min) * Math.random());
    return floor;
}

function createNewRider() {
    let minFloor = 1;
    let maxFloor = 4;
    let start = pickFloor(minFloor, maxFloor);
    let destination = pickFloor(minFloor, maxFloor);
    return new Rider(start, destination);
}

let elevator = new Elevator(1, 5);

document.querySelector("#create-rider-button").addEventListener("click", function() {
    let rider = createNewRider();
    elevator.addRider(rider);
    console.log(elevator.riders);
});

(new Simulation(2)).run();
