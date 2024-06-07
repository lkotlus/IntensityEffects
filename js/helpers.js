'use strict'

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

// Interact with beat dot
let dotInteract = function(e, secondHand) {
    // Assume selected is true
    let selected = true;

    // If the color is black...
    if (e.target.style.backgroundColor === UNSELECTED_COLOR) {
        // Make it blue, and selected stays true
        e.target.style.backgroundColor = SELECTED_COLOR;
    }
    else {
        // Otherwise, switch to black and set selected to false
        e.target.style.backgroundColor = UNSELECTED_COLOR;
        selected = false;
    }

    // If not called second hand [read the code in buttonInteract, it's the same]
    if (!secondHand) {
        let className;

        for (let i = 0; i < e.target.classList.length; i++) {
            if (e.target.classList[i].includes("beat") && e.target.classList[i] !== "beatDot") {
                className = e.target.classList[i];
            }
        }
        
        let elements = document.getElementsByClassName(className);
    
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].id !== e.target.id) {
                if (elements[i].tagName === "BUTTON") {
                    buttonInteract({target: elements[i]}, true);
                }
                else {
                    dotInteract({target: elements[i]}, true);
                }
            }
        }
    }

    return selected;
}

// Interact with button
let buttonInteract = function(e, secondHand) {
    // Assume selected is true, confirmed later
    let selected = true;

    // If it's block display...
    if (e.target.parentElement.nextSibling.style.display === "block") {
        // Switch to "none" and selected is false
        e.target.parentElement.nextSibling.style.display = "none";
        selected = false;
    }
    else {
        // Otherwise switch to "block" and selected stays true
        e.target.parentElement.nextSibling.style.display = "block";
    }
    e.target.classList.toggle('expanded');

    // If this wasn't called secondhand
    if (!secondHand) {
        let className;

        // Get the class name
        for (let i = 0; i < e.target.classList.length; i++) {
            if (e.target.classList[i].includes("beat")) {
                className = e.target.classList[i];
            }
        }
    
        // Get all the elements
        let elements = document.getElementsByClassName(className);
    
        // Interact with them
        for (let i = 0; i < elements.length; i++) {
            if (!elements[i].classList.contains('collapsible')) {
                dotInteract({target: elements[i]}, true);
            }
        }
    }

    // Return selected
    return selected;
}

// Code for enabling/disabling certain edit buttons
let adjustEditUI = function(l) {
    let testBeat;

    if (l > 0) {
        // Copy beat object
        testBeat = new Beat(0, 0, 0);
        testBeat.t = beatsObj.beats[selected[0]-1].t
        testBeat.names = beatsObj.beats[selected[0]-1].names
        testBeat.fullTime = beatsObj.beats[selected[0]-1].fullTime
        testBeat.occ = beatsObj.beats[selected[0]-1].occ
        testBeat.bpm = beatsObj.beats[selected[0]-1].bpm
        testBeat.offset = beatsObj.beats[selected[0]-1].offset

        // Join them
        for (let i = 1; i < selected.length; i++) {
            testBeat.silentJoin(beatsObj.beats[selected[i]-1]);
        }
    }
    
    // Two or more beats selected
    if (l >= 2) {
        document.getElementById('add').disabled = true;
        document.getElementById('remove').disabled = false;
        document.getElementById('split').disabled = true;
        document.getElementById('move').disabled = true;
        document.getElementById('editOffset').disabled = true;

        if (isValid(testBeat, beatsObj.c)) {
            document.getElementById('join').disabled = false;
        }
    }
    // One beat selected
    else if (l === 1) {
        document.getElementById('add').disabled = true;
        document.getElementById('remove').disabled = false;
        document.getElementById('join').disabled = true;
        document.getElementById('move').disabled = false;
        document.getElementById('editOffset').disabled = false;

        if (beatsObj.beats[selected[0]-1].occ.length > 1) {
            document.getElementById('split').disabled = false;
        }
        else {
            document.getElementById('split').disabled = true;
        }
    }
    // No beats selected
    else {
        document.getElementById('add').disabled = false;
        document.getElementById('remove').disabled = true;
        document.getElementById('join').disabled = true;
        document.getElementById('split').disabled = true;
        document.getElementById('move').disabled = true;
        document.getElementById('editOffset').disabled = true;
    }
}

// Code for interacting with beats
let beatInteraction = function(n) {
    // Get all elements with the correct class name
    let items = document.getElementsByClassName(`beat${n}`);

    // Loop through them
    for (let i = 0; i < items.length; i++) {
        // If it's a dot...
        if (items[i].classList.contains('beatDot')) {
            // Add a particular event listener
            items[i].addEventListener('click', (e) => {
                if (dotInteract(e, false)) {
                    selected.push(n);
                }
                else {
                    selected.splice(selected.indexOf(n), 1);
                }

                adjustEditUI(selected.length);
            })
        }
        else {
            // Add a different one if it's a button
            items[i].addEventListener('click', (e) => {
                if (buttonInteract(e, false)) {
                    selected.push(n);
                }
                else {
                    selected.splice(selected.indexOf(n), 1);
                }

                adjustEditUI(selected.length);
            })
        }
    }
}

