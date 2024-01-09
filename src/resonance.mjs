import { Tween } from "./vendor/tween.min.mjs";
import { Sound } from "./sound.mjs";

/**
* Class for managing sounds
* @class ResonanceSingleton  
* @license Resonance does not have a license at this time. For licensing contact the author
* @author https://github.com/doubleactii
* Copyright (c) 2023 Evitca Studio

Safari does not support .ogg files, so if you are using safari, do not use .ogg files or this library will not play that sound on safari.
Otherwise, you can use .ogg on any other platform. Cordova included. This supports mp3, wav, ogg, etc.
*/
class ResonanceSingleton {
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
		this.gainNode.gain.value = ResonanceSingleton.normalize(ResonanceSingleton.MAX_VOLUME);
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
		 * Whether or Resonance has the window's focus. (Sound are paused when the focus is lost, and resumed when its gained)
		 * 
		 * @type {boolean}
		 */
		this.focused = true;
		/**
		 * The checker function to resolve to true or false denoting if a sound can be played
		 * Master control over which sounds can play
		 * 
		 * @type {Function}
		 */
		this.abilityToPlaySound = null;
	}
	/**
	 * Function to check whether this library can play a sound at a given moment.
	 * 
	 * @returns {boolean} Whether a sound can be played or not.
	 */
	canPlaySound() {
		if (this.abilityToPlaySound) {
			if (!this.abilityToPlaySound()) return false;
		}
		return true;
	}
	/**
	 * API for the developer to define when a sound can and cannot be played. Any sound that tries to play while this returns false will not play
	 * Enables a checker to become the master checker over whether a sound can play
	 * If their defined conditions return false, then the sound cannot be played
	 * 
	 * @param {Function} pCheckerFunction - The function that will resolve to true or false denoting if a sound can be played
	 * @returns {ResonanceSingleton} This instance
	 */
	enableChecker(pCheckerFunction) {
		if (typeof(pCheckerFunction) === 'function') {
			this.abilityToPlaySound = pCheckerFunction;
		}
		return this;
	}
	/**
	 * Function to adjust master volume
	 * 
	 * @param {number} pVolume - The number to change the volume to
	 * @returns {ResonanceSingleton} This instance
	 */
	adjustVolume(pVolume) {
		// maybe show a GUI of the volume changing
		this.volume = ResonanceSingleton.clamp(pVolume, ResonanceSingleton.MIN_VOLUME, ResonanceSingleton.MAX_VOLUME);
		this.gainNode.gain.value = ResonanceSingleton.normalize(this.volume);
		return this;
	}
	/**
	 * Fades this sound to the specified volume in the specified duration via the specified ease
	 * 
	 * @param {number} [pVolume=100] - The volume to fade to
	 * @param {number} [pDuration=5000] - The duration of the fade in ms
	 * @param {function} [pEase='easeOutCubic'] - Easing function
	 * @param {function} pCallback - Callback to be called when the fade is over
	 * @returns {ResonanceSingleton} This instance
	 */
	fade(pVolume=100, pDuration=5000, pEase='easeOutCubic', pCallback) {
		if (isNaN(pVolume)) return;
		if (isNaN(pDuration)) return;
		if (this.state === 'fading') return;
		pVolume = ResonanceSingleton.clamp(pVolume, ResonanceSingleton.MIN_VOLUME, ResonanceSingleton.MAX_VOLUME);
		if (!Tween[pEase]) {
			console.error('Invalid pEase value. Reverted to default.');
		}
		this.state = 'fading';
		this.fader.duration = Math.max(pDuration, 0);
		this.fader.currentIteration = 0;
		this.fader.initialValue = this.volume;
		this.fader.changeInValue = pVolume - this.fader.initialValue;
		this.fader.totalIterations = this.fader.duration / (1000 / ResonanceSingleton.FRAME_RATE);
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
	 * @returns {ResonanceSingleton} This instance
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
			gainNode.gain.value = ResonanceSingleton.normalize(ResonanceSingleton.clamp(pVolume, ResonanceSingleton.MIN_VOLUME, ResonanceSingleton.MAX_VOLUME));
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
	 * @returns {ResonanceSingleton} This instance
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
	 * @returns {ResonanceSingleton} This instance
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
	 * @returns {ResonanceSingleton} This instance
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
	 * @returns {ResonanceSingleton} This instance
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
	 * @returns {ResonanceSingleton} This instance
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
	 * @returns {ResonanceSingleton} This instance
	 */
	recycleSound(pSound) {
		if (!(pSound instanceof Sound)) return this;
		pSound.kill();
		return this;
	}
	/**
	 * This will start playing sounds that were initially blocked by not having a user gesture.
	 * This will also restart sounds when a mobile device backs out of an app, and then rejoins the app
	 * @private
	 */
	resumeAudioCtx() {
		if (this.audioCtx.state !== 'running') {
			this.audioCtx.resume().then(() => {
				// console.log('Resonance: autostart attempt of audio context worked.');
			},
			() => {
				// console.warn('Resonance: autostart attempt of audio context failed.');
			});
		}
		this.ready = true;
	}
};

export const Resonance = new ResonanceSingleton();