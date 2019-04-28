class Elevator {
    constructor(floor, capacity) {
        this.floor = floor;
        this.capacity = capacity;
        this.riders = [];
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

class Rider {
    constructor(start, destination) {
        this.start = start;
        this.destination = destination;
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
