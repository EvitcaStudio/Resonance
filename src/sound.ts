import { Resonance, ResonanceSingleton } from "./resonance.js";
// @ts-ignore
import { Tween } from "./vendor/tween.min.mjs";

/**
 * A small class to represent a sound. Has useful API to handle the sound.
 * 
 * @class Sound
 */
class Sound {
    /**
     * The path of the sound.
     * @type {string}
     */
    soundPath: string | null = null;
    /**
     * The start time of this sound.
     * @type {number}
     */
    startTime: number | null = null;
    /**
     * The end time of ththise sound.
     * @type {number}
     */
    endTime: number | null = null;
    /**
     * Whether to save this sound or not.
     * @type {boolean}
     */
    save: boolean | null = null;
    /**
     * The duration of this sound.
     * @type {number}
     */
    duration: number | null = null;
    /**
     * The source of this sound.
     * @type {Object}
     */
    source: any = null;
    /**
     * The gain node of this sound.
     * @type {Object}
     */
    gainNode: any = null;
    /**
     * Whether this sound is loaded.
     * @type {boolean}
     */
    loaded: boolean = false;
    /**
     * If this sound is to play after it is loaded.
     * @type {boolean}
     */
    playAfterLoad: boolean | null = null;
    /**
     * If this sound is muted.
     * @type {boolean}
     */
    muted: boolean = false;
    /**
     * The state of this sound.
     * @type {string}
     */
    state: string | null = null;
    /**
     * The start timestamp of this sound.
     * @type {number}
     */
    startedTimeStamp: number | null = null;
    /**
     * The timestamp of this sound when it was paused so it can be resumed at the same timestamp.
     * @type {number}
     */
    pausedTimeStamp: number = 0;
    /**
     * If this sound plays without window focus.
     * @type {boolean}
     */
    playUnfocused: boolean | null = null;
    /**
     * Object holding the fading information for this sound.
     * @type {Object}
     */
    fader: any = {};
    /**
     * Events tied to this sound. start | end | pause | resume
     * @type {Object}
     */
    events: any = {};
    /**
     * Array of filters that are currently applied on this sound.
     * @type {Array}
     */
    _filters: any[] = [];
    /**
     * Whether this sound was sent a stop signal.
     * @type {boolean}
     */
    stopSignal: boolean = false;
    /**
     * If this sound is to loop.
     * @type {boolean}
     */
    _loop: boolean = false;
    /**
     * The playback rate of this sound.
     * @type {boolean}
     */
    _playbackRate: number = 1;
    /**
     * The volume of this sound.
     * @type {boolean}
     */
    _volume: number = 100;
    /**
     * Info tied to this sound.
     * @property {string} soundPath - The path this sound uses for its source
     * @property {number} duration - The duration of this sound
     * @type {boolean}
     */
    _info: { soundPath: string | null, duration: number | null } = { 'soundPath': null, 'duration': null };
    /**
     * @param {number} pSoundPath - The path of the sound file
     * @param {number} pVolume - The volume of the sound
     * @param {number} pStartTime - The start time of this sound (to play a clipped version)
     * @param {number} pEndTime - The end time of this sound (to play a clipped version)
     * @param {boolean} pSave - Whether to save this sound, or recycle it when it's completed
     * @param {boolean} pPlayUnfocused - If this sound is set to playUnfocused then it will not be played automatically when the game screen is not focused
     * @param {number} pPlaybackRate - The rate at which the sound is played, Higher numbers for faster playback (MAX 10)
     * @param {boolean} pLoop - Whether this sound should loop or not
     * @returns { Sound } - A sound object that has vast API on controlling it
     */
    constructor(pSoundPath?: string, pVolume?: number, pStartTime?: number, pEndTime?: number, pSave?: boolean, pPlayUnfocused?: boolean, pPlaybackRate?: number, pLoop?: boolean) {
        this.build(pSoundPath, pVolume, pStartTime, pEndTime, pSave, pPlayUnfocused, pPlaybackRate, pLoop);
    }
    /**
     * Gets the current volume of this sound
     * 
     * @returns {number} The current volume of this sound
     */
    get volume(): number {
        return this._volume;
    }
    /**
     * Sets the volume of this sound
     * 
     * @param {number} pNewVolume - The volume to set
     */
    set volume(pNewVolume: number) {
        this._volume = ResonanceSingleton.clamp(pNewVolume, ResonanceSingleton.MIN_VOLUME, ResonanceSingleton.MAX_VOLUME) * ResonanceSingleton.normalize(Resonance.volume);
        if (this.loaded && this.gainNode) {
            this.gainNode.gain.value = ResonanceSingleton.normalize(this._volume);
        }
    }
    /**
     * Attaches a callback to the specified event.
     * @param {Object} pEvent - The event to attach the callback to
     * @param {Function} pCallback - The function to be called when the event is triggered
     * @return {this} The Sound instance
     */
    on(pEvent: string, pCallback: () => void): Sound {
        if (typeof(pCallback) === "function") {
            switch (pEvent) {
                case "start":
                case "stop":
                case "end":
                case "pause":
                case "resume":
                    this.events[pEvent] = pCallback;
                    break;
                default:
                    Resonance.logger.prefix('Resonance-Module').error(`The event "${pEvent}" is not supported.`);
            }
        } else {
            Resonance.logger.prefix('Resonance-Module').error(`The callback for event "${pEvent}" is not a function.`);
        }
        return this;
    }
    /**
     * Toggleable mute feature for this sound. Flips between muted and unmuted
     * 
     * @returns {this} This sound instance
     */
    toggleMute(): Sound {
        if (!this.loaded || !this.source) return this;
        this.muted = this.muted ? false : true;
        if (this.muted) {
            if (this.gainNode) {
                this.gainNode.gain.value = 0;
            }
        } else {
            if (this.gainNode) {
                this.gainNode.gain.value = ResonanceSingleton.normalize(this._volume);
            }
        }
        return this;
    }
    /**
     * Get the loop status of this sound
     * 
     * @returns {boolean} Whether this sound is set to loop or not
     */
    get loop(): boolean {
        return this._loop;
    }
    /**
     * Set the loop status of this sound
     * 
     * @param {boolean} pLoopValue - The value which to set the loop status to. Truthy values resolve to true, and falsely values resovle to false
     */
    set loop(pLoopValue: boolean) {
        this._loop = pLoopValue ? true : false;
        if (this.source) this.source.loop = this._loop;
    }
    /**
     * Toggleable loop feature for this sound. Flips between loop and unlooped
     * 
     * @returns {this} This sound instance
     */
    toggleLoop(): Sound {
        this._loop = this._loop ? false : true;
        if (this.source) this.source.loop = this._loop;
        return this;
    }
    /**
     * Get the playback status of this sound
     * 
     * @returns {number} The playback rate of this sound
     */
    get playbackRate(): number {
        return this._playbackRate;
    }
    /**
     * Set the playback status of this sound
     * 
     * @param {number} pNewPlaybackRate - The value which to set the playback status to. Clamped to 10
     */	
    set playbackRate(pNewPlaybackRate: number) {
        this._playbackRate = ResonanceSingleton.clamp(pNewPlaybackRate, 1, ResonanceSingleton.MAX_PLAYBACK_RATE);
        if (this.source) this.source.playbackRate.value = this._playbackRate;
    }
    /**
     * Set the info of this sound
     * The new value is not used, as this is a "read-only" variable. So any attempts to set it will not work
     * 
     * @param {Object} pNewInfo - The new value
     */	
    set info(pNewInfo: any) {
        // makes this variable read only basically
        this._info = this._info;
    }
    /**
     * Get the info object of this sound
     * 
     * @returns {Objecct} The info object of this sound
     */
    get info(): { soundPath: string | null, duration: number | null } {
        if (this.loaded) {
            if (this.source) {
                this._info.duration = this.duration;
            }
            this._info.soundPath = this.soundPath;
        } else {
            this._info.soundPath = this.soundPath;
        }
        return { ...this._info };
    }
    /**
     * 
     * @param {number} pSoundPath - The path of the sound file
     * @param {number} pVolume - The volume of the sound
     * @param {number} pStartTime - The start time of this sound (to play a clipped version)
     * @param {number} pEndTime - The end time of this sound (to play a clipped version)
     * @param {boolean} pSave - Whether to save this sound, or recycle it when it's completed
     * @param {boolean} pPlayUnfocused - If this sound is set to true then it will not be paused automatically when the game screen is not focused
     * @param {number} pPlaybackRate - The rate at which the sound is played, Higher numbers for faster playback (MAX 10)
     * @param {boolean} pLoop - Whether this sound should loop or not
     * @returns { Sound } - A sound object that has vast API on controlling it
     */
    build(pSoundPath?: string, pVolume: number = 100, pStartTime: number = 0, pEndTime: number = 0, pSave: boolean = false, pPlayUnfocused: boolean = false, pPlaybackRate: number = 1, pLoop: boolean = false): Sound {
        this.soundPath = pSoundPath || null;
        this.startTime = Math.max(pStartTime, 0);
        this.endTime = Math.max(pEndTime, 0);
        this.save = pLoop ? true : pSave;
        this._playbackRate = ResonanceSingleton.clamp(pPlaybackRate, 1, ResonanceSingleton.MAX_PLAYBACK_RATE);
        this.playUnfocused = pPlayUnfocused ? true : false;
        this.state = null;
        this._loop = pLoop ? true : false;
        this._volume = ResonanceSingleton.clamp(pVolume, ResonanceSingleton.MIN_VOLUME, ResonanceSingleton.MAX_VOLUME) * ResonanceSingleton.normalize(Resonance.volume);
        // If this sound will use a buffer that is already stored, do not load it, there is no need, when going to play
        // this sound, it will just use the buffer data of the previous sound that had it.
        if (this.soundPath && !Resonance.loadedBuffers[this.soundPath]) {
            this.load();
        } else {
            this.loaded = true;
        }
        return this;
    }
    /**
     * Loads this sound and stores its data so future sounds can use the same buffer
     */
    load(): void {
        const request = new XMLHttpRequest();
        const self = this;
        request.open('GET', self.soundPath!);
        request.responseType = 'arraybuffer';
        request.onload = function() {
            const audioData = request.response;
            const success = (pDecodedData: any) => {
                self.loaded = true;
                Resonance.loadedBuffers[self.soundPath!] = pDecodedData;
                // The developer attempted to play the sound while it was still loading,
                // This has been set so that the sound will play once it's finished loading now
                if (self.playAfterLoad) {
                    // A signal to stop this sound was sent, but the sound wasn't loaded to play at that time, don't allow a sound that is signaled to stop to play
                    if (self.stopSignal) {
                        self.stopSignal = false;
                        return;
                    } else {
                        self.play();
                    }
                }
            }
            const error = (pError: any) => {
                self.loaded = false;
                Resonance.logger.prefix('Resonance-Module').error(`Error with decoding audio data "${self.soundPath}" This sound has been killed.`);
                self.kill();
            }
            Resonance.audioCtx.decodeAudioData(audioData, success, error);
        };
        request.send();
    }
    /**
     * Pauses this sound
     * 
     * @returns {this} This sound instance
     */
    pause(): Sound {
        if (!this.loaded) return this;
        this.stop('suspended');
        this.state = 'suspended';
        this.pausedTimeStamp = Resonance.audioCtx.currentTime - (this.startedTimeStamp || 0);
        // This sound is no longer considered to be playing, so remove it from the array
        if (Resonance.soundsPlaying.includes(this)) Resonance.soundsPlaying.splice(Resonance.soundsPlaying.indexOf(this), 1);
        // If this sound is not apart of the suspended sounds array add it
        if (!Resonance.pausedSounds.includes(this)) Resonance.pausedSounds.push(this);
        if (typeof(this.events.pause) === 'function') this.events.pause();
        return this;
    }
    /**
     * Resumes playing this sound
     * 
     * @returns {this} This sound instance
     */
    resume(): Sound {
        if (!this.loaded) return this;
        // This sound is no longer considered to be suspended, so remove it from the array
        if (Resonance.pausedSounds.includes(this)) Resonance.pausedSounds.splice(Resonance.pausedSounds.indexOf(this), 1);
        // This sound is no longer suspended and is now playing again, add it to the playing array
        if (!Resonance.soundsPlaying.includes(this)) Resonance.soundsPlaying.push(this);
        // this will use the this.pausedTimeStamp value to resume
        this.play(true);
        this.state = this.fader.raf ? 'fading' : 'playing';
        if (typeof(this.events.resume) === 'function') this.events.resume();
        return this;
    }
    /**
     * Stops this sound from playing. If any filters are utilized on this sound they are removed.
     * 
     * @param {string} pState - The current state of this sound. It's used to figure out if a callback should be dispatched
     * @returns {this} This sound instance
     */
    stop(pState?: string): Sound {
        // The sound isn't loaded yet, but the developer wants to stop this sound, so we send out a stopSignal, so that when the sound is loaded and attempted to play, it will not play.
        if (!this.source) {
            this.stopSignal = true;
            return this;
        }
        const wasPlaying = (this.state === 'playing' || this.state === 'fading' || this.state === 'suspended') ? true : false;
        // This sound is no longer considered to be playing, so remove it from the array
        if (Resonance.soundsPlaying.includes(this)) Resonance.soundsPlaying.splice(Resonance.soundsPlaying.indexOf(this), 1);
        if (this.source) {
            if (!this.source.stop) this.source.stop = this.source.noteOff;
            this.source.stop();
            this.removeAllFilters();
            this.source.disconnect();
            this.gainNode.disconnect();
            this.source = null;
            this.gainNode = null;
        }
        this.state = pState ? pState : 'stopped';
        if (this.state === 'stopped' && wasPlaying && typeof(this.events.stop) === 'function') this.events.stop();
        return this;
    }
    /**
     * Plays this sound
     * 
     * @param {boolean} pResume - If this is being played from a paused state
     * @returns {this} This sound instance
     */
    play(pResume?: boolean): Sound {
        // A sound cannot be played if it's sound name is not referencable, 
        // a sound that is recycled has no sound information to be played
        // and if the game's API doesn't allow a sound to be played at it's current time, then it can't play.
        if (!this.soundPath || this.state === 'recycled' || !Resonance.canPlaySound()) return this;
        // If this sound is not loaded, it cannot be played, however there is a chance that a sound with the same buffer
        // information has been played before and stored. In this case it does not need to wait to load, it instead checks to see
        // if that buffer information is avaiable, and if it is, it allows the sound to be played with that data.
        if (!this.loaded && !Resonance.loadedBuffers[this.soundPath]) {
            this.playAfterLoad = true;
            return this;
        }
        // The game does not have focus at the moment, this sound will be automatically queued and played when the screen gets focus again if it is not already preset to play even when focus is lost
        if (!Resonance.focused && !this.canPlayUnfocused()) {
            if (!Resonance.queuedSoundsToPlay.includes(this)) Resonance.queuedSoundsToPlay.push(this);
            return this;
        }
        // if you already have a soure and a gainNode, disconnect them and let them be garbage collected.
        /**
         * @todo Investigate if this is needed. Doesn't seem like you have to create a new source and gain node each time.
         */
        if (this.source) {
            this.removeAllFilters();
            this.source.disconnect();
            this.gainNode.disconnect();
            this.source = null;
            this.gainNode = null;
        }
        if (Resonance.pausedSounds.includes(this)) Resonance.pausedSounds.splice(Resonance.pausedSounds.indexOf(this), 1);
        const source = Resonance.audioCtx.createBufferSource();
        const gainNode = Resonance.audioCtx.createGain();
        const self = this;
        gainNode.gain.value = ResonanceSingleton.normalize(this._volume);
        gainNode.connect(Resonance.gainNode);
        source.connect(gainNode); 
        Resonance.gainNode.connect(Resonance.audioCtx.destination);
        source.buffer = Resonance.loadedBuffers[this.soundPath];
        source.playbackRate.value = this._playbackRate;
        // sound.stop() calls this as well
        source.onended = function() {
            // if this sound was stopped, and it is a sound that will be saved return early
            if (self.state === 'stopped' && self.save) {
                return;
            } else if (self.state === 'restart') {
                // since the sound is restarting we don't want it to fire off the `onEnded` event.
                self.play();
                return;
            } else if (self.state === 'suspended') {
                return;
            }
            if (self.state !== 'stopped' && typeof(self.events.end) === 'function') self.events.end();
            if (self._loop) {
                self.play();
                return;
            }
            /*
                If this is a one use sound, it will be recycled or killed.
                A developer may still hold a reference to this sound but will not be able to do anything to it.
                If you are using a one use sound, it is best to play a sound on its creation without storing it.
                Resonance.createSound('soundPath', volume, startTime, endTime, playrate, loop).play()
            */
            if (!self.save) self.kill();
        };
        this.source = source;
        this.gainNode = gainNode;
        this.duration = source.buffer.duration;
        this.playAfterLoad = null;
        if (!source.start) source.start = (source as any).noteOn;
        source.start(0, (this.pausedTimeStamp ? this.pausedTimeStamp * this._playbackRate: (this.startTime || 0)), this.endTime ? this.endTime : this.duration);
/* 				
        // This works, however it is commented out because manually looping is alot easier to do, and easier to stuff callbacks into it when done manually.
        source.loop = this._loop;
        source.loopStart = this.startTime;
        source.loopEnd = this.endTime ? this.endTime : source.buffer.duration; 
*/
        this.state = 'playing';
        this.startedTimeStamp = Resonance.audioCtx.currentTime - (this.pausedTimeStamp ? this.pausedTimeStamp : (this.startTime || 0));
        this.pausedTimeStamp = 0;
        /**
         * Adds a filter to this sound. This is in the case of a sound that has been looped.
         * @todo Allow more than one filter.
         */
        if (this._filters.length) {
            this.addFilter(this._filters.pop());
        }
        if (!Resonance.soundsPlaying.includes(this)) Resonance.soundsPlaying.push(this);
        if (!pResume && typeof(this.events.start) === 'function') this.events.start();
        return this;
    }
    /**
     * Restarts this sound
     * @returns {this} This sound instance
     */
    restart(): Sound {
        this.stop('restart');
        return this;
    }
    /**
     * Get whether this sound will play when the window is unfocused
     * @returns {boolean} Whether or not this sound will play when the window is unfocused
     */
    canPlayUnfocused(): boolean {
        return this.playUnfocused ? true : false;
    }
    /**
     * Kills this sound. Wipes it, and recycles it if the recycle manager isn't full.
     * If the recycle manager is full, this sound will become an empty class instance.
     */
    kill(): void {
        this.wipe();
        if (Resonance.recycledSounds.length < ResonanceSingleton.MAX_RECYCLED_SOUNDS)  {
            Resonance.recycledSounds.push(this);
        } else {
            // remove all properties from this sound object, since it no longer will be used.
            // any references to this should be removed so that it can be garbage collected
            for (const variable in this) delete this[variable];
        }
    }
	/**
	 * Adds a filter to be applied to this sound.
     * @todo Allow more than one filter. Loop through the filters array and connect all filters after disconnecting.
	 * @param {Object} pFilter - The filter to add.
	 */
	addFilter(pFilter: any): void {
        const source = this.source;
        if (source) {
            // Add the filter to the sound's tracked array.
            if (!this._filters.includes(pFilter)) {
                this._filters.push(pFilter);
                // Disconnect from the gain node.
                source.disconnect();
                // Connect the filter
                source.connect(pFilter);
                pFilter.connect(this.gainNode);
            }
        } else {
            Resonance.logger.prefix('Resonance-Module').error('Invalid sound! No source found on this sound.');
        }
	}
	/**
	 * Removes a filter from being applied to this sound.
	 * @param {Object} pFilter - The filter to remove.
	 */
	removeFilter(pFilter: any): void {
        const source = this.source;
        if (source) {
            // Remove the filter from being stored on the sound.
            if (this._filters.includes(pFilter)) {
                this._filters.splice(this._filters.indexOf(pFilter), 1);
                // Disconnect from the gain node.
                source.disconnect();
                // Disconnect the filter from the gain node
                pFilter.disconnect(this.gainNode);
                // Connect back to the gain node
                source.connect(this.gainNode);
            }
        } else {
            Resonance.logger.prefix('Resonance-Module').error('Invalid sound! No source found on this sound.');
        }
	}
    /**
     * Removes all filters from this sound.
     */
    removeAllFilters(): void {
        // Remove all filters from this sound.
        this._filters.forEach((pElement) => {
            pElement.disconnect(this.gainNode);
            this.source.connect(this.gainNode);
        });
    }
    /**
     * Resets this sound to default state
     */
    wipe(): void {
        // Remove old event handlers
        delete (this as any).onStarted;
        delete (this as any).onStopped;
        delete (this as any).onEnded;
        delete (this as any).onSuspended;
        delete (this as any).onResumed;
        this.stop('wipe');
        cancelAnimationFrame(this.fader.raf);
        if (this.source) {
            this.removeAllFilters();
            this.source.disconnect();
            this.gainNode.disconnect();
        }
        // Remove all filters. This is in the case no source is found.
        this._filters.length = 0;
        this.soundPath = null;
        this.startTime = null;
        this.endTime = null;
        this.save = null;
        this.duration = null;
        this._playbackRate = 1;
        this.source = null;
        this.gainNode = null;
        this.loaded = false;
        this.playAfterLoad = null;
        this.state = 'recycled';
        this.startedTimeStamp = null;
        this.pausedTimeStamp = 0;
        this.playUnfocused = null;
        this.fader.duration = this.fader.currentIteration = this.fader.initialValue = this.fader.changeInValue = this.fader.totalIterations = this.fader.startStamp = this.fader.previousTimeStamp = this.fader.durationOffScreen = this.fader.queue = this.fader.raf = null;
        this.stopSignal = false;
        this._loop = false;
        this._volume = 100 * ResonanceSingleton.normalize(Resonance.volume);
        this._info.soundPath = this._info.duration = null;
        for (const prop in this.events) {
            delete this.events[prop];
        }
        if (Resonance.soundsPlaying.includes(this)) Resonance.soundsPlaying.splice(Resonance.soundsPlaying.indexOf(this), 1);
        if (Resonance.pausedSounds.includes(this)) Resonance.pausedSounds.splice(Resonance.pausedSounds.indexOf(this), 1);
        if (Resonance.queuedSoundsToPlay.includes(this)) Resonance.queuedSoundsToPlay.splice(Resonance.queuedSoundsToPlay.indexOf(this), 1);
        if (Resonance.queuedSoundsToFade.includes(this)) Resonance.queuedSoundsToFade.splice(Resonance.queuedSoundsToFade.indexOf(this), 1);
    }
    /**
     * Get the current timestamp of the sound playing
     * 
     * @returns {number} The current timestamp into the sound
     */
    getCurrentTime(): number {
        if (this.pausedTimeStamp) {
            return this.pausedTimeStamp * this._playbackRate;
        } else if (this.startedTimeStamp) {
            return Resonance.audioCtx.currentTime - this.startedTimeStamp;
        } else {
            return 0;
        }
    }
    /**
     * Fades this sound to the specified volume in the specified duration via the specified ease
     * 
     * @param {number} [pVolume=100] - The volume to fade to
     * @param {number} [pDuration=5000] - The duration of the fade in ms
     * @param {function} [pEase='easeOutCubic'] - Easing function
     * @param {function} pCallback - Callback to be called when the fade is over
     * @returns {this} This sound instance
     */
    fade(pVolume: number = 100, pDuration: number = 5000, pEase: string = 'easeOutCubic', pCallback?: () => void): Sound {
        if (isNaN(pVolume)) return this;
        if (isNaN(pDuration)) return this;
        // If a sound is not playing, it cannot be faded.
        if (this.state !== 'playing' && Resonance.focused) return this;
        // The game does not have focus at the moment, this sound will be automatically queued and faded when the screen gets focus again if it is not already preset to play/fade even when the screen has no focus
        if (!Resonance.focused && !this.canPlayUnfocused()) {
            // If this sound is already queued to fade, then just exit out
            if (Resonance.queuedSoundsToFade.includes(this)) return this;
            this.fader.queue = {
                'volume': pVolume,
                'duration': pDuration,
                'ease': pEase,
                'callback': pCallback
            }
            Resonance.queuedSoundsToFade.push(this);
            return this;
        }
        if (!Tween[pEase]) {
            pEase = 'easeOutCubic';
            Resonance.logger.prefix('Resonance-Module').warn('Resonance: Invalid pEase value. Reverted to default.');
        }
        // Get rid of the queue information if it exists, it is no longer needed
        if (this.fader.queue) this.fader.queue = null;
        pVolume = ResonanceSingleton.clamp(pVolume, ResonanceSingleton.MIN_VOLUME, ResonanceSingleton.MAX_VOLUME);
        this.fader.duration = Math.max(pDuration, 0);
        this.fader.currentIteration = 0;
        this.fader.initialValue = this._volume;
        this.fader.changeInValue = pVolume - this.fader.initialValue;
        this.fader.totalIterations = this.fader.duration / (1000 / ResonanceSingleton.FRAME_RATE);
        this.fader.startStamp = null;
        this.fader.previousTimeStamp = null;
        // This is due to the fact the fader interval is still active, and incrementing the timestamp if the game is not focused
        // When the game is focused, we need to get the value of time that the player was away from the screen and remove it from the current timestamp.
        // The first index holds the alotted time, the second index is used to count the time, when the screen is focused, all the time from the second index gets dumped to the first, and it repeats if neccasary.
        this.fader.durationOffScreen = [0, 0];
        this.state = 'fading';

        const self = this;
        const fadeInterval = function(pTimeStamp: number) {
            if (!Resonance.focused) {
                self.fader.raf = requestAnimationFrame(fadeInterval);
                self.fader.durationOffScreen[1] = pTimeStamp - self.fader.previousTimeStamp;
                return;
            }
            if (self.fader.startStamp === null) self.fader.startStamp = pTimeStamp;
            self.volume = Tween[pEase](self.fader.currentIteration, self.fader.initialValue, self.fader.changeInValue, self.fader.totalIterations);
            if (self.fader.durationOffScreen[1]) {
                self.fader.durationOffScreen[0] += self.fader.durationOffScreen[1];
                self.fader.durationOffScreen[1] = 0;
            }
            const elapsed = (pTimeStamp - self.fader.durationOffScreen[0]) - self.fader.startStamp;
            if (self.fader.currentIteration < self.fader.totalIterations) self.fader.currentIteration++;
            if (elapsed < self.fader.duration) {
                self.fader.previousTimeStamp = pTimeStamp;
            } else {
                cancelAnimationFrame(self.fader.raf);
                self.fader.duration = self.fader.currentIteration = self.fader.initialValue = self.fader.changeInValue = self.fader.totalIterations = self.fader.startStamp = self.fader.previousTimeStamp = self.fader.durationOffScreen = self.fader.queue = self.fader.raf = null;
                // When a sound is faded down to `0` or any other value. Just because it may be muted, does not mean it is stopped. 
                // The state of the sound is still considered to be playing after its done fading
                self.state = 'playing';						
                self.volume = pVolume;
                if (typeof(pCallback) === 'function') pCallback();
                return;
            }
            self.fader.raf = requestAnimationFrame(fadeInterval);
        }
        this.fader.raf = requestAnimationFrame(fadeInterval);
        return this;
    }
    /**
     * Start the queued fade
     */
    queuedFade(): void {
        if (this.fader.queue) this.fade(this.fader.queue.volume, this.fader.queue.duration, this.fader.queue.ease, this.fader.queue.callback);
    }
}

export { Sound };
