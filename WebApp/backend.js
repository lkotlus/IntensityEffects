// A class to specify each beat
class Beat {
    // Constructor function, takes in a time t and a cycle number c
    constructor(t, c) {
        this.t = t;
        this.fullTime = [t];
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
        this.fullTime = this.fullTime.concat(b2.fullTime);
    }

    // Splits beats into individual components
    split() {
        // Setting up an array of return values
        let returnVals = [];

        // Looping through each occurence
        for (let i = 0; i < this.occ.length; i++) {
            // Appending a new beat to the returnVals array
            returnVals.push(new Beat(this.fullTime[i], this.occ[i]));
        }

        // Returning the array
        return returnVals;
    }

    // Sets the BPM for the beat
    setBPM(baseBPM, nc, bpc) {
        this.bpm = (baseBPM * this.occ.length)/(bpc * nc);
    }

    // Sets the offset for the beat
    setOffset(baseLen, nc) {
        let fullLen = baseLen * (nc/this.occ.length);
        let ratio = this.fullTime[0]/fullLen;
        this.offset = 360 - (360 * ratio);
    }

    // Prints a description of the beat (for debugging)
    print() {
        console.log(`Time interval ${this.t} during cycle(s) ${this.occ.sort((a, b) => a - b)}. BPM: ${this.bpm}, offset: ${this.offset}`);
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

// Checks the uniformity of a beats occurences
let isUniform = function(occ, nc) {
    if (occ.length === 1) {
        return true;
    }

    // Length variable
    let len = occ[1] - occ[0];

    
    for (let i = 1; i < occ.length; i++) {
        if (occ[i] - occ[i-1] !== len) {
            return false;
        }
    }

    if (((nc - occ[occ.length-1]) + occ[0]) !== len) {
        return false;
    }

    return true;
}

let isValid = function(b, nc) {
    if (nc % b.occ.length === 0 && isUniform(b.occ.sort((a, b) => a - b), nc)) {
        return true;
    }
    
    return false;
}

// Binary search implementation with isClose()
let binSearch = function(b, arr, tol) {
    // Setting up variables for start, end, and mid
    let start = 0;
    let end = arr.length-1;
    let mid = Math.floor((end+start)/2);

    // Lil' while loop with the base case
    while (start <= end) {
        // Checking for if we might have found it yet
        if (end-start <= 2) {
            // If so, check each available location
            if (isClose(b, arr[mid], tol)) {
                return mid;
            }
            else if (isClose(b, arr[start], tol)) {
                return start;
            }
            else if (isClose(b, arr[end], tol)) {
                return end;
            }

            // If we didn't find it, return false
            return false;
        }

        // Recalculating things for the next iteration
        if (b.t < arr[mid].t) {
            end = mid;
            mid = Math.floor((end+start)/2);
        }
        else if (b.t > arr[mid].t) {
            start = mid;
            mid = Math.floor((end+start)/2);
        }
    }

    // Returning false if we didn't find anything
    return false;
}

// Quickly getting the insert location for a beat such that they are in order
let insertLoaction = function(b, arr) {
    // Base case schenaniganery
    if (b.t < arr[0].t) {
        return 0;
    }

    // Loop through the array
    for (let i = 1; i < arr.length; i++) {
        // If you find the sweet spot...
        if (b.t > arr[i-1].t && b.t < arr[i].t) {
            // Return it like an obedient boy
            return i;
        }
    }

    // If you never find the spot, return the length of the array
    return arr.length;
}

// Records a press
let press = function(cl, startTime, e) {
    // If a shift or enter is pressed...
    if (e.keyCode === 16 || e.keyCode === 13) {
        // Get the time it was pressed at and calculate the current cycle
        let t = Date.now() - startTime;
        let currentCycle = Math.floor((t+1)/cl);

        // Print stuff out for Logan, because he's a special boy who needs to see things in the console like a nerd
        console.log(`Time: ${t}\nCycle: ${currentCycle}`);
        
        // And finally create and append a new beat to the beats array
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
                document.getElementById("settingsDiv").innerHTML = "";
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
        }
    }

    // This works! Loop through each beat...
    for (let i = 0; i < beatsObj.beats.length; i++) {
        // Check if it's valid...
        if (!isValid(beatsObj.beats[i], beatsObj.c)) {
            // If not, split the beat
            insertableBeats = beatsObj.beats[i].split();
            // Splice it up
            beatsObj.beats.splice(i, 1);

            // And insert the seperate beats frfr
            for (let j = 0; j < insertableBeats.length; j++) {
                beatsObj.beats.splice(insertLoaction(insertableBeats[j], beatsObj.beats), 0, insertableBeats[j]);
            }
        }
    }

    // Getting the settings div ready to go, because it's about to get used a lot
    let settingsDiv = document.getElementById("settingsDiv");

    // Looping through things to calculate BPM and offset. Also doing DOM manipulation directly afterwards.
    // NOTE TO SELF: literally never go into front end development, you are very bad at it. (W3Schools CSS tutorial site web request count for the below code: 9999999999999999999)
    for (let i = 0; i < beatsObj.beats.length; i++) {
        // Setting the BPM and offset for the current beat
        beatsObj.beats[i].setBPM(beatsObj.bpm, beatsObj.c, beatsObj.bpc);
        beatsObj.beats[i].setOffset(beatsObj.cl, beatsObj.c);

        // Creating a new button for the collapsible of the current beat
        let newButton = document.createElement("button");
        newButton.textContent = `Beat ${i+1}`;
        newButton.classList.add("collapsible");
        newButton.id = `beat${i+1}Button`;

        // Creating a new text div for the collapsible of the current beat
        let newTextDiv = document.createElement("div");
        newTextDiv.textContent = `BPM: ${beatsObj.beats[i].bpm}, Offset: ${beatsObj.beats[i].offset}`;
        newTextDiv.style.display = "none";
        newTextDiv.id = `beat${i+1}Div`;

        // Also a break tag
        let newBreak = document.createElement("br");

        // Appending all of the above elements to the settings div
        settingsDiv.appendChild(newButton);
        settingsDiv.appendChild(newTextDiv);
        settingsDiv.appendChild(newBreak);

        // Creating an event listener for the button
        document.getElementById(`beat${i+1}Button`).addEventListener("click", function() {
            // Getting the respective text div
            let textDiv = document.getElementById(`beat${i+1}Div`);
            // Toggling the button active
            this.classList.toggle("active");

            // If the text is displayed...
            if (textDiv.style.display === "block") {
                // Hide it
                textDiv.style.display = "none";
            }
            // Otherwise...
            else {
                // Display it
                textDiv.style.display = "block";
            }
        })
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