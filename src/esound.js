import { Tween } from "./tween.min.js";

/**
* Class for managing sounds
* @class ESoundManagerSingleton  
* @license
* ESound does not have a license at this time.
* For licensing contact the author
* @author https://github.com/doubleactii
* Copyright (c) 2023 Evitca Studio

Safari does not support .ogg files, so if you are using safari, do not use .ogg files or this library will not play that sound on safari.
Otherwise, you can use .ogg on any other platform. Cordova included. This supports mp3, wav, ogg, etc.
*/
class ESoundManagerSingleton {
	/**
	 * The max volume to be used
	 * 
	 * @type {number}
	 */
	static MAX_VOLUME = 200;
	/**
	 * The min volume to be used
	 * 
	 * @type {number}
	 */
	static MIN_VOLUME = -200;
	/**
	 * The max number of sounds that can be recycled
	 * 
	 * @type {number}
	 */
	static MAX_RECYCLED_SOUNDS = 500;
	/**
	 * The max speed this sound can be played at
	 * 
	 * @type {number}
	 */
	static MAX_PLAYBACK_RATE = 10;
	/**
	 * The frame rate at which to fade the sounds
	 * 
	 * @type {number}
	 */
	static FRAME_RATE = 60;
	/**
	 * 
	 * @param {number} pVal - Value to clamp
	 * @param {number} pMin - Minimum value
	 * @param {number} pMax - Maximum value
	 * @returns The clamped number
	 */
	static clamp = (pVal, pMin, pMax) => {
		return Math.max(pMin, Math.min(pVal, pMax));
	}
	/**
	 * 
	 * @param {number} pValue - The number to normalize within a range
	 * @param {number} pMin - The min number
	 * @param {number} pMax - The max number
	 * @param {number} pRange - The range to normalize within
	 * @returns The normalized number
	 */
	static normalize = (pValue, pMin=0, pMax=100, pRange=1) => {
		return (pValue - pMin) / (pMax - pMin) * pRange;
	}
	constructor() {
		if (!window.AudioContext && !window.webkitAudioContext) {
			console.error('Your device does not support window.AudioContext || window.webkitAudioContext. This library cannot be used');
			return;
		}
		// For WebKit- and Blink-based browsers
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		// Attach events to start audio through gestures
		window.addEventListener('mousedown', this.resumeAudioCtx.bind(this));
		window.addEventListener('touchstart', this.resumeAudioCtx.bind(this));
		window.addEventListener('load', this.resumeAudioCtx.bind(this));
		// When the window is unfocused, all sounds are paused
		window.addEventListener('blur', () => {
			this.focused = false;
			if (this.soundsPlaying.length) this.pauseAllSounds(true);
		});
		// When the window is focused all sounds are resumed, and queued sounds are played
		window.addEventListener('focus', () => {
			this.focused = true;
			if (this.pausedSounds.length) this.resumeAllSounds(true);
			if (this.queuedSoundsToPlay.length || this.queuedSoundsToFade.length) this.playQueuedSounds();				
		});
		/**
		 * The audio context all audio will dervie from
		 * 
		 * @type {AudioContext}
		 */
		this.audioCtx = new AudioContext();
		// For older browser support that has this old API.
		if (!this.audioCtx.createGain && this.audioCtx.createGainNode) this.audioCtx.createGain = this.audioCtx.createGainNode;
		/**
		 * Gain node
		 * @type {GainNode}
		 */
		this.gainNode = this.audioCtx.createGain();
		// Assign volume to gainNode
		this.gainNode.gain.value = ESoundManagerSingleton.normalize(ESoundManagerSingleton.MAX_VOLUME);
		// Connect gain node to speakers
		this.gainNode.connect(this.audioCtx.destination);
		/**
		 * Array of sounds that are currently playing
		 * 
		 * @type {Array}
		 */
		this.soundsPlaying = [];
		/**
		 * Array of sounds that are currently paused
		 * 
		 * @type {Array}
		 */
		this.pausedSounds = [];
		/**
		 * Array of sounds that can be resused
		 * 
		 * @type {Array}
		 */
		this.recycledSounds = [];
		/**
		 * Array of sounds that are queued for playing
		 * 
		 * @type {Array}
		 */
		this.queuedSoundsToPlay = [];
		/**
		 * Array of sounds that are queued for fading
		 * 
		 * @type {Array}
		 */
		this.queuedSoundsToFade = [];
		/**
		 * An object that stores the buffer data of a sound so it does not have to be loaded each time
		 * 
		 * @type {Object}
		 */
		this.loadedBuffers = {};
		/**
		 * An object that stores fade information
		 * 
		 * @type {Object}
		 */
		this.fader = {};
		/**
		 * The master volume 
		 * 
		 * @type {number}
		 */
		this.volume = 100;
		/**
		 * Mute status
		 * 
		 * @type {boolean}
		 */
		this.muted = false;
		/**
		 * Current state of the library
		 * 
		 * @type {string}
		 */
		this.state = null;
		/**
		 * Whether or ESound has the window's focus. (Sound are paused when the focus is lost, and resumed when its gained)
		 * 
		 * @type {boolean}
		 */
		this.focused = true;
	}
	/**
	 * Function to check whether this library can play a sound at a given moment.
	 * 
	 * @returns {boolean} Whether a sound can be played or not.
	 */
	canPlaySound() {
		// API for the developer to define when a sound can and cannot be played. Any sound that tries to play while this returns false will not play
		if (typeof(VYLO.Client.canPlaySound) === 'function') {
			// If their defined conditions return false, then the sound cannot be played
			if (!VYLO.Client.canPlaySound()) return false;
		}
		return true;
	}
	/**
	 * Function to adjust master volume
	 * 
	 * @param {number} pVolume - The number to change the volume to
	 * @returns {ESoundManagerSingleton} This instance
	 */
	adjustVolume(pVolume) {
		// maybe show a GUI of the volume changing
		this.volume = ESoundManagerSingleton.clamp(pVolume, ESoundManagerSingleton.MIN_VOLUME, ESoundManagerSingleton.MAX_VOLUME);
		this.gainNode.gain.value = ESoundManagerSingleton.normalize(this.volume);
		return this;
	}
	/**
	 * Fades this sound to the specified volume in the specified duration via the specified ease
	 * 
	 * @param {number} [pVolume=100] - The volume to fade to
	 * @param {number} [pDuration=5000] - The duration of the fade in ms
	 * @param {function} [pEase='easeOutCubic'] - Easing function
	 * @param {function} pCallback - Callback to be called when the fade is over
	 * @returns {ESoundManagerSingleton} This instance
	 */
	fade(pVolume=100, pDuration=5000, pEase='easeOutCubic', pCallback) {
		if (isNaN(pVolume)) return;
		if (isNaN(pDuration)) return;
		if (this.state === 'fading') return;
		pVolume = ESoundManagerSingleton.clamp(pVolume, ESoundManagerSingleton.MIN_VOLUME, ESoundManagerSingleton.MAX_VOLUME);
		if (!Tween[pEase]) {
			console.error('Invalid pEase value. Reverted to default.');
		}
		this.state = 'fading';
		this.fader.duration = Math.max(pDuration, 0);
		this.fader.currentIteration = 0;
		this.fader.initialValue = this.volume;
		this.fader.changeInValue = pVolume - this.fader.initialValue;
		this.fader.totalIterations = this.fader.duration / (1000 / ESoundManagerSingleton.FRAME_RATE);
		this.fader.startStamp = null;
		this.fader.previousTimeStamp = null;
		// This is due to the fact the fader interval is still active, and incrementing the timestamp if the game is not focused
		// When the game is focused, we need to get the value of time that the player was away from the screen and remove it from the current timestamp.
		// The first index holds the alotted time, the second index is used to count the time, when the screen is focused, all the time from the second index gets dumped to the first, and it repeats if neccasary.
		this.fader.durationOffScreen = [0, 0];

		const self = this;
		const fadeInterval = function(pTimeStamp) {
			if (!self.focused) {
				self.fader.raf = requestAnimationFrame(fadeInterval);
				self.fader.durationOffScreen[1] = pTimeStamp - self.fader.previousTimeStamp;
				return;
			}
			if (self.fader.startStamp === null) self.fader.startStamp = pTimeStamp;
			self.adjustVolume(Tween[pEase](self.fader.currentIteration, self.fader.initialValue, self.fader.changeInValue, self.fader.totalIterations));
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
				self.fader.duration = self.fader.currentIteration = self.fader.initialValue = self.fader.changeInValue = self.fader.totalIterations = self.fader.startStamp = self.fader.previousTimeStamp = self.fader.durationOffScreen = self.fader.raf = null;
				self.state = null;
				self.adjustVolume(pVolume);
				if (typeof(pCallback) === 'function') pCallback();
				return;
			}
			self.fader.raf = requestAnimationFrame(fadeInterval);
		}
		this.fader.raf = requestAnimationFrame(fadeInterval);
		return this;
	}
	/**
	 * Master mute
	 * 
	 * @returns {ESoundManagerSingleton} This instance
	 */
	toggleMute() {
		this.muted = this.muted ? false : true;
		if (this.muted) {
			this._previousGainNodeValue = this.gainNode.gain.value;
			this.gainNode.gain.value = 0;
		} else {
			this.gainNode.gain.value = this._previousGainNodeValue ? this._previousGainNodeValue : 1;
		}
		return this;
	}
	/**
	 * Checks if the sound manager is currently muted
	 * 
	 * @returns {boolean} Whether the sound manager is muted
	 */
	isMuted() {
		return this.muted;
	}
	/**
	 * Plays a sound that is not stored. Plays the sound only. You can only kill this sound, no repeat, no changing volume, etc
	 * 
	 * @param {string} pSoundPath - The path to the file
	 * @param {number} [pVolume=100] - The volume to play the sound
	 * @param {number} [pStartTime=0] - The start time of this sound (to play a clipped version)
	 * @param {number} [pEndTime=duration] - The end time of this sound (to play a clipped version)
	 * @param {number} [pPlaybackRate=1] - The rate at which the sound is played, Higher numbers for faster playback (MAX 10)
	 * @returns {SoundSource } The source to this emitted sound. Call source.kill() to stop this sound while its playing. This is the only API this sound has
	 */
	emit(pSoundPath, pVolume=100, pStartTime=0, pEndTime, pPlaybackRate=1) {
		if (!this.canPlaySound()) return
		// a very cheap sound that can be used if certain conditions are met. 
		// This sound cannot be referenced and cannot be stopped or configured after creation.
		// If the buffer is loaded, this sound is eligable to play in the background
		// This sound is not going to be saved, this sound is not going to be lopped,
		// and this sound will not use any callbacks. This sound will be very lightweight and will not exist in memory
		const self = this;
		const source = self.audioCtx.createBufferSource();
		// Create a function to kill this sound
		source.kill = function() {
			if (!this.buffer) {
				this.queuedToStop = true;
			} else {
				this.stop();
			}
		}
		const emitSound = function() {
			const gainNode = self.audioCtx.createGain();
			gainNode.gain.value = ESoundManagerSingleton.normalize(ESoundManagerSingleton.clamp(pVolume, ESoundManagerSingleton.MIN_VOLUME, ESoundManagerSingleton.MAX_VOLUME));
			gainNode.connect(self.gainNode);
			source.connect(gainNode);
			source.buffer = self.loadedBuffers[pSoundPath];
			source.playbackRate.value = pPlaybackRate;
			if (!source.start) source.start = source.noteOn;
			source.start(0, pStartTime, (pEndTime ? pEndTime : source.buffer.duration));		
		}
		// Check if the loaded buffers already contain the loaded sound data for this sound
		if (this.loadedBuffers[pSoundPath]) {
			emitSound();
		// Otherwise load it
		} else {
			const request = new XMLHttpRequest();
			request.open('GET', pSoundPath);
			request.responseType = 'arraybuffer';
			request.onload = function() {
				const audioData = request.response;
				const success = (pDecodedData) => {
					self.loadedBuffers[pSoundPath] = pDecodedData;
					// if the user wants to stop the sound before it loads, don't play it
					if (source.queuedToStop) return;
					emitSound();
				}
				const error = (pError) => {
					console.error(`Error with decoding audio data "${pSoundPath}"`);
				}
				self.audioCtx.decodeAudioData(audioData, success, error);
			};
			request.send();
		}
		return source;
	}
	/**
	 * 
	 * @param {number} pSoundPath - The path of the sound file
	 * @param {number} [pVolume=100] - The volume of the sound
	 * @param {number} [pStartTime=0] - The start time of this sound (to play a clipped version)
	 * @param {number} [pEndTime=duration] - The end time of this sound (to play a clipped version)
	 * @param {boolean} [pSave=false] - Whether to save this sound, or recycle it when it's completed
	 * @param {boolean} [pPlayUnfocused=false] - If this sound is set to true then it will not be paused automatically when the game screen is not focused
	 * @param {number} [pPlaybackRate=1] - The rate at which the sound is played, Higher numbers for faster playback (MAX 10)
	 * @param {boolean} [pLoop=false] - Whether this sound should loop or not
	 * @returns { Sound } - A sound object that has vast API on controlling it
	 */
	createSound(pSoundPath, pVolume, pStartTime, pEndTime, pSave, pPlayUnfocused, pPlaybackRate, pLoop) {
		// If there is a reusable sound, use that sound rather than create a new one
		if (this.recycledSounds.length) {
			const sound = this.recycledSounds.pop();
			sound.build(pSoundPath, pVolume, pStartTime, pEndTime, pSave, pPlayUnfocused, pPlaybackRate, pLoop);
			return sound;
		}
		return new Sound(pSoundPath, pVolume, pStartTime, pEndTime, pSave, pPlayUnfocused, pPlaybackRate, pLoop);
	}
	/**
	 * This effectively stops all sounds in the game except those specified in the pException array
	 * 
	 * @param {Array} pException - an array of sounds that should not stop
	 * @returns {ESoundManagerSingleton} This instance
	 */
	stopAllSounds(pException) {
		for (let i = this.soundsPlaying.length - 1; i >= 0; i--) {
			const sound = this.soundsPlaying[i];
			// If the sound is not set to be saved it will be killed
			if (Array.isArray(pException) && pException.includes(sound)) {
				continue;
			}
			sound.stop();
		}
		return this;
	}
	/**
	 * This effectively kills all sounds in the game and subjects them to be recycled 
	 * 
	 * @returns {ESoundManagerSingleton} This instance
	 */
	killAllSounds() {
		// this effectively kills all sounds in the game, and subjects them to be recycled
		for (let i = this.soundsPlaying.length - 1; i >= 0; i--) {
			const sound = this.soundsPlaying[i];
			sound.kill();
		}
		return this;
	}
	/**
	 * Pauses all sounds in the game
	 * 
	 * @param {boolean} pFocus - If this function was called automatically by the game being unfocused
	 * @returns {ESoundManagerSingleton} This instance
	 */
	pauseAllSounds(pFocus) {
		for (let i = this.soundsPlaying.length - 1; i >= 0; i--) {
			const sound = this.soundsPlaying[i];
			// If this sound is set to playUnfocused then it will not be suspended automatically when the game screen is not focused
			if (pFocus && sound.canPlayUnfocused()) continue;
			sound.pause();
		}
		return this;
	}
	/**
	 * Resumes all sounds in games
	 * 
	 * @param {boolean} pFocus - If this function was called automatically by the game being focused
	 * @returns {ESoundManagerSingleton} This instance
	 */
	resumeAllSounds(pFocus) {
		for (let i = this.pausedSounds.length - 1; i >= 0; i--) {
			const sound = this.pausedSounds[i];
			sound.resume();
		}
		return this;
	}
	/**
	 * @private
	 * Finds all queued sounds (sounds that were played when the game was minimized or out of focus and plays them)
	 */
	playQueuedSounds() {
		for (let i = this.queuedSoundsToPlay.length - 1; i >= 0; i--) {
			const sound = this.queuedSoundsToPlay[i];
			this.queuedSoundsToPlay.splice(i, 1);
			sound.play();
		}

		for (let i = this.queuedSoundsToFade.length - 1; i >= 0; i--) {
			const sound = this.queuedSoundsToFade[i];
			this.queuedSoundsToFade.splice(i, 1);
			sound.queuedFade();
		}
	}
	/**
	 * Removes the loaded audio buffer data for this sound
	 * 
	 * @param {string} pSoundPath - The path of the sound file
	 * @returns {ESoundManagerSingleton} This instance
	 */
	unloadSound(pSoundPath) {
		if (this.loadedBuffers[pSoundPath]) delete this.loadedBuffers[pSoundPath];
		return this;
	}
	/**
	 * Recycles the sound for reuse later instead of deleting it. All binding info on the sound is removed
	 * 
	 * @private
	 * @param {Sound} pSound - The sound to recycle 
	 * @returns {ESoundManagerSingleton} This instance
	 */
	recycleSound(pSound) {
		if (!(pSound instanceof Sound)) return this;
		pSound.kill();
		return this;
	}
	/**
	 * This will start playing sounds that were initially blocked by not having a user gesture.
	 * This will also restart sounds when a mobile device backs out of an app, and then rejoins the app
	 */
	resumeAudioCtx() {
		if (this.audioCtx.state !== 'running') {
			this.audioCtx.resume().then(() => {
				// console.log('ESound: autostart attempt of audio context worked.');
			},
			() => {
				// console.warn('ESound: autostart attempt of audio context failed.');
			});
		}
		this.ready = true;
	}
};

