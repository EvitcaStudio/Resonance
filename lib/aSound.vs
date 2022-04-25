#ENABLE LOCALCLIENTCODE
#BEGIN CLIENTCODE
/* 
	Safari does not support .ogg files, so if you are using safari, do not use .ogg files or this library will not play that sound on safari.
	Otherwise, you can use .ogg on any other platform. Cordova included. This supports mp3, wav, ogg, etc.
*/
#BEGIN JAVASCRIPT
(() => {
	const engineWaitId = setInterval(() => {
		// if the library needs the client and the world
		if (VS?.Client && VS?.World?.global) {
			clearInterval(engineWaitId);
			buildSound();
		}
	});

	const buildSound = () => {
		if (!window.AudioContext && !window.webkitAudioContext) {
			console.error('Your device does not support window.AudioContext || window.webkitAudioContext. This library cannot be used');
			return;
		}

		const MAX_VOLUME = 200;
		const MIN_VOLUME = -200;
		const MAX_RECYCLED_SOUNDS = 100;
		const MAX_PLAYBACK_RATE = 10;
		const FRAME_RATE = 60;

		const clamp = (pVal, pMin, pMax) => {
			return Math.max(pMin, Math.min(pVal, pMax));
		}

		const normalize = (pValue, pMin=0, pMax=100, pRange=1) => {
			return (pValue - pMin) / (pMax - pMin) * pRange;
		}

		const Ease = {};

		Ease.linear = function(t, b, c, d) {
			return c * t / d + b;
		}
		Ease.easeInQuad = function(t, b, c, d) {
			return c * (t /= d) * t + b;
		}
		Ease.easeOutQuad = function(t, b, c, d) {
			return -c * (t /= d) * (t - 2) + b;
		}
		Ease.easeInOutQuad = function(t, b, c, d) {
			if ((t /= d / 2) < 1) return c / 2 * t * t + b;
			return -c / 2 * ((--t) * (t - 2) - 1) + b;
		}
		Ease.easeInSine = function(t, b, c, d) {
			return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
		}
		Ease.easeOutSine = function(t, b, c, d) {
			return c * Math.sin(t / d * (Math.PI / 2)) + b;
		}
		Ease.easeInOutSine = function(t, b, c, d) {
			return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
		}
		Ease.easeInExpo = function(t, b, c, d) {
			return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
		}
		Ease.easeOutExpo = function(t, b, c, d) {
			return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
		}
		Ease.easeInOutExpo = function(t, b, c, d) {
			if (t == 0) return b;
			if (t == d) return b + c;
			if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
			return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
		}
		Ease.easeInCirc = function(t, b, c, d) {
			return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
		}
		Ease.easeOutCirc = function(t, b, c, d) {
			return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
		}
		Ease.easeInOutCirc = function(t, b, c, d) {
			if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
			return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
		}
		Ease.easeInCubic = function(t, b, c, d) {
			return c * (t /= d) * t * t + b;
		}
		Ease.easeOutCubic = function(t, b, c, d) {
			return c * ((t = t / d - 1) * t * t + 1) + b;
		}
		Ease.easeInOutCubic = function(t, b, c, d) {
			if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
			return c / 2 * ((t -= 2) * t * t + 2) + b;
		}
		Ease.easeInQuart = function(t, b, c, d) {
			return c * (t /= d) * t * t * t + b;
		}
		Ease.easeOutQuart = function(t, b, c, d) {
			return -c * ((t = t / d - 1) * t * t * t - 1) + b;
		}
		Ease.easeInOutQuart = function(t, b, c, d) {
			if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
			return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
		}
		Ease.easeInQuint = function(t, b, c, d) {
			return c * (t /= d) * t * t * t * t + b;
		}
		Ease.easeOutQuint = function(t, b, c, d) {
			return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
		}
		Ease.easeInOutQuint = function(t, b, c, d) {
			if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
			return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
		}
		Ease.easeInElastic = function(t, b, c, d) {
			var s = 1.70158;
			var p = 0;
			var a = c;
			if (t == 0) return b;
			if ((t /= d) == 1) return b + c;
			if (!p) p = d * .3;
			if (a < Math.abs(c)) {
				a = c;
				var s = p / 4;
			}
			else var s = p / (2 * Math.PI) * Math.asin(c / a);
			return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
		}
		Ease.easeOutElastic = function(t, b, c, d) {
			var s = 1.70158;
			var p = 0;
			var a = c;
			if (t == 0) return b;
			if ((t /= d) == 1) return b + c;
			if (!p) p = d * .3;
			if (a < Math.abs(c)) {
				a = c;
				var s = p / 4;
			}
			else var s = p / (2 * Math.PI) * Math.asin(c / a);
			return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
		}
		Ease.easeInOutElastic = function(t, b, c, d) {
			var s = 1.70158;
			var p = 0;
			var a = c;
			if (t == 0) return b;
			if ((t /= d / 2) == 2) return b + c;
			if (!p) p = d * (.3 * 1.5);
			if (a < Math.abs(c)) {
				a = c;
				var s = p / 4;
			}
			else var s = p / (2 * Math.PI) * Math.asin(c / a);
			if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
			return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
		}
		Ease.easeInBack = function(t, b, c, d) {
			var s = 1.70158;
			return c * (t /= d) * t * ((s + 1) * t - s) + b;
		}
		Ease.easeOutBack = function(t, b, c, d) {
			var s = 1.70158;
			return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
		}
		Ease.easeInOutBack = function(t, b, c, d) {
			var s = 1.70158;
			if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
			return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
		}

		Ease.easeInBounce = function(t, b, c, d) {
			return c - this.easeOutBounce(d - t, 0, c, d) + b;
		}

		Ease.easeOutBounce = function(t, b, c, d) {
			t /= d;
			if (t < 1/2.75) {
				return c * 7.5625 * t * t + b;
			}
			
			if (t < 2/2.75) {
				t -= 1.5/2.75;
				return c * (7.5625 * t * t + 0.75) + b;
			}
			
			if (t < 2.5/2.75) {
				t -= 2.25/2.75;
				return c * (7.5625 * t * t + 0.9375) + b;
			} else {
				t -= 2.625/2.75;
				return c * (7.5625 * t * t + 0.984375) + b;
			}
		}

		Ease.easeInOutBounce = function(t, b, c, d) {
			if (t < d*0.5) {
				return (this.easeInBounce(t*2, 0, c, d)*0.5 + b);
			}
			return (this.easeOutBounce(t*2 - d, 0, c, d)*0.5 + c*0.5 + b);
		}

		const validEase = [ 
			'linear', 'easeInQuad', 'easeOutQuad', 'easeInOutQuad', 'easeInSine', 'easeOutSine', 'easeInOutSine', 'easeInExpo', 
			'easeOutExpo', 'easeInOutExpo', 'easeInCirc', 'easeOutCirc', 'easeInOutCirc', 'easeInCubic', 'easeOutCubic', 'easeInOutCubic', 
			'easeInQuart', 'easeOutQuart', 'easeInOutQuart','easeInQuint', 'easeOutQuint', 'easeInOutQuint', 'easeInElastic', 'easeOutElastic', 
			'easeInOutElastic', 'easeInBack', 'easeOutBack', 'easeInOutBack', 'easeInBounce', 'easeOutBounce', 'easeInOutBounce'
		]

		const aSound = {};

		VS.Client.aSound = aSound;
		VS.World.global.aSound = aSound;
		// For WebKit- and Blink-based browsers
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		// The audio context all audio will dervie from
		aSound.audioCtx = new AudioContext();
		// For older browser support that has this old API.
		if (!aSound.audioCtx.createGain) aSound.audioCtx.createGain = aSound.audioCtx.createGainNode;
		// Declare gain node
		aSound.gainNode = aSound.audioCtx.createGain();
		// Assign volume to gainNode
		aSound.gainNode.gain.value = normalize(MAX_VOLUME);
		// Connect gain node to speakers
		aSound.gainNode.connect(aSound.audioCtx.destination);
		// Array of sounds that are currently playing
		aSound.soundsPlaying = [];
		// Array of sounds that are currently suspended
		aSound.suspendedSounds = [];
		// Array of sounds that can be resused
		aSound.recycledSounds = [];
		// Array of sounds that are queued for playing
		aSound.queuedSoundsToPlay = [];
		// Array of sounds that are queued for fading
		aSound.queuedSoundsToFade = [];
		// An object that stores the buffer data of a sound so it does not have to be loaded each time
		aSound.loadedBuffers = {};
		// An object that stores fade information
		aSound.fader = {};
		// The master volume 
		aSound.volume = 100;
		// Whether the sound is muted
		aSound.muted = false;
		// Current state of the library
		aSound.state = null;
		// Whether or aSound has the window's focus. (Sound are suspended when the focus is lost, and resumed when its gained)
		aSound.focused = true;
		// Function to check whether this library can play a sound at a given moment.
		aSound.canPlaySound = function() {
			// API for the developer to define when a sound can and cannot be played. Any sound that tries to play while this returns false will not play
			if (VS.Client.canPlaySound && typeof(VS.Client.canPlaySound) === 'function') {
				// If their defined conditions return false, then the sound cannot be played
				if (!VS.Client.canPlaySound()) return false;
			}
			return true;
		}

		aSound.adjustVolume = function(pVolume) {
			// maybe show a GUI of the volume changing
			this.volume = clamp(pVolume, MIN_VOLUME, MAX_VOLUME);
			this.gainNode.gain.value = normalize(this.volume);
		}

		aSound.fade = function(pVolume, pDuration=5, pEase='easeOutCubic', pCallback) {
			if (isNaN(pVolume)) return;
			if (isNaN(pDuration)) return;
			if (this.state === 'fading') return;
			pVolume = clamp(pVolume, MIN_VOLUME, MAX_VOLUME);
			if (!validEase.includes(pEase)) {
				pEase = 'easeOutCubic';
				console.warn('aSound[\'fade\'] Invalid pEase value. Reverted to default.');
			}
			this.state = 'fading';
			this.fader.duration = Math.max(pDuration, 0);
			this.fader.currentIteration = 0;
			this.fader.initialValue = this.volume;
			this.fader.changeInValue = pVolume - this.fader.initialValue;
			this.fader.totalIterations = FRAME_RATE * this.fader.duration;
			this.fader.startStamp = null;
			this.fader.previousTimeStamp = null;
			// this is due to the fact the fader interval is still active, and incrementing the timestamp if the game is not focused
			// when the game is focused, we need to get the value of time that the player was away from the screen and remove it from the current timestamp.
			// the first index holds the alotted time, the second index is used to count the time, when the screen is focused, all the time from the second index gets dumped to the first, and it repeats if neccasary.
			this.fader.durationOffScreen = [0, 0];

			const self = this;
			const fadeInterval = function(pTimeStamp) {
				if (!self.focused) {
					self.fader.raf = requestAnimationFrame(fadeInterval);
					self.fader.durationOffScreen[1] = pTimeStamp - self.fader.previousTimeStamp;
					return;
				}
				if (self.fader.startStamp === null) self.fader.startStamp = pTimeStamp;
				self.adjustVolume(Ease[pEase](self.fader.currentIteration, self.fader.initialValue, self.fader.changeInValue, self.fader.totalIterations));
				if (self.fader.durationOffScreen[1]) {
					self.fader.durationOffScreen[0] += self.fader.durationOffScreen[1];
					self.fader.durationOffScreen[1] = 0;
				}			
				const elapsed = (pTimeStamp - self.fader.durationOffScreen[0]) - self.fader.startStamp;
				if (self.fader.currentIteration < self.fader.totalIterations) self.fader.currentIteration++;
				if (elapsed < self.fader.duration * 1000) {
					self.fader.previousTimeStamp = pTimeStamp;
				} else {
					cancelAnimationFrame(self.fader.raf);
					self.fader.duration = self.fader.currentIteration = self.fader.initialValue = self.fader.changeInValue = self.fader.totalIterations = self.fader.startStamp = self.fader.previousTimeStamp = self.fader.durationOffScreen = self.fader.raf = null;
					self.state = null;
					self.adjustVolume(pVolume);
					if (pCallback) pCallback();
					return;
				}
				self.fader.raf = requestAnimationFrame(fadeInterval);
			}
			this.fader.raf = requestAnimationFrame(fadeInterval);
		}

		aSound.toggleMute = function() {
			this.muted = this.muted ? false : true;
			if (this.muted) {
				this.gainNode.gain.value = 0;
			} else {
				this.gainNode.gain.value = 1;
			}
		}

		aSound.emit = function(pSoundName, pVolume=100, pStartTime=0, pEndTime, pPlaybackRate=1) {
			if (!aSound.canPlaySound()) return
			// a very cheap sound that can be used if certain conditions are met. 
			// This sound cannot be referenced and cannot be stopped or configured after creation.
			// If the buffer is loaded, this sound is eligable to play in the background
			// This sound is not going to be saved, this sound is not going to be lopped,
			// and this sound will not use any callbacks. This sound will be very lightweight and will not exist in memory
			const self = this;
			const source = self.audioCtx.createBufferSource();
			source.kill = function() {
				if (!this.buffer) {
					this.queuedToStop = true;
				} else {
					this.stop();
				}
			}
			const emitSound = function() {
				const gainNode = self.audioCtx.createGain();
				gainNode.gain.value = normalize(clamp(pVolume, MIN_VOLUME, MAX_VOLUME));
				gainNode.connect(self.gainNode);
				source.connect(gainNode);
				source.buffer = self.loadedBuffers[pSoundName];
				source.playbackRate.value = pPlaybackRate;
				if (!source.start) source.start = source.noteOn;
				source.start(0, pStartTime, (pEndTime ? pEndTime : source.buffer.duration));		
			}
			if (this.loadedBuffers[pSoundName]) {
				emitSound();
			} else {
				const request = new XMLHttpRequest();
				request.open('GET', VS.Resource.getResourcePath('sound', pSoundName));
				request.responseType = 'arraybuffer';
				request.onload = function() {
					const audioData = request.response;
					self.audioCtx.decodeAudioData(audioData).then((pDecodedData) => {
							self.loadedBuffers[pSoundName] = pDecodedData;
							// if the user wants to stop the sound before it loads, don't play it
							if (source.queuedToStop) return;
							emitSound();
						},
						(pError) => {
							console.error('Error with decoding audio data: ' + pSoundName + ' path: ' + VS.Resource.getResourcePath('sound', pSoundName));
						}
					);
				};
				request.send();
			}
			return source;
		}

		aSound.createSound = function(pSoundName, pVolume, pStartTime, pEndTime, pSave, pPlayUnfocused, pPlaybackRate, pLoop, pCallbackObject) {
			if (this.recycledSounds.length) {
				const sound = this.recycledSounds.pop();
				sound.build(pSoundName, pVolume, pStartTime, pEndTime, pSave, pPlayUnfocused, pPlaybackRate, pLoop, pCallbackObject);
				return sound;
			}
			return new Sound(pSoundName, pVolume, pStartTime, pEndTime, pSave, pPlayUnfocused, pPlaybackRate, pLoop, pCallbackObject);
		}

		aSound.stopAllSounds = function(pException) {
			// pException is a array of sounds that should not stop
			// this effectively kills all sounds in the game, and subjects them to be recycled
			for (let i = this.soundsPlaying.length - 1; i >= 0; i--) {
				const sound = this.soundsPlaying[i];
				// if the sound is not set to be saved it will be killed
				if (pException && pException?.constructor === Array && pException.includes(sound)) continue;
				sound.stop();
			}
		}

		aSound.killAllSounds = function() {
			// this effectively kills all sounds in the game, and subjects them to be recycled
			for (let i = this.soundsPlaying.length - 1; i >= 0; i--) {
				const sound = this.soundsPlaying[i];
				sound.kill();
			}
		}
		// The pFocus parameter is if this function was called automatically by the game being unfocused
		aSound.suspendAllSounds = function(pFocus) {
			for (let i = this.soundsPlaying.length - 1; i >= 0; i--) {
				const sound = this.soundsPlaying[i];
				// if this sound is set to playUnfocused then it will not be suspended automatically when the game screen is not focused
				if (pFocus && sound.getFocusStatus()) continue;
				sound.suspend();
			}
		}
		// The pFocus parameter is if this function was called automatically by the game being focused
		aSound.resumeAllSounds = function(pFocus) {
			for (let i = this.suspendedSounds.length - 1; i >= 0; i--) {
				const sound = this.suspendedSounds[i];
				sound.resume();
			}
		}

		aSound.playQueuedSounds = function() {
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

		aSound.unloadSound = function(pSoundName) {
			if (this.loadedBuffers[pSoundName]) delete this.loadedBuffers[pSoundName];
		}

		aSound.recycleSound = function(pSound) {
			if (!(pSound instanceof Sound)) return;
			pSound.kill();
		}

		class Sound {
			#soundName;
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
			#suspendedTimeStamp = 0;
			#playUnfocused;
			#fader = {};
			#stopSignal = false;
			#_loop = false;
			#_playbackRate = 1;
			#_volume = 100;
			#_info = { 'soundName': null, 'duration': null };
			constructor(pSoundName, pVolume, pStartTime, pEndTime, pSave, pPlayUnfocused, pPlaybackRate, pLoop, pCallbackObject) {
				this.build(pSoundName, pVolume, pStartTime, pEndTime, pSave, pPlayUnfocused, pPlaybackRate, pLoop, pCallbackObject);
			}

			get volume() {
				return this.#_volume;
			}

			set volume(pNewVolume) {
				this.#_volume = clamp(pNewVolume, MIN_VOLUME, MAX_VOLUME);
				if (this.#loaded) this.#gainNode.gain.value = normalize(this.#_volume);
			}

			toggleMute() {
				if (!this.#loaded || !this.#source) return;
				this.#muted = this.#muted ? false : true;
				if (this.#muted) {
					this.#gainNode.gain.value = 0;
				} else {
					this.#gainNode.gain.value = normalize(this.#_volume);
				}
			}

			get loop() {
				return this.#_loop;
			}

			set loop(pLoopValue) {
				this.#_loop = pLoopValue ? true : false;
				if (this.#source) this.#source.loop = this.#_loop;
			}

			toggleLoop() {
				this.#_loop = this.#_loop ? false : true;
				if (this.#source) this.#source.loop = this.#_loop;
			}

			get playbackRate() {
				return this.#_playbackRate;
			}

			set playbackRate(pNewPlaybackRate) {
				this.#_playbackRate = clamp(pNewPlaybackRate, 1, MAX_PLAYBACK_RATE);
				if (this.#source) this.#source.playbackRate.value = this.#_playbackRate;
			}

			set info(pNewInfo) {
				// make this variable read only basically
				this.#_info = this.#_info;
			}

			get info() {
				if (this.#loaded) {
					if (this.#source) {
						this.#_info.duration = this.#duration;
					}
					this.#_info.soundName = this.#soundName;
				} else {
					this.#_info.soundName = this.#soundName;
				}
				return this.#_info;
			}

			build(pSoundName, pVolume=100, pStartTime=0, pEndTime=0, pSave=false, pPlayUnfocused=false, pPlaybackRate=1, pLoop=false, pCallbackObject) {
				this.#soundName = pSoundName;
				this.#startTime = Math.max(pStartTime, 0);
				this.#endTime = Math.max(pEndTime, 0);
				this.#save = pLoop ? true : pSave;
				this.#_playbackRate = clamp(pPlaybackRate, 1, MAX_PLAYBACK_RATE);
				this.#playUnfocused = pPlayUnfocused ? true : false;
				this.#state = null;
				this.#_loop = pLoop ? true : false;
				this.#_volume = clamp(pVolume, MIN_VOLUME, MAX_VOLUME);
				if (pCallbackObject && pCallbackObject?.constructor === Object) {
					if (pCallbackObject.onStarted && typeof(pCallbackObject.onStarted) === 'function') this.onStarted = pCallbackObject.onStarted.bind(this);
					if (pCallbackObject.onStopped && typeof(pCallbackObject.onStopped) === 'function') this.onStopped = pCallbackObject.onStopped.bind(this);
					if (pCallbackObject.onEnded && typeof(pCallbackObject.onEnded) === 'function') this.onEnded = pCallbackObject.onEnded.bind(this);
					if (pCallbackObject.onSuspended && typeof(pCallbackObject.onSuspended) === 'function') this.onSuspended = pCallbackObject.onSuspended.bind(this);
					if (pCallbackObject.onResumed && typeof(pCallbackObject.onResumed) === 'function') this.onResumed = pCallbackObject.onResumed.bind(this);
				} else if (pCallbackObject && pCallbackObject?.constructor !== Object) {
					console.warn('aSound Library: Invalid variable type passed for pCallbackObject.');
				}
				// If this sound will use a buffer that is already stored, do not load it, there is no need, when going to play
				// this sound, it will just use the buffer data of the previous sound that had it.
				if (!aSound.loadedBuffers[this.#soundName]) {
					this.load();
				} else {
					this.#loaded = true;
				}
			}

			load() {
				const request = new XMLHttpRequest();
				const self = this;
				request.open('GET', VS.Resource.getResourcePath('sound', self.#soundName));
				request.responseType = 'arraybuffer';
				request.onload = function() {
					const audioData = request.response;
					aSound.audioCtx.decodeAudioData(audioData).then((pDecodedData) => {
							self.#loaded = true;
							aSound.loadedBuffers[self.#soundName] = pDecodedData;
							// the developer attempted to play the sound while it was still loading,
							// this has been set so that the sound will play once it's finished loading now
							if (self.#playAfterLoad) {
								// A signal to stop this sound was sent, but the sound wasn't loaded to play at that time, don't allow a sound that is signaled to stop to play
								if (self.#stopSignal) {
									self.#stopSignal = false;
									return;
								} else {
									self.play();
								}
							}
						},
						(pError) => {
							self.#loaded = false;
							console.error('Error with decoding audio data: ' + self.#soundName + ' path: ' + VS.Resource.getResourcePath('sound', self.#soundName) + ' This sound has been killed.');
							self.kill();
						}
					);
				};
				request.send();
			}

			suspend() {
				if (!this.#loaded) return;
				this.stop('suspended');
				this.#state = 'suspended';
				this.#suspendedTimeStamp = aSound.audioCtx.currentTime - this.#startedTimeStamp;
				// This sound is no longer considered to be playing, so remove it from the array
				if (aSound.soundsPlaying.includes(this)) aSound.soundsPlaying.splice(aSound.soundsPlaying.indexOf(this), 1);
				// If this sound is not apart of the suspended sounds array add it
				if (!aSound.suspendedSounds.includes(this)) aSound.suspendedSounds.push(this);
				if (this.onSuspended && typeof(this.onSuspended) === 'function') this.onSuspended();
			}

			resume() {
				if (!this.#loaded) return;
				// This sound is no longer considered to be suspended, so remove it from the array
				if (aSound.suspendedSounds.includes(this)) aSound.suspendedSounds.splice(aSound.suspendedSounds.indexOf(this), 1);
				// This sound is no longer suspended and is now playing again, add it to the playing array
				if (!aSound.soundsPlaying.includes(this)) aSound.soundsPlaying.push(this);
				// this will use the this.#suspendedTimeStamp value to resume
				this.play(true);
				this.#state = this.#fader?.raf ? 'fading' : 'playing';
				if (this.onResumed && typeof(this.onResumed) === 'function') this.onResumed();
			}

			stop(pState) {
				// The sound isn't loaded yet, but the developer wants to stop this sound, so we send out a stopSignal, so that when the sound is loaded and attempted to play, it will not play.
				if (!this.#source) {
					this.#stopSignal = true;
					return;
				}
				const wasPlaying = (this.#state === 'playing' || this.#state === 'fading' || this.#state === 'suspended') ? true : false;
				// This sound is no longer considered to be playing, so remove it from the array
				if (aSound.soundsPlaying.includes(this)) aSound.soundsPlaying.splice(aSound.soundsPlaying.indexOf(this), 1);
				if (this.#source) {
					if (!this.#source.stop) this.#source.stop = this.#source.noteOff;
					this.#source.stop();
					this.#source.disconnect();
					this.#gainNode.disconnect();
					this.#source = null;
					this.#gainNode = null;
				}
				this.#state = pState ? pState : 'stopped';
				if (this.#state === 'stopped' && wasPlaying && this.onStopped && typeof(this.onStopped) === 'function') this.onStopped();
			}

			play(pResume) {
				// A sound cannot be played if it's sound name is not referencable, 
				// a sound that is recycled has no sound information to be played
				// and if the game's API doesn't allow a sound to be played at it's current time, then it can't play.
				if (!this.#soundName || this.state === 'recycled' || !aSound.canPlaySound()) return;
				// If this sound is not loaded, it cannot be played, however there is a chance that a sound with the same buffer
				// information has been played before and stored. In this case it does not need to wait to load, it instead checks to see
				// if that buffer information is avaiable, and if it is, it allows the sound to be played with that data.
				if (!this.#loaded && !aSound.loadedBuffers[this.#soundName]) {
					this.#playAfterLoad = true;
					return;
				}
				// The game does not have focus at the moment, this sound will be automatically queued and played when the screen gets focus again if it is not already preset to play even when focus is lost
				if (!aSound.focused && !this.#playUnfocused) {
					if (!aSound.queuedSoundsToPlay.includes(this)) aSound.queuedSoundsToPlay.push(this);
					return;
				}
				// if you already have a soure and a gainNode, disconnect them and let them be garbage collected
				if (this.#source) {
					this.#source.disconnect();
					this.#gainNode.disconnect();
					this.#source = null;
					this.#gainNode = null;
				}
				if (aSound.suspendedSounds.includes(this)) aSound.suspendedSounds.splice(aSound.suspendedSounds.indexOf(this), 1);
				const source = aSound.audioCtx.createBufferSource();
				const gainNode = aSound.audioCtx.createGain();
				const self = this;
				gainNode.gain.value = normalize(this.#_volume);
				gainNode.connect(aSound.gainNode);
				source.connect(gainNode);
				// aSound.gainNode.connect(aSound.audioCtx.destination);
				source.buffer = aSound.loadedBuffers[this.#soundName];
				source.playbackRate.value = this.#_playbackRate;
				// sound.stop() calls this as well
				source.onended = function() {
					// if this sound was stopped, and it is a sound that will be saved return early
					if (self.#state === 'stopped' && self.#save) {
						return;
					} else if (self.#state === 'restart') {
						// since the sound is restarting we don't want it to fire off the `onEnded` event.
						self.play();
						return;
					} else if (self.#state === 'suspended') {
						return;
					}
					if (self.#state !== 'stopped' && self.onEnded && typeof(self.onEnded) === 'function') self.onEnded();
					if (self.#_loop) {
						self.play();
						return;
					}
					/*
						If this is a one use sound, it will be recycled or killed.
						A developer may still hold a reference to this sound but will not be able to do anything to it.
						If you are using a one use sound, it is best to play a sound on its creation without storing it.
						aSound.createSound('soundName', volume, startTime, endTime, playrate, loop).play()
					*/
					if (!self.#save) self.kill();
				};
				this.#source = source;
				this.#gainNode = gainNode;
				this.#duration = source.buffer.duration;
				this.#playAfterLoad = null;
				if (!source.start) source.start = source.noteOn;
				source.start(0, (this.#suspendedTimeStamp ? this.#suspendedTimeStamp * this.#_playbackRate: this.#startTime), this.#endTime ? this.#endTime : this.#duration);
/* 				
				// This works, however it is commented out because manually looping is alot easier to do, and easier to stuff callbacks into it when done manually.
				source.loop = this.#_loop;
				source.loopStart = this.#startTime;
				source.loopEnd = this.#endTime ? this.#endTime : source.buffer.duration; 
*/
				this.#state = 'playing';
				this.#startedTimeStamp = aSound.audioCtx.currentTime - (this.#suspendedTimeStamp ? this.#suspendedTimeStamp : this.#startTime);
				this.#suspendedTimeStamp = 0;
				if (!aSound.soundsPlaying.includes(this)) aSound.soundsPlaying.push(this);
				if (!pResume && this.onStarted && typeof(this.onStarted) === 'function') this.onStarted();
			}

			restart() {
				this.stop('restart');
			}

			getFocusStatus() {
				return this.#playUnfocused ? true : false;
			}

			kill() {
				this.#wipe();
				if (aSound.recycledSounds.length < MAX_RECYCLED_SOUNDS)  {
					aSound.recycledSounds.push(this);
				} else {
					// remove all properties from this sound object, since it no longer will be used.
					// any references to this should be removed so that it can be garbage collected
					for (const variable in this) delete this[variable];
				}
			}

			#wipe() {
				this.onStarted = null;
				this.onStopped = null;
				this.onEnded = null;
				this.onSuspended = null;
				this.onResumed = null;
				this.stop('wipe');
				cancelAnimationFrame(this.#fader?.raf);
				if (this.#source) {
					this.#source.disconnect();
					this.#gainNode.disconnect();
				}
				this.#soundName = null;
				this.#startTime = null;
				this.#endTime = null;
				this.#save = null;
				this.#duration = null;
				this.#_playbackRate = 1;
				this.#source = null;
				this.#gainNode = null;
				this.#loaded = false;
				this.#playAfterLoad = null;
				this.#state = 'recycled';
				this.#startedTimeStamp = null;
				this.#suspendedTimeStamp = 0;
				this.#playUnfocused = null;
				this.#fader.duration = this.#fader.currentIteration = this.#fader.initialValue = this.#fader.changeInValue = this.#fader.totalIterations = this.#fader.startStamp = this.#fader.previousTimeStamp = this.#fader.durationOffScreen = this.#fader.queue = this.#fader.raf = null;
				this.#stopSignal = false;
				this.#_loop = false;
				this.#_volume = 100;
				this.#_info.soundName = this.#_info.duration = null;
				if (aSound.soundsPlaying.includes(this)) aSound.soundsPlaying.splice(aSound.soundsPlaying.indexOf(this), 1);
				if (aSound.suspendedSounds.includes(this)) aSound.suspendedSounds.splice(aSound.suspendedSounds.indexOf(this), 1);
				if (aSound.queuedSoundsToPlay.includes(this)) aSound.queuedSoundsToPlay.splice(aSound.queuedSoundsToPlay.indexOf(this), 1);
				if (aSound.queuedSoundsToFade.includes(this)) aSound.queuedSoundsToFade.splice(aSound.queuedSoundsToFade.indexOf(this), 1);
			}

			#getCurrentTime() {
				if (this.#suspendedTimeStamp) {
					return this.#suspendedTimeStamp * this.#_playbackRate;
				} else if (this.#startedTimeStamp) {
					return aSound.audioCtx.currentTime - this.#startedTimeStamp;
				} else {
					return 0;
				}
			}

			fade(pVolume, pDuration=5, pEase='easeOutCubic', pCallback) {
				if (isNaN(pVolume)) return;
				if (isNaN(pDuration)) return;
				// if a sound is not playing, it cannot be faded.
				if (this.#state !== 'playing' && aSound.focused) return;
				// The game does not have focus at the moment, this sound will be automatically queued and faded when the screen gets focus again if it is not already preset to play/fade even when the screen has no focus
				if (!aSound.focused && !this.#playUnfocused) {
					// if this sound is already queued to fade, then just exit out
					if (aSound.queuedSoundsToFade.includes(this)) return;
					this.#fader.queue = {
						'volume': pVolume,
						'duration': pDuration,
						'ease': pEase,
						'callback': pCallback
					}
					aSound.queuedSoundsToFade.push(this);
					return;
				}
				if (!validEase.includes(pEase)) {
					pEase = 'easeOutCubic';
					console.warn('aSound: Invalid pEase value. Reverted to default.');
				}
				// get rid of the queue information if it exists, it is no longer needed
				if (this.#fader.queue) this.#fader.queue = null;
				pVolume = clamp(pVolume, MIN_VOLUME, MAX_VOLUME);
				this.#fader.duration = Math.max(pDuration, 0);
				this.#fader.currentIteration = 0;
				this.#fader.initialValue = this.#_volume;
				this.#fader.changeInValue = pVolume - this.#fader.initialValue;
				this.#fader.totalIterations = FRAME_RATE * this.#fader.duration;
				this.#fader.startStamp = null;
				this.#fader.previousTimeStamp = null;
				// this is due to the fact the fader interval is still active, and incrementing the timestamp if the game is not focused
				// when the game is focused, we need to get the value of time that the player was away from the screen and remove it from the current timestamp.
				// the first index holds the alotted time, the second index is used to count the time, when the screen is focused, all the time from the second index gets dumped to the first, and it repeats if neccasary.
				this.#fader.durationOffScreen = [0, 0];
				this.#state = 'fading';

				const self = this;
				const fadeInterval = function(pTimeStamp) {
					if (!aSound.focused) {
						self.#fader.raf = requestAnimationFrame(fadeInterval);
						self.#fader.durationOffScreen[1] = pTimeStamp - self.#fader.previousTimeStamp;
						return;
					}
					if (self.#fader.startStamp === null) self.#fader.startStamp = pTimeStamp;
					self.volume = Ease[pEase](self.#fader.currentIteration, self.#fader.initialValue, self.#fader.changeInValue, self.#fader.totalIterations);
					if (self.#fader.durationOffScreen[1]) {
						self.#fader.durationOffScreen[0] += self.#fader.durationOffScreen[1];
						self.#fader.durationOffScreen[1] = 0;
					}
					const elapsed = (pTimeStamp - self.#fader.durationOffScreen[0]) - self.#fader.startStamp;
					if (self.#fader.currentIteration < self.#fader.totalIterations) self.#fader.currentIteration++;
					if (elapsed < self.#fader.duration * 1000) {
						self.#fader.previousTimeStamp = pTimeStamp;
					} else {
						cancelAnimationFrame(self.#fader.raf);
						self.#fader.duration = self.#fader.currentIteration = self.#fader.initialValue = self.#fader.changeInValue = self.#fader.totalIterations = self.#fader.startStamp = self.#fader.previousTimeStamp = self.#fader.durationOffScreen = self.#fader.queue = self.#fader.raf = null;
						// when a sound is faded down to `0` or any other value. Just because it may be muted, does not mean it is stopped. 
						// the state of the sound is still considered to be playing after its done fading
						self.#state = 'playing';						
						self.volume = pVolume;
						if (pCallback) pCallback();
						return;
					}
					self.#fader.raf = requestAnimationFrame(fadeInterval);
				}
				this.#fader.raf = requestAnimationFrame(fadeInterval);
			}

			queuedFade() {
				if (this.#fader.queue) this.fade(this.#fader.queue.volume, this.#fader.queue.duration, this.#fader.queue.ease, this.#fader.queue.callback);
			}
		}
		
		const resumeAudioCtx = () => {
			const removeEvents = () => {
				aSound.ready = true;
				window.removeEventListener('mousedown', resumeAudioCtx);
				window.removeEventListener('touchstart', resumeAudioCtx);
			}
			// this will start playing sounds that were initially blocked by not having a user gesture.
			if (aSound.audioCtx.state !== 'running') {
				aSound.audioCtx.resume().then(() => {
					console.log('aSound: autostart attempt of audio context worked.');
				},
				() => {
					console.warn('aSound: autostart attempt of audio context failed.');
				});
			}
			removeEvents();
		}

		window.addEventListener('mousedown', resumeAudioCtx);
		window.addEventListener('touchstart', resumeAudioCtx);

		if (!VS.Client._aSoundOnWindowBlurSet) {
			VS.Client._aSoundOnWindowBlur = VS.Client.onWindowBlur;
			VS.Client._aSoundOnWindowBlurSet = true;
			VS.Client.onWindowBlur = function() {
				aSound.focused = false;
				if (aSound.soundsPlaying.length) aSound.suspendAllSounds(true);
				if (this._aSoundOnWindowBlur) this._aSoundOnWindowBlur.apply(this, arguments);
			}
		}

		if (!VS.Client._aSoundOnWindowFocusSet) {
			VS.Client._aSoundOnWindowFocus = VS.Client.onWindowFocus;
			VS.Client._aSoundOnWindowFocusSet = true;
			VS.Client.onWindowFocus = function() {
				aSound.focused = true;
				if (aSound.suspendedSounds.length) aSound.resumeAllSounds(true);
				if (aSound.queuedSoundsToPlay.length || aSound.queuedSoundsToFade.length) aSound.playQueuedSounds();
				if (this._aSoundOnWindowFocus) this._aSoundOnWindowFocus.apply(this, arguments);
			}
		}

		if (!VS.Client._aSoundOnDisconnectSet) {
			VS.Client._aSoundOnDisconnect = VS.Client.onDisconnect;
			VS.Client._aSoundOnDisconnectSet = true;
			VS.Client.onDisconnect = function() {
				aSound.stopAllSounds();
				if (this._aSoundOnDisconnect) this._aSoundOnDisconnect.apply(this, arguments);
			}
		}

		const _onNew = VS.World.onNew;
		VS.World.onNew = function() {
			resumeAudioCtx();
			if (_onNew) _onNew.apply(this, arguments);
		}

		const _onDel = VS.World.onDel;
		VS.World.onDel = function() {
			aSound.stopAllSounds();
			if (_onDel) _onDel.apply(this, arguments);
		}
	}
})();

#END JAVASCRIPT
#END CLIENTCODE