// Restricting values for offset
let offsetChange = function(e) {
    if (parseInt(e.target.value) > 360) {
        e.target.value = '360';
    }
    else if (parseInt(e.target.value) <= 0) {
        e.target.value = '360';
    }
}

// Records a press
let press = function(beats, cl, startTime, i, e) {
    // If a shift or enter is pressed...
    if (e.keyCode === 16 || e.keyCode === 13) {
        // Get the time it was pressed at and calculate the current cycle
        let t = Date.now() - startTime;
        let currentCycle = Math.floor((t+1)/cl);
        let relativeT = t - (cl*currentCycle);

        // Putting stuff in the DOM? FOR THE USER?????
        let DOMCycle = document.getElementById(`cycle${currentCycle+1}`);
        let newBeatDot = document.createElement('span');
        newBeatDot.classList.add('beatDot');
        newBeatDot.id = `beat${i}`;
        newBeatDot.style.backgroundColor = UNSELECTED_COLOR;
        newBeatDot.style.left = `${(relativeT/cl) * 100}%`;
        DOMCycle.appendChild(newBeatDot);
        
        // And finally create and append a new beat to the beats array
        beats[currentCycle].push(new Beat(t, currentCycle, newBeatDot.id));
    }
}

// Recording function... duh
let record = function(e) {
    if (e.keyCode === 13) {
        // Creating an empty array for our beats
        let beats = [];

        // Removing the event listeners
        document.removeEventListener('keydown', record);

        // Letting the user know what's up
        document.getElementById('startBtn').style.background = "#783535";

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

        // Beat interval (length of a beat in millisenconds) is 60 seconds divided by beats per minute
        let bi = (60/bpm)*1000;
        // The length of a cycle (in milliseconds) beat length times beats per cycle
        let cl = bi*bpc;
        
        for (let i = 0; i < c; i++) {
            beats.push([]);
        }

        // Doing timey wimey stuff
        let startTime = Date.now();
        let i = 1;

        // Doing a key press so the "enter" input becomes a beat (only if start late is false)
        if (!sl) {
            press(beats, cl, startTime, i, {keyCode: 13});
            i++
        }

        // Handler function for an event listener (see comment below)
        let handler = (e) => {
            press(beats, cl, startTime, i, e);
            i++;
        }

        // Event listener for presses (see comment above)
        document.addEventListener('keydown', handler);

        // Set timeout for n cycles in milliseconds before continuing the program
        setTimeout(() => {
            // Remove the event listener so things aren't recorded anymore
            document.removeEventListener('keydown', handler);
            document.getElementById('startBtn').style.background = null;
            // Call the postRecording() function to continue the program
            postRecording(beats, bpm, c, bpc, sl, bi, cl, tol);

            // Recreating that event listener for the start button
            document.getElementById('startBtn').addEventListener('click', (e) => {
                document.getElementById("outputDiv").innerHTML = "<h2>Output</h2><div id=\"allDiv\"><button id=\"expandAll\" class=\"expandCollapseAll button\">Expand All</button><button id=\"collapseAll\" class=\"expandCollapseAll button\">Collapse All</button></div>";
                document.getElementById("beatLineWrappersWrapper").innerHTML = "";
                beats = [];
                selected = [];
                adjustEditUI()
                document.getElementById('startBtn').style.background = "#6dc163";
                document.addEventListener('keydown', record);
                e.target.blur();

                document.getElementById('expandAll').addEventListener('click', (e) => {
                    console.log("HEY");
                    for (let i = 0; i < beatsObj.beats.length; i++) {
                        let current = document.getElementById(`beat${i+1}Button`);
                
                        if (!current.classList.contains("expanded")) {
                            current.click();
                        }
                    }
                })
                
                document.getElementById('collapseAll').addEventListener('click', (e) => {
                    for (let i = 0; i < beatsObj.beats.length; i++) {
                        let current = document.getElementById(`beat${i+1}Button`);
                
                        if (current.classList.contains("expanded")) {
                            current.click();
                        }
                    }
                })
            }, {once: true});
        }, cl*c);
    }
}

