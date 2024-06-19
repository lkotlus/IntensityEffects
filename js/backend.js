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

// Add button (THIS SUCKS, PUT IT OFF AS MUCH AS POSSIBLE)
// document.getElementById('add').addEventListener('click', (e) => {
//     // Disable other edits
//     adjustEditUI(-1);

//     // Get cycle info
//     cycles = document.getElementsByClassName('beatLineWrapper');
//     width = cycles[0].clientWidth;

//     let handle = function(e) {
//         let xCord = e.offsetX;

//         if (xCord < 0) {
//             xCord = 0;
//         }

//         let offset = xCord / width;

//         let newBeat = new Beat()
//     }

//     for (let i = 0; i < cycles.length; i++) {
//         cycles[i].addEventListener('click', handle);
//     }
// })

// Remove button (THIS ALSO SUCKS)
// document.getElementById('remove').addEventListener('click', (e) => {
//     for (let i = 0; i < selected.length; i++) {
//         beatsObj.beats.splice(selected[i]-1-i, 1);
//     }

//     rerender();
// })

// Edit button
document.getElementById('editOffset').addEventListener('click', (e) => {
    // Disable other edit buttons while doing this
    adjustEditUI(-1);

    // Remove the readonly attribute while changing the offset
    document.getElementById(`beat${selected[0]}Offset`).removeAttribute('readonly');

    // Listen for a change in offset
    document.getElementById(`beat${selected[0]}Offset`).addEventListener('change', (e) => {
        // Once detected, implement the change in the backend
        beatsObj.beats[selected[0]-1].setOffset(parseFloat(e.target.value), beatsObj.cl, beatsObj.c);

        // Bring back the readonly
        e.target.setAttribute('readonly', 'readonly');

        rerender();

        // Bring back the edit buttons
        adjustEditUI(selected.length);
    }, {once: true})
})

// Move button
document.getElementById('move').addEventListener('click', (e) => {
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
            rerender();

            // Bring back the buttons
            adjustEditUI(selected.length);
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

    // Rerender
    rerender();

    // Adjust buttons
    adjustEditUI(selected.length);
})