export const ESound = new ESoundManagerSingleton();

/**
 * A small class to represent a sound. Has useful API to handle the sound
 * 
 * @class Sound
 */
class Sound {
/*	commented out because older devices *cough* iOS devices that are under 14.5 do not support this and prevent the game from loading
	#soundPath;
	#startTime;
	#endTime;
	#save;
	#duration;
	#source;
	#gainNode;
	#loaded = false;
	#playAfterLoad = false;
	#muted = false;
	#state;
	#startedTimeStamp;
	#pausedTimeStamp = 0;
	#playUnfocused;
	#fader = {};
	#stopSignal = false;
	#_loop = false;
	#_playbackRate = 1;
	#_volume = 100;
	#_info = { 'soundPath': null, 'duration': null };
*/
	/**
	 * 
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
	constructor(pSoundPath, pVolume, pStartTime, pEndTime, pSave, pPlayUnfocused, pPlaybackRate, pLoop) {
		this.soundPath = null;
		this.startTime = null;
		this.endTime = null;
		this.save = null;
		this.duration = null;
		this.source = null;
		this.gainNode = null;
		this.loaded = false;
		this.playAfterLoad = false;
		this.muted = false;
		this.state = null;
		this.startedTimeStamp = null;
		this.pausedTimeStamp = 0;
		this.playUnfocused = null;
		this.fader = {};
		this.events = {};
		this.stopSignal = false;
		this._loop = false;
		this._playbackRate = 1;
		this._volume = 100;
		this._info = { 'soundPath': null, 'duration': null };
		this.build(pSoundPath, pVolume, pStartTime, pEndTime, pSave, pPlayUnfocused, pPlaybackRate, pLoop);
	}
	/**
	 * Gets the current volume of this sound
	 * 
	 * @returns {number} The current volume of this sound
	 */
	get volume() {
		return this._volume;
	}
	/**
	 * Sets the volume of this sound
	 * 
	 * @param {number} pNewVolume - The volume to set
	 */
	set volume(pNewVolume) {
		this._volume = ESoundManagerSingleton.clamp(pNewVolume, ESoundManagerSingleton.MIN_VOLUME, ESoundManagerSingleton.MAX_VOLUME);
		if (this.loaded) this.gainNode.gain.value = ESoundManagerSingleton.normalize(this._volume);
	}
    /**
     * @typedef {Object} Event
     * @property {string} event - The event name
     * @property {function} callback - The function to be called when the event is triggered
     */
    /**
     * Attaches a callback to the specified event.
     * @param {Event['event']} pEvent - The event to attach the callback to
     * @param {Event['callback']} pCallback - The function to be called when the event is triggered
     * @return {Tween} The Tween instance
     */
    on(pEvent, pCallback) {
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
                    console.error(`The event "${pEvent}" is not supported.`);
            }
        } else {
            console.error(`The callback for event "${pEvent}" is not a function.`);
        }
        return this;
    }
	/**
	 * Toggleable mute feature for this sound. Flips between muted and unmuted
	 * 
	 * @returns {Sound} This sound instance
	 */
	toggleMute() {
		if (!this.loaded || !this.source) return;
		this.muted = this.muted ? false : true;
		if (this.muted) {
			this.gainNode.gain.value = 0;
		} else {
			this.gainNode.gain.value = ESoundManagerSingleton.normalize(this._volume);
		}
		return this;
	}
	/**
	 * Get the loop status of this sound
	 * 
	 * @returns {boolean} Whether this sound is set to loop or not
	 */
	get loop() {
		return this._loop;
	}
	/**
	 * Set the loop status of this sound
	 * 
	 * @param {boolean} pLoopValue - The value which to set the loop status to. Truthy values resolve to true, and falsely values resovle to false
	 */
	set loop(pLoopValue) {
		this._loop = pLoopValue ? true : false;
		if (this.source) this.source.loop = this._loop;
	}
	/**
	 * Toggleable loop feature for this sound. Flips between loop and unlooped
	 * 
	 * @returns {Sound} This sound instance
	 */
	toggleLoop() {
		this._loop = this._loop ? false : true;
		if (this.source) this.source.loop = this._loop;
		return this;
	}
	/**
	 * Get the playback status of this sound
	 * 
	 * @returns {number} The playback rate of this sound
	 */
	get playbackRate() {
		return this._playbackRate;
	}
	/**
	 * Set the playback status of this sound
	 * 
	 * @param {number} pNewPlaybackRate - The value which to set the playback status to. Clamped to 10
	 */	
	set playbackRate(pNewPlaybackRate) {
		this._playbackRate = ESoundManagerSingleton.clamp(pNewPlaybackRate, 1, ESoundManagerSingleton.MAX_PLAYBACK_RATE);
		if (this.source) this.source.playbackRate.value = this._playbackRate;
	}
	/**
	 * Set the info of this sound
	 * The new value is not used, as this is a "read-only" variable. So any attempts to set it will not work
	 * 
	 * @param {*} pNewInfo - The new value
	 */	
	set info(pNewInfo) {
		// makes this variable read only basically
		this._info = this._info;
	}
	/**
	 * Get the info object of this sound
	 * 
	 * @returns {Objecct} The info object of this sound
	 */
	get info() {
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
	build(pSoundPath, pVolume=100, pStartTime=0, pEndTime=0, pSave=false, pPlayUnfocused=false, pPlaybackRate=1, pLoop=false) {
		this.soundPath = pSoundPath;
		this.startTime = Math.max(pStartTime, 0);
		this.endTime = Math.max(pEndTime, 0);
		this.save = pLoop ? true : pSave;
		this._playbackRate = ESoundManagerSingleton.clamp(pPlaybackRate, 1, ESoundManagerSingleton.MAX_PLAYBACK_RATE);
		this.playUnfocused = pPlayUnfocused ? true : false;
		this.state = null;
		this._loop = pLoop ? true : false;
		this._volume = ESoundManagerSingleton.clamp(pVolume, ESoundManagerSingleton.MIN_VOLUME, ESoundManagerSingleton.MAX_VOLUME);
		// If this sound will use a buffer that is already stored, do not load it, there is no need, when going to play
		// this sound, it will just use the buffer data of the previous sound that had it.
		if (!ESound.loadedBuffers[this.soundPath]) {
			this.load();
		} else {
			this.loaded = true;
		}
	}
	/**
	 * Loads this sound and stores its data so future sounds can use the same buffer
	 */
	load() {
		const request = new XMLHttpRequest();
		const self = this;
		request.open('GET', self.soundPath);
		request.responseType = 'arraybuffer';
		request.onload = function() {
			const audioData = request.response;
			const success = (pDecodedData) => {
				self.loaded = true;
				ESound.loadedBuffers[self.soundPath] = pDecodedData;
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
			const error = (pError) => {
				self.loaded = false;
				console.error(`Error with decoding audio data "${self.soundPath}" This sound has been killed.`);
				self.kill();
			}
			ESound.audioCtx.decodeAudioData(audioData, success, error);
		};
		request.send();
	}
	/**
	 * Pauses this sound
	 * 
	 * @returns {Sound} This sound instance
	 */
	pause() {
		if (!this.loaded) return;
		this.stop('suspended');
		this.state = 'suspended';
		this.pausedTimeStamp = ESound.audioCtx.currentTime - this.startedTimeStamp;
		// This sound is no longer considered to be playing, so remove it from the array
		if (ESound.soundsPlaying.includes(this)) ESound.soundsPlaying.splice(ESound.soundsPlaying.indexOf(this), 1);
		// If this sound is not apart of the suspended sounds array add it
		if (!ESound.pausedSounds.includes(this)) ESound.pausedSounds.push(this);
		if (typeof(this.events.pause) === 'function') this.events.pause();
		return this;
	}
	/**
	 * Resumes playing this sound
	 * 
	 * @returns {Sound} This sound instance
	 */
	resume() {
		if (!this.loaded) return;
		// This sound is no longer considered to be suspended, so remove it from the array
		if (ESound.pausedSounds.includes(this)) ESound.pausedSounds.splice(ESound.pausedSounds.indexOf(this), 1);
		// This sound is no longer suspended and is now playing again, add it to the playing array
		if (!ESound.soundsPlaying.includes(this)) ESound.soundsPlaying.push(this);
		// this will use the this.pausedTimeStamp value to resume
		this.play(true);
		this.state = this.fader.raf ? 'fading' : 'playing';
		if (typeof(this.events.resume) === 'function') this.events.resume();
		return this;
	}
	/**
	 * Stops this sound from playing
	 * 
	 * @param {string} pState - The current state of this sound. It's used to figure out if a callback should be dispatched
	 * @returns {Sound} This sound instance
	 */
	stop(pState) {
		// The sound isn't loaded yet, but the developer wants to stop this sound, so we send out a stopSignal, so that when the sound is loaded and attempted to play, it will not play.
		if (!this.source) {
			this.stopSignal = true;
			return;
		}
		const wasPlaying = (this.state === 'playing' || this.state === 'fading' || this.state === 'suspended') ? true : false;
		// This sound is no longer considered to be playing, so remove it from the array
		if (ESound.soundsPlaying.includes(this)) ESound.soundsPlaying.splice(ESound.soundsPlaying.indexOf(this), 1);
		if (this.source) {
			if (!this.source.stop) this.source.stop = this.source.noteOff;
			this.source.stop();
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
	 * @returns {Sound} This sound instance
	 */
	play(pResume) {
		// A sound cannot be played if it's sound name is not referencable, 
		// a sound that is recycled has no sound information to be played
		// and if the game's API doesn't allow a sound to be played at it's current time, then it can't play.
		if (!this.soundPath || this.state === 'recycled' || !ESound.canPlaySound()) return;
		// If this sound is not loaded, it cannot be played, however there is a chance that a sound with the same buffer
		// information has been played before and stored. In this case it does not need to wait to load, it instead checks to see
		// if that buffer information is avaiable, and if it is, it allows the sound to be played with that data.
		if (!this.loaded && !ESound.loadedBuffers[this.soundPath]) {
			this.playAfterLoad = true;
			return;
		}
		// The game does not have focus at the moment, this sound will be automatically queued and played when the screen gets focus again if it is not already preset to play even when focus is lost
		if (!ESound.focused && !this.canPlayUnfocused()) {
			if (!ESound.queuedSoundsToPlay.includes(this)) ESound.queuedSoundsToPlay.push(this);
			return;
		}
		// if you already have a soure and a gainNode, disconnect them and let them be garbage collected
		if (this.source) {
			this.source.disconnect();
			this.gainNode.disconnect();
			this.source = null;
			this.gainNode = null;
		}
		if (ESound.pausedSounds.includes(this)) ESound.pausedSounds.splice(ESound.pausedSounds.indexOf(this), 1);
		const source = ESound.audioCtx.createBufferSource();
		const gainNode = ESound.audioCtx.createGain();
		const self = this;
		gainNode.gain.value = ESoundManagerSingleton.normalize(this._volume);
		gainNode.connect(ESound.gainNode);
		source.connect(gainNode);
		// ESound.gainNode.connect(ESound.audioCtx.destination);
		source.buffer = ESound.loadedBuffers[this.soundPath];
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
				ESound.createSound('soundPath', volume, startTime, endTime, playrate, loop).play()
			*/
			if (!self.save) self.kill();
		};
		this.source = source;
		this.gainNode = gainNode;
		this.duration = source.buffer.duration;
		this.playAfterLoad = null;
		if (!source.start) source.start = source.noteOn;
		source.start(0, (this.pausedTimeStamp ? this.pausedTimeStamp * this._playbackRate: this.startTime), this.endTime ? this.endTime : this.duration);
/* 				
		// This works, however it is commented out because manually looping is alot easier to do, and easier to stuff callbacks into it when done manually.
		source.loop = this._loop;
		source.loopStart = this.startTime;
		source.loopEnd = this.endTime ? this.endTime : source.buffer.duration; 
*/
		this.state = 'playing';
		this.startedTimeStamp = ESound.audioCtx.currentTime - (this.pausedTimeStamp ? this.pausedTimeStamp : this.startTime);
		this.pausedTimeStamp = 0;
		if (!ESound.soundsPlaying.includes(this)) ESound.soundsPlaying.push(this);
		if (!pResume && typeof(this.events.start) === 'function') this.events.start();
		return this;
	}
	/**
	 * Restarts this sound
	 * 
	 * @returns {Sound} This sound instance
	 */
	restart() {
		this.stop('restart');
		return this;
	}
	/**
	 * Get whether this sound will play when the window is unfocused
	 * @returns {boolean} Whether or not this sound will play when the window is unfocused
	 */
	canPlayUnfocused() {
		return this.playUnfocused ? true : false;
	}
	/**
	 * Kills this sound. Wipes it, and recycles it if the recycle manager isn't full.
	 * If the recycle manager is full, this sound will become an empty class instance.
	 */
	kill() {
		this.wipe();
		if (ESound.recycledSounds.length < ESoundManagerSingleton.MAX_RECYCLED_SOUNDS)  {
			ESound.recycledSounds.push(this);
		} else {
			// remove all properties from this sound object, since it no longer will be used.
			// any references to this should be removed so that it can be garbage collected
			for (const variable in this) delete this[variable];
		}
	}
	/**
	 * Resets this sound to default state
	 */
	wipe() {
		this.onStarted = null;
		this.onStopped = null;
		this.onEnded = null;
		this.onSuspended = null;
		this.onResumed = null;
		this.stop('wipe');
		cancelAnimationFrame(this.fader.raf);
		if (this.source) {
			this.source.disconnect();
			this.gainNode.disconnect();
		}
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
		this._volume = 100;
		this._info.soundPath = this._info.duration = null;
		for (const prop in this.events) {
			delete this.events[prop];
		}
		if (ESound.soundsPlaying.includes(this)) ESound.soundsPlaying.splice(ESound.soundsPlaying.indexOf(this), 1);
		if (ESound.pausedSounds.includes(this)) ESound.pausedSounds.splice(ESound.pausedSounds.indexOf(this), 1);
		if (ESound.queuedSoundsToPlay.includes(this)) ESound.queuedSoundsToPlay.splice(ESound.queuedSoundsToPlay.indexOf(this), 1);
		if (ESound.queuedSoundsToFade.includes(this)) ESound.queuedSoundsToFade.splice(ESound.queuedSoundsToFade.indexOf(this), 1);
	}
	/**
	 * Get the current timestamp of the sound playing
	 * 
	 * @returns {number} The current timestamp into the sound
	 */
	getCurrentTime() {
		if (this.pausedTimeStamp) {
			return this.pausedTimeStamp * this._playbackRate;
		} else if (this.startedTimeStamp) {
			return ESound.audioCtx.currentTime - this.startedTimeStamp;
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
	 * @returns {Sound} This sound instance
	 */
	fade(pVolume=100, pDuration=5000, pEase='easeOutCubic', pCallback) {
		if (isNaN(pVolume)) return;
		if (isNaN(pDuration)) return;
		// If a sound is not playing, it cannot be faded.
		if (this.state !== 'playing' && ESound.focused) return;
		// The game does not have focus at the moment, this sound will be automatically queued and faded when the screen gets focus again if it is not already preset to play/fade even when the screen has no focus
		if (!ESound.focused && !this.canPlayUnfocused()) {
			// If this sound is already queued to fade, then just exit out
			if (ESound.queuedSoundsToFade.includes(this)) return;
			this.fader.queue = {
				'volume': pVolume,
				'duration': pDuration,
				'ease': pEase,
				'callback': pCallback
			}
			ESound.queuedSoundsToFade.push(this);
			return;
		}
		if (!Tween[pEase]) {
			pEase = 'easeOutCubic';
			console.warn('ESound: Invalid pEase value. Reverted to default.');
		}
		// Get rid of the queue information if it exists, it is no longer needed
		if (this.fader.queue) this.fader.queue = null;
		pVolume = ESoundManagerSingleton.clamp(pVolume, ESoundManagerSingleton.MIN_VOLUME, ESoundManagerSingleton.MAX_VOLUME);
		this.fader.duration = Math.max(pDuration, 0);
		this.fader.currentIteration = 0;
		this.fader.initialValue = this._volume;
		this.fader.changeInValue = pVolume - this.fader.initialValue;
		this.fader.totalIterations = this.fader.duration / (1000 / ESoundManagerSingleton.FRAME_RATE);
		this.fader.startStamp = null;
		this.fader.previousTimeStamp = null;
		// This is due to the fact the fader interval is still active, and incrementing the timestamp if the game is not focused
		// When the game is focused, we need to get the value of time that the player was away from the screen and remove it from the current timestamp.
		// The first index holds the alotted time, the second index is used to count the time, when the screen is focused, all the time from the second index gets dumped to the first, and it repeats if neccasary.
		this.fader.durationOffScreen = [0, 0];
		this.state = 'fading';

		const self = this;
		const fadeInterval = function(pTimeStamp) {
			if (!ESound.focused) {
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
	queuedFade() {
		if (this.fader.queue) this.fade(this.fader.queue.volume, this.fader.queue.duration, this.fader.queue.ease, this.fader.queue.callback);
	}
}