// Executes after time intervals are recorded, basically just continues the program after being called from a setTimeout()
let postRecording = function(beats, bpm, c, bpc, sl, bi, cl, tol) {
    // Making times relative to respective cycles rather than to the start of the first cycle
    adjustTimes(beats, cl);

    let beatsCopy = [];
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
                // If the other cycle isn't the current cycle...
                if (otherCycle != currentCycle) {
                    // Binary searching the other cycles for matching beats
                    let binResults = binSearch(beats[currentCycle][beat], beats[otherCycle], tol);

                    // Pro tip! Do not just put the following:
                    //      if (binResults) { ... }
                    // 0 is a falsey value, because of course it is!
                    // Why is 0 falsey even though it is a normal real integer with many normal real integer applications? Because JavaScript.
                    if (binResults !== false) {
                        // Join the two beats
                        beats[currentCycle][beat].join(beats[otherCycle][binResults], beatsObj.cl);
                        // And remove the other beat from it's current array3
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
            let insertableBeats = beatsObj.beats[i].split();
            // Splice it up
            beatsObj.beats.splice(i, 1);

            // And insert the seperate beats frfr
            for (let j = 0; j < insertableBeats.length; j++) {
                beatsObj.beats.splice(insertLoaction(insertableBeats[j], beatsObj.beats), 0, insertableBeats[j]);
            }
        }
    }

    render();
}

let render = function() {
    // Getting the settings div ready to go, because it's about to get used a lot
    let outputDiv = document.getElementById("outputDiv");

    // Adding an expand/collapse all button
    // allButtonPt1();
    // allButtonPt2();

    // Looping through things to calculate BPM and offset. Also doing DOM manipulation directly afterwards.
    // NOTE TO SELF: literally never go into front end development, you are very bad at it. (W3Schools CSS tutorial site GET request count for the below code: 9999999999999999999)
    for (let i = 0; i < beatsObj.beats.length; i++) {
        // Setting the BPM and offset for the current beat
        beatsObj.beats[i].calcBPM(beatsObj.bpm, beatsObj.c, beatsObj.bpc);
        beatsObj.beats[i].calcOffset(beatsObj.cl, beatsObj.c);

        let newWrapper = document.createElement("div");
        newWrapper.id = `beat${i+1}Wrapper`;
        newWrapper.classList.add("beatWrapper");

        let newInnerWrapper = document.createElement("div");
        newInnerWrapper.classList.add("innerWrapper");

        let newP = document.createElement("div");
        newP.textContent = `Beat ${i+1}`;
        newP.classList.add("beatLabel");

        // Creating a new button for the collapsible of the current beat
        let newButton = document.createElement("button");
        newButton.classList.add("collapsible");
        newButton.classList.add(`beat${i+1}`);
        newButton.classList.add("beatButton")
        newButton.id = `beat${i+1}Button`;

        // Creating a new text div for the collapsible of the current beat
        let newTextDiv = document.createElement("div");
        newTextDiv.textContent = `BPM: ${beatsObj.beats[i].bpm}, Offset: `;
        newTextDiv.style.display = "none";
        newTextDiv.id = `beat${i+1}Div`;
        newTextDiv.classList.add("textOutputDiv");

        let newOffsetInput = document.createElement("input");
        newOffsetInput.value = beatsObj.beats[i].offset;
        newOffsetInput.classList.add("offsetInput");
        newOffsetInput.id = `beat${i+1}Offset`;
        newOffsetInput.readOnly = true;
        newOffsetInput.addEventListener('change', (e) => {
            offsetChange(e);
        })
        newOffsetInput.type = "number";

        // Appending all of the above elements to the settings div
        newTextDiv.appendChild(newOffsetInput);
        newInnerWrapper.appendChild(newP);
        newInnerWrapper.appendChild(newButton);
        newWrapper.appendChild(newInnerWrapper);
        newWrapper.appendChild(newTextDiv);
        outputDiv.appendChild(newWrapper);

        // Setting the correct classname for all beat dots
        for (let j = 0; j < beatsObj.beats[i].names.length; j++) {
            document.getElementById(beatsObj.beats[i].names[j]).classList.add(`beat${i+1}`);
        }

        // Adding interaction capabilities
        beatInteraction(i+1)
    }

    // Saving HTML so importing is easy
    beatsObj.linesHTML = document.getElementById('beatLineWrappersWrapper').innerHTML;
    beatsObj.outputHTML = document.getElementById('outputDiv').innerHTML;

    adjustEditUI();
}

// Code for re rendering after a change
let rerender = function() {
    // Resort the beats
    beatsObj.beats = beatsObj.beats.sort((b1, b2) => {
        return b1.fullTime[0] - b2.fullTime[0];
    })

    // Fix class names and remove old event listeners
    for (let i = 0; i < beatsObj.beats.length; i++) {
        for (let j = 0; j < beatsObj.beats[i].names.length; j++) {
            let oldElement = document.getElementById(beatsObj.beats[i].names[j]);
            let newElement = oldElement.cloneNode(true);
            
            newElement.classList.value = `beatDot beat${i+1}`;
            oldElement.parentNode.replaceChild(newElement, oldElement);
        }
    }
    
    // Clear the output div
    document.getElementById("outputDiv").innerHTML = "<h2>Output</h2>";

    // Re render the information
    render();

    // Remove selected items
    let dots = document.getElementsByClassName('beatDot');
    for (let i = 0; i < dots.length; i++) {
        dots[i].style.backgroundColor = UNSELECTED_COLOR;
    }

    selected = [];

    adjustEditUI();
}