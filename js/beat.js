'use strict'

// A class to specify each beat
class Beat {
    // Constructor function, takes in a time t and a cycle number c
    constructor(t, c, n) {
        // Simplified time
        this.t = t;
        // Array of names
        this.names = [n];
        // Array of full times
        this.fullTime = [t];
        // Array of cycle numbers (indexed at 0)
        this.occ = [c];
        // BPM value
        this.bpm = NaN;
        // Offset value
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
            document.getElementById(this.names[i]).style.left = `${100*(this.t/cl)}%`;
        }
    }

    // Join used for potential joining action frfr
    silentJoin(b2, cl) {
        this.sync(b2, cl);
        this.occ = this.occ.concat(b2.occ);
        this.names = this.names.concat(b2.names);
        this.fullTime = this.fullTime.concat(b2.fullTime);
    }

    // Splits beats into individual components
    split() {
        // Setting up an array of return values
        let returnVals = [];

        // Looping through each occurence
        for (let i = 0; i < this.occ.length; i++) {
            // Appending a new beat to the returnVals array
            let newBeat = new Beat(this.fullTime[i], this.occ[i], this.names[i]);
            newBeat.t = this.t;
            returnVals.push(newBeat);
        }

        // Returning the array
        return returnVals;
    }

    // Sets the BPM for the beat based on other variables
    calcBPM(baseBPM, nc, bpc) {
        this.bpm = ((baseBPM * this.occ.length)/(bpc * nc)).toFixed(2);
    }

    // Sets the offset for the beat based on other variables
    calcOffset(baseLen, nc) {
        let fullLen = baseLen * (nc/this.occ.length);
        let ratio = this.fullTime[0]/fullLen;
        this.offset = Math.abs((360 - (360 * ratio)).toFixed(2));
    }

    // Sets custom offset from user input
    setOffset(offset, baseLen, nc) {
        let len  = baseLen * (nc / this.occ.length);
        this.t = len * (1 - (offset / 360));
        
        for (let i = 0; i < this.occ.length; i++) {
            this.fullTime[i] = (baseLen * this.occ[i]) + this.t;
        }

        let currentCycle = this.occ[0];
        let correctedCycle = Math.floor((this.t) / baseLen);
        let cycleShift = correctedCycle - currentCycle;
        this.t -= baseLen * correctedCycle;

        for (let i = 0; i < this.names.length; i++) {
            this.occ[i] += cycleShift;
            
            let dot = document.getElementById(this.names[i]);
            document.getElementById(this.names[i]).remove();

            let newCycle = document.getElementById(`cycle${this.occ[i] + 1}`);
            newCycle.appendChild(dot);
            dot.style.left = `${(this.t / baseLen) * 100}%`;
        }
    }

    // Prints a description of the beat (for debugging)
    print() {
        return `Relative time ${this.t} during cycle(s) ${this.occ.sort((a, b) => a - b)}. BPM: ${this.bpm}, offset: ${this.offset}`;
    }
}

// Globals/constants
let beatsObj = {};
let selected = [];
let ALLOW_SELECTION = true;
let UNSELECTED_COLOR = "rgb(193, 193, 193)";
let SELECTED_COLOR = "rgb(227, 84, 0)";