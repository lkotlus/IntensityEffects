'use strict'

// Start button event listener
document.getElementById('startBtn').addEventListener('click', (e) => {
    // Clearing the HTML
    document.getElementById("outputDiv").innerHTML = "<h2>Output</h2><div id=\"allDiv\"><button id=\"expandAll\" class=\"expandCollapseAll button\">Expand All</button><button id=\"collapseAll\" class=\"expandCollapseAll button\">Collapse All</button></div>";
    document.getElementById("beatLineWrappersWrapper").innerHTML = "";
    // Adds some text
    document.getElementById('startBtn').style.background = "#6dc163";
    // Adds a listener for keystrokes
    document.addEventListener('keydown', record);
    // Remove keyboard focus
    e.target.blur();

    document.getElementById("instructionsBox").textContent = "Press enter to start recording. While recording, the button will be red and you will be able to hit either shift keys as well as the enter key to record hits.";

    document.getElementById('expandAll').addEventListener('click', (e) => {
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
    a.download = 'lights.json';
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

    // Making things beat objects instead of "dictionary objects"
    for (let i = 0; i < beatsObj.beats.length; i++) {
        let newBeat = new Beat(0, 0, 0);

        newBeat.t = beatsObj.beats[i].t;
        newBeat.names = beatsObj.beats[i].names;
        newBeat.fullTime = beatsObj.beats[i].fullTime;
        newBeat.occ = beatsObj.beats[i].occ;
        newBeat.bpm = beatsObj.beats[i].bpm;
        newBeat.offset = beatsObj.beats[i].offset;

        beatsObj.beats[i] = newBeat;
    }
    
    // Beat lines HTML
    document.getElementById('beatLineWrappersWrapper').innerHTML = beatsObj.linesHTML;
    
    rerender();
    
    // Entering the proper settings
    document.getElementById('bpm').value = beatsObj.bpm;
    document.getElementById('c').value = beatsObj.c;
    document.getElementById('bpc').value = beatsObj.bpc;
    document.getElementById('tol').value = beatsObj.tol;
    document.getElementById('sl').checked = beatsObj.sl;
})

// 
////        Edit buttons
// 

// This is the real add function, the event listener below just makes another event listener.
const realAddFunction = function(e) {
    // If the user clicked on a beat dot, complain
    if (e.target.classList.contains("beatDot")) {
        document.getElementById("instructionsBox").textContent = "Do not click on other hits. Click anywhere ELSE on the lines to add a new hit at that location (quit being goofy).";
        e.target.click();
        adjustEditUI(-1);
        return null;
    }
    
    // Remove our event listeners
    let cycles = document.getElementsByClassName("beatLineWrapper");
    for (let i = 0; i < cycles.length; i++) {
        cycles[i].removeEventListener('click', realAddFunction);
    }

    // Get the cycle number
    let cycleNum = parseInt(e.currentTarget.id.slice(5));

    // Do some math to get the position of the new beat (stolen from StackOverflow)
    let rect = e.currentTarget.getBoundingClientRect();
    let width = e.currentTarget.offsetWidth;
    let x = e.clientX - rect.left;
    let percent = x/width;

    // Create a new beat with everything but the name
    let newBeat = new Beat(0, 0, 0);
    newBeat.t = beatsObj.cl * percent;
    newBeat.fullTime = [newBeat.t + ((cycleNum-1) * beatsObj.cl)];
    newBeat.occ = [cycleNum-1];
    newBeat.calcBPM(beatsObj.bpm, beatsObj.c, beatsObj.bpc);
    newBeat.calcOffset(beatsObj.cl, beatsObj.c);

    // Get insertion index, add the last attribute to our new beat object, and insert the new beat
    let beatIndex;
    for (let i = 0; i < beatsObj.beats.length; i++) {
        if (beatsObj.beats[i+1] === undefined) {
            beatIndex = i+1;
        }
        else if ((beatsObj.beats[i].fullTime[0] < newBeat.fullTime[0]) && (beatsObj.beats[i+1].fullTime[0] > newBeat.fullTime[0])) {
            beatIndex = i+1;
            break;
        }
    }

    let beatId = 0;
    for (let i = 0; i < beatsObj.beats.length; i++) {
        for (let j = 0; j < beatsObj.beats[i].fullTime.length; j++) {
            if (beatsObj.beats[i].fullTime[j] < newBeat.fullTime[0]) {
                console.log("hey");
                beatId++;
            }
        }
    }
    beatId++;

    newBeat.names = [`beat${beatId}`];
    beatsObj.beats.splice(beatIndex, 0, newBeat);

    console.log(beatIndex);

    // Fix other ids/classnames
    for (let i = beatsObj.beats.length-1; i >= 0; i--) {
        console.log(i);

        // Names
        for (let j = 0; j < beatsObj.beats[i].names.length; j++) {
            if (beatsObj.beats[i].fullTime[j] > newBeat.fullTime[0]) {
                let old = beatsObj.beats[i].names[j];
                beatsObj.beats[i].names[j] = `beat${parseInt(beatsObj.beats[i].names[j].slice(4))+1}`;
                document.getElementById(old).id = beatsObj.beats[i].names[j];
            }
        }

        if (i > beatIndex) {
            // Classnames
            let elements = Array.from(document.getElementsByClassName(`beat${i}`));
            for (let j = 0; j < elements.length; j++) {
                if (!elements[j].id.includes("Button")) {
                    elements[j].classList.remove(`beat${i}`);
                    elements[j].classList.add(`beat${i+1}`);
                }
            }
        }
    }

    // Create a beat dot
    let newBeatDot = document.createElement('span');
    newBeatDot.classList.add('beatDot');
    newBeatDot.classList.add(`beat${beatId}`)
    newBeatDot.id = `beat${beatId}`;
    newBeatDot.style.backgroundColor = UNSELECTED_COLOR;
    newBeatDot.style.left = `${percent*100}%`;
    e.currentTarget.appendChild(newBeatDot);

    // Rerender
    rerender();

    // Fix the UI
    selected = [];
    adjustEditUI(selected.length);

    allow_selection = true;

    document.getElementById("instructionsBox").textContent = "Click on either hits or collapsibles to read and edit output.";
}

// Add button (If there are bugs, it probably came from either this or the remove button)
document.getElementById('add').addEventListener('click', (e) => {
    allow_selection = false;

    document.getElementById("instructionsBox").textContent = "Click anywhere on the lines to add a new hit at that location.";

    adjustEditUI(-1);

    let cycles = document.getElementsByClassName("beatLineWrapper");
    for (let i = 0; i < cycles.length; i++) {
        cycles[i].addEventListener('click', realAddFunction);
    }
})

// Remove button (See the comment on the add button)
document.getElementById('remove').addEventListener('click', (e) => {
    // Get target class
    let classList = document.getElementById(beatsObj.beats[selected[0]-1].names[0]).classList;
    let targetClass;
    for (let i = 0; i < classList.length; i++) {
        if (classList[i].includes("beat")) {
            targetClass = classList[i];
        }
    }

    // Get index
    let index = parseInt(targetClass.slice(4))-1;

    // Save the old beat
    let oldBeat = beatsObj.beats[index];

    // Remove from beatsObj
    beatsObj.beats.splice(index, 1);

    // Remove from DOM
    let elements = document.getElementsByClassName(targetClass);
    while (elements[0]) {
        elements[0].parentNode.removeChild(elements[0]);
    }

    // Update names in beatsObj, classnames, and ids
    for (let i = editIndex; i < beatsObj.beats.length; i++) {        
        // Names
        for (let j = 0; j < beatsObj.beats[i].names.length; j++) {
            beatsObj.beats[i].names[j] = `beat${parseInt(beatsObj.beats[i].names[j].slice(4))-1}`;
        }

        // Classnames
        let elements = Array.from(document.getElementsByClassName(`beat${i+2}`));
        for (let j = 0; j < elements.length; j++) {
            if (!elements[j].id.includes("Button")) {
                elements[j].classList.remove(`beat${i+2}`);
                elements[j].classList.add(`beat${i+1}`);

                // Ids
                elements[j].id = `beat${parseInt(elements[j].id.slice(4))-1}`;
            }
        }
    }

    selected = [];
    adjustEditUI(0);
    rerender();
})

// Edit offset button (deprecated)
// document.getElementById('editOffset').addEventListener('click', (e) => {
//     document.getElementById("instructionsBox").textContent = "Edit the offset value and then hit enter.";

//     // Disable other edit buttons while doing this
//     adjustEditUI(-1);

//     // Get the offset input area
//     let input = document.getElementById(`beat${selected[0]}Offset`);

//     // Remove the readonly attribute while changing the offset
//     input.removeAttribute('readonly');
//     input.style = "background-color: #595959;border-radius: 5px;";

//     // Listen for a change in offset
//     document.getElementById(`beat${selected[0]}Offset`).addEventListener('change', (e) => {
//         // Once detected, implement the change in the backend
//         beatsObj.beats[selected[0]-1].setOffset(parseFloat(e.target.value), beatsObj.cl, beatsObj.c);

//         // Bring back the readonly
//         e.target.setAttribute('readonly', 'readonly');
//         e.target.style = "";

//         rerender(true);

//         // Bring back the edit buttons
//         adjustEditUI(selected.length);

//         document.getElementById("instructionsBox").textContent = "Click on either hits or collapsibles to read and edit output.";
//     }, {once: true})
// })

// Move button
document.getElementById('move').addEventListener('click', (e) => {
    allow_selection = false;
    
    document.getElementById("instructionsBox").textContent = "Press the left and right arrows on the keyboard to move the selected hit. Press enter when you are finished.";

    // Temporarily remove the edit buttons
    adjustEditUI(-1);

    // It's an arrow function that is called when the ARROW KEYS trigger it lmaooooooooooooooooooo (Do you get it? It's a play on words. I don't think you're get...)
    let arrowFunction = (e) => {
        // Decrement offset on right arrow
        if (e.keyCode === 39) {
            let offsetElement = document.getElementById(`beat${selected[0]}Offset`);
            offsetElement.value = `${parseInt(offsetElement.value) - 1}`;
            offsetElement.dispatchEvent(new Event("change"));
            beatsObj.beats[selected[0]-1].setOffset(parseFloat(offsetElement.value), beatsObj.cl, beatsObj.c);
        }
        // Increment offset on left arrow
        else if (e.keyCode === 37) {
            let offsetElement = document.getElementById(`beat${selected[0]}Offset`);
            offsetElement.value = `${parseInt(offsetElement.value) + 1}`;
            offsetElement.dispatchEvent(new Event("change"));
            beatsObj.beats[selected[0]-1].setOffset(parseFloat(offsetElement.value), beatsObj.cl, beatsObj.c);
        }
    }

    // Function for when we're done moving around
    let enterFunction = (e) => {
        if (e.keyCode === 13) {
            // Remove the event listeners
            window.removeEventListener('keydown', arrowFunction);
            window.removeEventListener('keydown', enterFunction);

            // Rerender
            rerender(true);

            // Bring back the buttons
            adjustEditUI(selected.length);

            allow_selection = true;

            document.getElementById("instructionsBox").textContent = "Click on either hits or collapsibles to read and edit output.";
        }
    }

    // Add our listeners
    window.addEventListener('keydown', arrowFunction);
    window.addEventListener('keydown', enterFunction);
})

// Split button
document.getElementById('split').addEventListener('click', (e) => {
    // Get our target beat
    let targetBeat = beatsObj.beats[selected[0]-1];
    
    // Remove it from the array
    beatsObj.beats.splice(selected[0]-1, 1);

    // Concatenate individual beats with the others
    beatsObj.beats = beatsObj.beats.concat(targetBeat.split());

    selected = [];

    // rerender
    rerender()

    // Adjust buttons
    adjustEditUI(selected.length);
})

// Join button
document.getElementById('join').addEventListener('click', (e) => {
    // Making sure order is kept later on
    selected = selected.sort((a, b) => {
        return a - b;
    })

    // Saving the base beat that others are joined into
    let newBeat = beatsObj.beats[selected[0]-1];
    
    // Join each selected beat to the first, then remove the beat
    for (let i = 1; i < selected.length; i++) {
        newBeat.join(beatsObj.beats[selected[i]-1], beatsObj.cl);
    }

    // Remove old beats from the array
    for (let i = 1; i < selected.length; i++) {
        beatsObj.beats.splice(selected[i]-1, 1);
    }

    // Fix the offset
    if (newBeat.offset === 0) {
        newBeat.offset = 360;
    }

    selected = [];

    // Rerender
    rerender();

    // Adjust buttons
    adjustEditUI(selected.length);
})