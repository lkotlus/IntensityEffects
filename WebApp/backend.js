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

// Converts all times in the beats array to be relative to their respective cycle start time
let adjustTimes = function(arr, cl) {
    // Loop through the array
    for (let i = 0; i < arr.length; i++) {
        // Loop through each array in the array
        for (let b = 0; b < arr[i].length; b++) {
            // Reset the times
            arr[i][b].t = arr[i][b].t - (cl * i);
            // Print useful stuff
            // arr[i][b].print();
        }
    }
}

// Just a handy function for math
let isClose = function(b1, b2, tol) {
    // We consider two numbers, a and b, to be "close" relative to a tolerance, t, if it satisfies the following:    |a-b| < t
    //     ^
    //     |
    //     |
    //     |
    // NERD ALERT

    return Math.abs(b1.t - b2.t) < tol;
}

let isUniform = function(b, nc) {
    return;
}

let isValid = function(b, nc) {
    if (nc % b.occ.length === 0 && isUniform(b, nc)) {
        return true;
    }
    
    return false;
}

let binSearch = function(b, arr, tol) {
    let start = 0;
    let end = arr.length-1;
    let mid = Math.floor((end+start)/2);

    while (start <= end) {
        if (end-start <= 2) {
            console.log("HEY");
            if (isClose(b, arr[mid], tol)) {
                return mid;
            }
            else if (isClose(b, arr[start], tol)) {
                return start;
            }
            else if (isClose(b, arr[end], tol)) {
                return end;
            }

            return false;
        }

        if (b.t < arr[mid].t) {
            end = mid;
            mid = Math.floor((end+start)/2);
        }
        else if (b.t > arr[mid].t) {
            start = mid;
            mid = Math.floor((end+start)/2);
        }
    }

    return false;
}

let press = function(cl, startTime, e) {
    if (e.keyCode === 16 || e.keyCode === 13) {
        let t = Date.now() - startTime;
        let currentCycle = Math.floor((t+1)/cl);
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
        let bpm = Number(document.getElementById('bpm').value);
        let c = Number(document.getElementById('c').value);
        let bpc = Number(document.getElementById('bpc').value);
        let tol = Number(document.getElementById('tol').value);
        let sl = document.getElementById('sl').checked;

        // Beat interval is 60 divided by beats per minute
        let bi = (60/bpm)*1000;
        // The length of a cycle (in milliseconds) beat length times beats per cycle
        let cl = bi*bpc;
        
        for (let i = 0; i < c; i++) {
            beats.push([]);
        }

        // Testing stuff with the console
        console.log(`Beat interval: ${bi} milliseconds\nCycle length: ${cl} milliseconds`);

        // Doing timey wimey stuff
        let startTime = Date.now();
        let endTime = startTime + cl;

        // Doing a key press so the "enter" input becomes a beat (only if start late is false)
        if (!sl) {
            press(cl, startTime, {keyCode: 13});
        }

        // Handler function for an event listener (see comment below)
        let handler = (e) => {
            press(cl, startTime, e);
        }

        // Event listener for presses (see comment above)
        document.addEventListener('keydown', handler);

        // Set timeout for n cycles in milliseconds before continuing the program
        setTimeout(() => {
            // Remove the event listener so things aren't recorded anymore
            document.removeEventListener('keydown', handler);
            // Be a friendly programmer and pritn stuff
            console.log("Done!");
            // Clear the textbox
            document.getElementById('textBox').textContent = "";
            // Call the postRecording() function to continue the program
            postRecording(beats, bpm, c, bpc, sl, bi, cl, tol);

            // Recreating that event listener for the start button
            document.getElementById('startBtn').addEventListener('click', (e) => {
                beats = [];
                document.getElementById('textBox').textContent = "Press enter to start recording...";
                document.addEventListener('keydown', record);
            }, {once: true});
        }, cl*c);
    }
}

// Executes after time intervals are recorded, basically just continues the program after being called from a setTimeout()
let postRecording = function(beats, bpm, c, bpc, sl, bi, cl, tol) {
    // Making times relative to respective cycles rather than to the start of the first cycle
    adjustTimes(beats, cl);

    beatsCopy = [];
    for (let i = 0; i < beats.length; i++) {
        beatsCopy.push([...beats[i]]);
    }    

    // Object to store the beats in
    beatsObj = {
        bpm: bpm,
        c: c,
        bpc: bpc,
        sl: sl,
        bi: bi,
        cl: cl,
        tol: tol,
        beats: []
    }

    // Code that is 5 levels nested (throwing up in my mouth right now)
    // |
    // |
    // |
    // V
    // Joining beats together, starting by looping through each cycle
    for (let currentCycle = 0; currentCycle < beats.length; currentCycle++) {
        // Looping through each beat in the current cycle
        for (let beat = 0; beat < beats[currentCycle].length; beat++) {
            // Looping through all other cycles
            for (let otherCycle = 0; otherCycle < beats.length; otherCycle++) {
                // If the other cycle isn't the current cycle and binSearch didn't return false...
                if (otherCycle != currentCycle) {
                    // Binary searching the other cycles for matching beats
                    binResults = binSearch(beats[currentCycle][beat], beats[otherCycle], tol);

                    // Pro tip! Do not just put the following:
                    //      if (binResults) { ... }
                    // 0 is a falsey value, because of course it is!
                    // Why is 0 falsey even though it is a normal real integer with many normal real integer applications? Because JavaScript.
                    if (binResults !== false) {
                        // Join the two beats
                        beats[currentCycle][beat].join(beats[otherCycle][binResults]);
                        // And remove the other beat from it's current array
                        beats[otherCycle].splice(binResults, 1);
                    }
                }
            }
        }
    }

    // Hopping into the first dimension
    for (let i = 0; i < beats.length; i++) {
        for (let j = 0; j < beats[i].length; j++) {
            beatsObj.beats.push(beats[i][j]);
            beats[i][j].print();
        }
    }
}

// Start button event listener
document.getElementById('startBtn').addEventListener('click', (e) => {
    // Creates a beats array
    beats = [];
    // Adds some text
    document.getElementById('textBox').textContent = "Press enter to start recording...";
    // Adds a listener for keystrokes
    document.addEventListener('keydown', record);
}, /*Only executes once*/ {once: true});