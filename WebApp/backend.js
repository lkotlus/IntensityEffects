// A class to specify each beat
class Beat {
    // Constructor function, takes in a time t and a cycle number c
    constructor(t, c) {
        this.t = t;
        this.occ = [c];
        this.bpm = NaN;
        this.offset = NaN;
    }

    // Syncs the times of two beats (averages the two)
    sync(b2) {
        this.t = (this.t + b2.t)/2;
        b2.t = this.t;
    }

    // Joins two beats (syncs the time and concatonates the cycles)
    join(b2) {
        this.sync(b2);
        this.occ = this.occ.concat(b2.occ);
    }

    // Prints a description of the beat (for debugging)
    print() {
        console.log(`Time interval ${this.t} during cycle(s) ${this.occ}`);
    }
}

let isClose = function(b1, b2, tol) {
    return Math.abs(b1.t - b2.t) < tol;
}

let binSearch = function(b, arr, tol) {
    mid = Math.floor(arr.length / 2);
}

let press = function(cl, startTime, e) {
    if (e.keyCode === 16 || e.keyCode === 13) {
        t = Date.now() - startTime;
        currentCycle = Math.floor((t+1)/cl);
        console.log(`Time: ${t}\nCycle: ${currentCycle}`);
        beats[currentCycle].push(new Beat(t, currentCycle));
    }
}

let record = function(e) {
    if (e.keyCode === 13) {
        // Removing the event listeners
        document.removeEventListener('keydown', record);

        // Letting the user know what's up
        document.getElementById('textBox').textContent = "Press enter, left shift, or right shift to record beats during the time interval...";

        // Getting values
        bpm = Number(document.getElementById('bpm').value);
        c = Number(document.getElementById('c').value);
        bpc = Number(document.getElementById('bpc').value);
        sl = document.getElementById('sl').checked;

        // Beat interval is 60 divided by beats per minute
        bi = (60/bpm)*1000;
        // The length of a cycle (in milliseconds) beat length times beats per cycle
        cl = bi*bpc;
        
        for (let i = 0; i < c; i++) {
            beats.push([]);
        }

        // Testing stuff with the console
        console.log(`Beat interval: ${bi} milliseconds\nCycle length: ${cl} milliseconds`);

        // Doing timey wimey stuff
        startTime = Date.now();
        endTime = startTime + cl;

        if (!sl) {
            press(cl, startTime, {keyCode: 13});
        }

        let handler = (e) => {
            press(cl, startTime, e);
        }

        document.addEventListener('keydown', handler);

        setTimeout(() => {
            document.removeEventListener('keydown', handler);
            console.log("Done!");
            document.getElementById('textBox').textContent = "";

            document.getElementById('startBtn').addEventListener('click', (e) => {
                beats = [];
                document.getElementById('textBox').textContent = "Press enter to start recording...";
                document.addEventListener('keydown', record);
            }, {once: true});
        }, cl*c);
    }
}

document.getElementById('startBtn').addEventListener('click', (e) => {
    beats = [];
    document.getElementById('textBox').textContent = "Press enter to start recording...";
    document.addEventListener('keydown', record);
}, {once: true});