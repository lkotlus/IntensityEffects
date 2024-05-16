import time
import math
from pynput import keyboard

# Globally accessible array (throwing up in my mouth right now)
hits = []

# Class for each drum hit
class Hit:
    # Init function
    def __init__(self, t=None, offset=None, bpm=None, occursEvery=None):
        # Record the time
        self.time = t
        if (t == None):
            self.time = time.time()
        # Set offset and bpm to none
        self.offset = offset
        self.bpm = bpm
        self.occursEvery = occursEvery
    
    # Recalculates the time value to be useful
    def calcDeltaT(self, tStart):
        self.time = self.time - tStart

    # Making it printable
    def __str__(self):
        return f"{self.time}"

# Records the sequence of hits
def record(cycleLen, nc, sl):
    print("Recording will start after the enter key is pressed.\nUse space, left shift, right shift, or a combination to tap each hit in the beat. Make sure to be on time and do each cycle desired.")
    times = []

    input()
    listener = keyboard.Listener(on_press=addHit)
    listener.start()
    for i in range(nc):
        tStart = time.time()
        if (not sl and i == 0):
            hits.append(Hit())
        times.append(tStart)
        tEnd = tStart + cycleLen

        while (time.time() < tEnd):
            pass
    
    listener.stop
    return times

def addHit(key):
    if (key == keyboard.Key.space or key == keyboard.Key.shift_l or key == keyboard.Key.shift_r):
        hits.append(Hit())

# Read the below comment, it applies to this as well. (Too lazy for binary search)
def findHit(t, arr, tol):
    for i in range(len(arr)):
        if (math.isclose(t, arr[i].time, abs_tol=tol)):
            print(arr[i].time)
            return i
    
    return False

# This has to be the worst algorithm I've ver written
# This needs to be entirely rewritten, but is fine for now :/
def condense(i, cycles, tol):
    avg = cycles[0][i].time

    for n in range(1, len(cycles)):
        finish = True
        removables = []
        for cycle in range(0, len(cycles), n):
            if (finish and (cycle != 0)):
                print(f"{n}, {cycles[cycle]}, {list(range(0, len(cycles), n))}")
                i = findHit(avg, cycles[cycle], tol)
                if (not isinstance(i, bool)):
                    print("hey")
                    avg = (avg + cycles[cycle][i].time)/2
                    removables.append((cycle, i))
                else:
                    finish = False
        if (finish):
            break

    for i in removables:
        cycles[i[0]][i[1]].bpm = -1

    return Hit(t=avg, occursEvery=n)

if __name__ == "__main__":
    # Being as user friendly as a CLI can get
    import argparse
    parser = argparse.ArgumentParser(description="Gets the BPM and offset of intensity effects based on user input", epilog="To do a drum beat for a 100 BPM song in which a cycle of the drum pattern lasts 4 beats and the beat alternates between two variations every other cycle, use: \"-bpm 100 -bpc 4 -nc 2\" Use this, because the BPM is as specified, the beats per cycle matches, and if the pattern alternates every two cycles, only two cycles need to be recorded.")

    # Each tag
    parser.add_argument("-bpm", "--beatsPerMinute", dest="bpm", help="Beats per minute of the song (integer or float)", required=True, type=float)
    parser.add_argument("-bpc", "--beatsPerCycle", dest="bpc", help="Number of beats in a cycle of the beat, default is 4 (integer or float) [optional]", default=4, type=float)
    parser.add_argument("-nc", "--numberOfCycles", dest="nc", help="Number of cycles to be recorded", required=True, type=float)
    parser.add_argument("-t", "--tolerance", dest="tol", help="Tolerance (in seconds) used to distinguish between hits on different cycles (float, default is 0.07)", default=0.07, type=float)
    parser.add_argument("-sl", "--startLate", dest="sl", help="Use if working with a beat that doesn't start with an initial hit (initial enter will not add a hit)", action="store_true")

    # Parsing arguments
    args = parser.parse_args()
    
    # Number of seconds in between each beat
    beatLen = (60)/(args.bpm)
    # Getting cycle length from the beat length
    cycleLen = beatLen * args.bpc

    # Recording the hits
    times = record(cycleLen, int(args.nc), args.sl)

    # Creating a 2d array to store each cycle
    cycles = [[] for i in range(len(times))]

    # Prevents extra case later on
    times.append(float("inf"))

    for hit in hits:
        for i in range(len(times)):
            if (times[i] <= hit.time < times[i+1]):
                hit.calcDeltaT(times[i])
                cycles[i].append(hit)
                break
    
    for cycle in range(len(cycles)):
        print(f"Cycle {cycle+1} ({len(cycles[cycle])} hits):")
        for hit in cycles[cycle]:
            print(f"\tHit at {hit.time}")

    newHits = []

    for i in range(len(cycles[0])):
        newHits.append(condense(i, cycles, args.tol))
    
    print()

    for i in range(len(newHits)):
        bpm = ((args.bpm)/(args.bpc))/(newHits[i].occursEvery)
        offset = 360 * ((newHits[i].time)/(60/bpm))

        newHits[i].bpm = bpm
        newHits[i].offset = 360 - offset

        if (newHits[i].occursEvery == 1):
            print(f"Hit {i+1} (occurs every cycle):\n\tBPM: {newHits[i].bpm}\n\tOffset: {newHits[i].offset}°")
        else:
            print(f"Hit {i+1} (occurs every {newHits[i].occursEvery} cycles):\n\tBPM: {newHits[i].bpm}\n\tOffset: {newHits[i].offset}°")