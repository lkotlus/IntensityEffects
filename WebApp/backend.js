// A class to specify each beat
class Beat {
    // Constructor function, takes in a time t and a cycle number c
    constructor(t, c, n) {
        this.t = t;
        this.names = [n];
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
    join(b2, cl) {
        this.sync(b2);
        this.occ = this.occ.concat(b2.occ);
        this.names = this.names.concat(b2.names);
        this.fullTime = this.fullTime.concat(b2.fullTime);

        for (let i = 0; i < this.names.length; i++) {
            document.getElementById(this.names[i]).style.left = `${100*(this.t/cl)}%`
        }
    }

    // Splits beats into individual components
    split() {
        // Setting up an array of return values
        let returnVals = [];

        // Looping through each occurence
        for (let i = 0; i < this.occ.length; i++) {
            // Appending a new beat to the returnVals array
            returnVals.push(new Beat(this.fullTime[i], this.occ[i], this.names[i]));
        }

        // Returning the array
        return returnVals;
    }

    // Sets the BPM for the beat
    setBPM(baseBPM, nc, bpc) {
        this.bpm = ((baseBPM * this.occ.length)/(bpc * nc)).toFixed(2);
    }

    // Sets the offset for the beat
    setOffset(baseLen, nc) {
        let fullLen = baseLen * (nc/this.occ.length);
        let ratio = this.fullTime[0]/fullLen;
        this.offset = (360 * ratio).toFixed(2);
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

// Creates an expand or collapse all button
let allButtonPt1 = function() {
    // Getting the settings div ready to go, because it's about to get used a lot
    let outputDiv = document.getElementById("outputDiv");

    // Expand or collapse all button
    let allButton = document.createElement('button');
    allButton.id = 'allButton';
    allButton.innerText = "Expand all";
    allButton.style.marginLeft = "5px";
    outputDiv.appendChild(allButton);
}
// This is a MESS but it works
let allButtonPt2 = function() {
    document.getElementById('allButton').addEventListener('click', (e) => {
        let allButtons = document.querySelectorAll('.collapsible');
        let clickActive = false;

        if (e.target.innerText === "Expand all") {
            e.target.innerText = "Collapse all";
            clickActive = true;
        }
        else {
            e.target.innerText = "Expand all";
        }

        for (let i = 0; i < allButtons.length; i++) {
            if ((allButtons[i].nextElementSibling.style.display === "none") === clickActive) {
                allButtons[i].click();
            }
        }
    })
}

// Allows dot highltighting
let beatDotHighliter = function() {
    // Allowing highlighting
    document.querySelectorAll('.beatDot').forEach((dot) => {
        console.log(dot.style.backgroundColor);
        dot.addEventListener('click', (e) => {
            for (let i = 0; i < beatsObj.beats.length; i++) {
                if (beatsObj.beats[i].names.includes(e.target.id)) {
                    let color;
                    let display;
                    if (dot.style.backgroundColor === "black") {
                        color = "blue";
                        display = "block";
                    }
                    else {
                        color = "black";
                        display = "none";
                    }
    
                    beatsObj.beats[i].names.forEach((element) => {
                        document.getElementById(element).style.backgroundColor = color;
                    })

                    document.getElementById(`${beatsObj.beats[i].names[0]}Button`).nextSibling.style.display = display;
                }
            }
        })
    })
}

// Allows collapsible buttons
let outputButtons = function() {
    let allOutputButtons = document.querySelectorAll('.collapsible');
    // Adding the event listener to all of them
    for (let i = 0; i < allOutputButtons.length; i++) {
        allOutputButtons[i].addEventListener("click", function() {
            document.getElementById(`beat${i+1}`).click();
        })
    }
}

// Records a press
let press = function(cl, startTime, i, e) {
    // If a shift or enter is pressed...
    if (e.keyCode === 16 || e.keyCode === 13) {
        // Get the time it was pressed at and calculate the current cycle
        let t = Date.now() - startTime;
        let currentCycle = Math.floor((t+1)/cl);
        let relativeT = t - (cl*currentCycle);

        // Print stuff out for Logan, because he's a special boy who needs to see things in the console like a nerd
        console.log(`Time: ${t}\nCycle: ${currentCycle}`);
        // Putting stuff in the DOM? FOR THE USER?????
        let DOMCycle = document.getElementById(`cycle${currentCycle+1}`);
        let newBeatDot = document.createElement('span');
        newBeatDot.classList.add('beatDot');
        newBeatDot.id = `beat${i}`;
        newBeatDot.style.backgroundColor = "black";
        newBeatDot.style.left = `${(relativeT/cl) * 100}%`;
        DOMCycle.appendChild(newBeatDot);
        
        // And finally create and append a new beat to the beats array
        beats[currentCycle].push(new Beat(t, currentCycle, newBeatDot.id));
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

        // Adding the beat lines;
        for (let i = 0; i < c; i++) {
            // Creating a new beat line wrapper div
            let newBeatLine = document.createElement('div');
            newBeatLine.classList.add('beatLineWrapper');
            newBeatLine.id = `cycle${i+1}`;

            // Creating the actual line
            let newBeatHr = document.createElement('hr');
            newBeatHr.classList.add('beatLine');

            // Appending children
            newBeatLine.appendChild(newBeatHr);
            document.getElementById('beatLineWrappersWrapper').appendChild(newBeatLine);
        }

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
        let i = 1;

        // Doing a key press so the "enter" input becomes a beat (only if start late is false)
        if (!sl) {
            press(cl, startTime, i, {keyCode: 13});
            i++
        }

        // Handler function for an event listener (see comment below)
        let handler = (e) => {
            press(cl, startTime, i, e);
            i++;
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
                document.getElementById("outputDiv").innerHTML = "<h2>Output</h2>";
                document.getElementById("beatLineWrappersWrapper").innerHTML = "";
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
        linesHTML: "",
        outputHTML: "",
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
                        beats[currentCycle][beat].join(beats[otherCycle][binResults], beatsObj.cl);
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
    let outputDiv = document.getElementById("outputDiv");

    // Adding an expand/collapse all button
    allButtonPt1();
    allButtonPt2();

    // Looping through things to calculate BPM and offset. Also doing DOM manipulation directly afterwards.
    // NOTE TO SELF: literally never go into front end development, you are very bad at it. (W3Schools CSS tutorial site web request count for the below code: 9999999999999999999)
    for (let i = 0; i < beatsObj.beats.length; i++) {
        // Setting the BPM and offset for the current beat
        beatsObj.beats[i].setBPM(beatsObj.bpm, beatsObj.c, beatsObj.bpc);
        beatsObj.beats[i].setOffset(beatsObj.cl, beatsObj.c);

        let newWrapper = document.createElement("div");
        newWrapper.id = `beat${i+1}Wrapper`;
        newWrapper.classList.add("beatWrapper");

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
        newTextDiv.classList.add("textOutputDiv");

        // Appending all of the above elements to the settings div
        newWrapper.appendChild(newButton);
        newWrapper.appendChild(newTextDiv);
        outputDiv.appendChild(newWrapper);
    }

    outputButtons();

    // Saving HTML so importing is easy
    beatsObj.linesHTML = document.getElementById('beatLineWrappersWrapper').innerHTML;
    beatsObj.outputHTML = document.getElementById('outputDiv').innerHTML;

    beatDotHighliter();
}

let beatsObj = {};

// Start button event listener
document.getElementById('startBtn').addEventListener('click', (e) => {
    // Creates a beats array
    beats = [];
    // Adds some text
    document.getElementById('textBox').textContent = "Press enter to start recording...";
    // Adds a listener for keystrokes
    document.addEventListener('keydown', record);
}, /*Only executes once*/ {once: true})

// Exporting stuff
document.getElementById('exportButton').addEventListener('click', (e) => {
    // File contents are JSON text of the beatsObj
    let fileContents = JSON.stringify(beatsObj);

    // Creating a Blob object as the file
    let file = new Blob([fileContents], {type: 'json'});
    
    // Stolen code that makes stuff work (thank you stack overflow)
    let a = document.createElement("a"),
    url = URL.createObjectURL(file);
    a.href = url;
    a.download = 'sickBeat.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);  
    }, 0); 
})

// Importing stuff
document.getElementById('importButton').addEventListener('change', async (e) => {
    // Awaiting the imported file contents
    let contents = await e.target.files[0].text();
    // Parsing as JSON to an object
    beatsObj = JSON.parse(contents);
    // Dev stuff, you wouldn't understand
    console.log(beatsObj);
    
    // Beat lines HTML
    document.getElementById('beatLineWrappersWrapper').innerHTML = beatsObj.linesHTML;
    // Output HTML
    document.getElementById('outputDiv').innerHTML = beatsObj.outputHTML;
    allButtonPt2();

    // Getting all the output collapsibles
    outputButtons();

    // Doing the beat dots
    beatDotHighliter();
    
    // Entering the proper settings
    document.getElementById('bpm').value = beatsObj.bpm;
    document.getElementById('c').value = beatsObj.c;
    document.getElementById('bpc').value = beatsObj.bpc;
    document.getElementById('tol').value = beatsObj.tol;
    document.getElementById('sl').checked = beatsObj.sl;
})