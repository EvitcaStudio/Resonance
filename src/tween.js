/**
* Class for creating a tweening animation
* @class Tween  
* @license
* Tween does not have a license at this time.
* For licensing contact the author
* @author https://github.com/doubleactii
* Copyright (c) 2023 Evitca Studio
*/
export class Tween {
    /**
     * @param {Object} [pOtions={}] - The options for the tween animation
     * @param {Object} [pOtions.start={}] - The starting properties of the animation
     * @param {Object} [pOtions.end={}] - The end properties of the animation
     * @param {number} [pOtions.duration=1000] - The duration of the animation in milliseconds
     * @param {string} [pOtions.easing="linear"] - The easing function to use for the animation
     */
    constructor({ start = {}, end = {}, duration = 1000, easing = Tween.linear } = {}) {
        this._build(start, end, duration, easing);
    }

    // Robert Penner's easing functions
    static linear(t, b, c, d) {
        return c * t / d + b;
    }
    static easeInQuad(t, b, c, d) {
        return c * (t /= d) * t + b;
    }
    static easeOutQuad(t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b;
    }
    static easeInOutQuad(t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t + b;
        return -c / 2 * ((--t) * (t - 2) - 1) + b;
    }
    static easeInSine(t, b, c, d) {
        return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
    }
    static easeOutSine(t, b, c, d) {
        return c * Math.sin(t / d * (Math.PI / 2)) + b;
    }
    static easeInOutSine(t, b, c, d) {
        return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
    }
    static easeInExpo(t, b, c, d) {
        return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
    }
    static easeOutExpo(t, b, c, d) {
        return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
    }
    static easeInOutExpo(t, b, c, d) {
        if (t == 0) return b;
        if (t == d) return b + c;
        if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
        return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
    }
    static easeInCirc(t, b, c, d) {
        return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
    }
    static easeOutCirc(t, b, c, d) {
        return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
    }
    static easeInOutCirc(t, b, c, d) {
        if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
        return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
    }
    static easeInCubic(t, b, c, d) {
        return c * (t /= d) * t * t + b;
    }
    static easeOutCubic(t, b, c, d) {
        return c * ((t = t / d - 1) * t * t + 1) + b;
    }
    static easeInOutCubic(t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t + 2) + b;
    }
    static easeInQuart(t, b, c, d) {
        return c * (t /= d) * t * t * t + b;
    }
    static easeOutQuart(t, b, c, d) {
        return -c * ((t = t / d - 1) * t * t * t - 1) + b;
    }
    static easeInOutQuart(t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
        return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
    }
    static easeInQuint(t, b, c, d) {
        return c * (t /= d) * t * t * t * t + b;
    }
    static easeOutQuint(t, b, c, d) {
        return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
    }
    static easeInOutQuint(t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
    }
    static easeInElastic(t, b, c, d) {
        var s = 1.70158;
        var p = 0;
        var a = c;
        if (t == 0) return b;
        if ((t /= d) == 1) return b + c;
        if (!p) p = d * .3;
        if (a < Math.abs(c)) {
            a = c;
            var s = p / 4;
        } else {
			// Handle the Math.asin(0 / 0) case
			if (c === 0 && a === 0) {
				s = p / (2 * Math.PI) * Math.asin(1);
			} else {
				var s = p / (2 * Math.PI) * Math.asin(c / a);
			}
		}
        return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    }
    static easeOutElastic(t, b, c, d) {
        var s = 1.70158;
        var p = 0;
        var a = c;
        if (t == 0) return b;
        if ((t /= d) == 1) return b + c;
        if (!p) p = d * .3;
        if (a < Math.abs(c)) {
            a = c;
            var s = p / 4;
        } else {
			// Handle the Math.asin(0 / 0) case
			if (c === 0 && a === 0) {
				s = p / (2 * Math.PI) * Math.asin(1);
			} else {
				var s = p / (2 * Math.PI) * Math.asin(c / a);
			}
		}
        return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
    }
    static easeInOutElastic(t, b, c, d) {
        var s = 1.70158;
        var p = 0;
        var a = c;
        if (t == 0) return b;
        if ((t /= d / 2) == 2) return b + c;
        if (!p) p = d * (.3 * 1.5);
        if (a < Math.abs(c)) {
            a = c;
            var s = p / 4;
        } else {
			// Handle the Math.asin(0 / 0) case
			if (c === 0 && a === 0) {
				s = p / (2 * Math.PI) * Math.asin(1);
			} else {
				var s = p / (2 * Math.PI) * Math.asin(c / a);
			}
		}
        if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
    }
    static easeInBack(t, b, c, d) {
        var s = 1.70158;
        return c * (t /= d) * t * ((s + 1) * t - s) + b;
    }
    static easeOutBack(t, b, c, d) {
        var s = 1.70158;
        return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
    }
    static easeInOutBack(t, b, c, d) {
        var s = 1.70158;
        if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
        return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
    }

    static easeInBounce(t, b, c, d) {
        return c - this.easeOutBounce(d - t, 0, c, d) + b;
    }

    static easeOutBounce(t, b, c, d) {
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

    static easeInOutBounce(t, b, c, d) {
        if (t < d*0.5) {
            return (this.easeInBounce(t*2, 0, c, d)*0.5 + b);
        }
        return (this.easeOutBounce(t*2 - d, 0, c, d)*0.5 + c*0.5 + b);
    }
	/**
	 * @param {number} pNumber - The number to clamp
	 * @param {number} pMin - The minimum number 
	 * @param {number} pMax - The maximum number
	 * @returns {number} The number clamped between the minimum and maximum values
	 */
	static _clamp(pNumber, pMin = 0, pMax = 1) {
		return Math.max(pMin, Math.min(pNumber, pMax));
	}
	/**
	 * Converts an Hex color value to an array of [r, g, b].
	 *
	 * @private
	 * @param {string} pHex - The Hex color in the form "#fff" or "#ffffff" or tagless.
	 * @return {Array} The array [r, g, b].
	 */
	static _hexToRgb(pHex) {
		pHex = pHex.replace('#', '');
		if (pHex.length === 3) {
			pHex = pHex.replace(new RegExp('(.)', 'g'), '$1$1');
		}
		pHex = pHex.match(new RegExp('..', 'g'));
		const r = Tween._clamp(parseInt(pHex[0], 16), 0, 255);
		const g = Tween._clamp(parseInt(pHex[1], 16), 0, 255);
		const b = Tween._clamp(parseInt(pHex[2], 16), 0, 255);
		return [r, g, b];
	}
	/**
	 * Converts an array of [r, g, b] to an Hex color code.
	 * 
	 * @private
	 * @param {Array} pColorArray - The rgb color array to convert into a hex
	 * return {string} The hex color
	 */
	static _rgbToHex(pColorArray) {
		if (Array.isArray(pColorArray)) {
			return '#' + pColorArray.map((pColor) => Math.abs(Math.round(pColor)).toString(16).padStart(2, '0')).join('');
		}
	}
    /**
     * Builds/Rebuilds the tween object with new info
     * @param {Object} pStart - The start object containing the start values
     * @param {Object} pEnd - The end object containing the end values
     * @param {number} pDuration -  The duration of the effect
     * @param {function} pEasing - The easing function to use
     */
    _build(pStart, pEnd, pDuration, pEasing) {
        this.start = pStart;
        this.end = pEnd;
        this.duration = pDuration;
        this.easing = typeof(pEasing) === 'function' ? pEasing : Tween.linear;
        this.events = {};
        this.tweening = false;
        this.update = null;
        this.paused = false;
		this.lastTime = 0;
        this.elapsed = 0;
    }
    /**
     * @param {Object} [pOtions={}] - The options for the tween animation
     * @param {Object} [pOtions.start={}] - The starting properties of the animation
     * @param {Object} [pOtions.end={}] - The end properties of the animation
     * @param {number} [pOtions.duration=1000] - The duration of the animation in milliseconds
     * @param {string} [pOtions.easing="linear"] - The easing function to use for the animation
     */
    build({ start = {}, end = {}, duration = 1000, easing = Tween.linear } = {}) {
        this._build(start, end, duration, easing);
        return this;
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
     * Update each frame.
     */
    animationFrame = () => {
        if (!this.tweening || this.paused) return;
		const now = performance.now();
		if (!this.lastTime) this.lastTime = now;
        this.elapsed += now - this.lastTime;
        let progress = this.elapsed / this.duration;
        
        if (this.oscillating) {
            progress = (1 - Math.cos(progress * Math.PI)) / 2;
        }
        
        if (progress > 1) {
            progress = 1;
        }

        let currentValues = {};
		for (let key in this.end) {
			let startValue = this.start[key];
			let endValue = this.end[key];
			if (typeof(startValue) === "string" && (startValue.length === 3 || startValue.length === 6) || startValue.length === 4 || startValue.length === 7) {
				startValue = Tween._hexToRgb(startValue);
				endValue = Tween._hexToRgb(endValue);
				const currentRGB = [
					this.easing(progress, startValue[0], endValue[0] - startValue[0], 1),
					this.easing(progress, startValue[1], endValue[1] - startValue[1], 1),
					this.easing(progress, startValue[2], endValue[2] - startValue[2], 1)
				];
				currentValues[key] = Tween._rgbToHex(currentRGB);
			} else {
				currentValues[key] = this.easing(progress, startValue, endValue - startValue, 1);
			}
		}

        this.update(currentValues);

        if (progress === 1 && !this.oscillating) {
            this.stop();
            if (this.events.end) {
                this.events.end();
            }
        } else {
            requestAnimationFrame(this.animationFrame);
        }
		this.lastTime = now;
    }
    /**
     * Animates the tween by oscillating between the start and end properties.
     * @param {function} pUpdate - A callback function to update the values during the oscillation.
     * @param {boolean} [pOscillate=false] - A flag to indicate if the tween should oscillate.
     * @return {Tween} - Returns the Tween instance for method chaining.
     */
    animate(pUpdate, pOscillate = false) {
        if (typeof(pUpdate) !== "function") {
            console.error("The pUpdate parameter passed to animate is not a function.");
            return;
        }
        if (this.tweening) return;
        let startProperties = Object.keys(this.start);
        let endProperties = Object.keys(this.end);

        if (!startProperties.length || !endProperties.length) {
            console.error("The start object or the end object has no properties.");
            return;
        }

        if (!startProperties.every(prop => endProperties.includes(prop))) {
            console.error("The end object is missing properties that the start object has.");
            return;
        }

        this.update = pUpdate;
        this.tweening = true;
		this.elapsed = 0;
        this.oscillating = pOscillate;

        if (this.events.start) {
            this.events.start();
        }
        requestAnimationFrame(this.animationFrame);
        return this;
    }
    /**
     * Resumes the tween animation
     * @returns {Tween} The instance of the Tween object
     */
    resume() {
        if (this.paused) {
            this.lastTime = performance.now();
            this.paused = false;
            if (this.events.resume) {
                this.events.resume();
            }
            requestAnimationFrame(this.animationFrame);
        }
        return this;
    }
    /**
     * Pauses the tween animation
     * @returns {Tween} The instance of the Tween object
     */
    pause() {
        if (!this.paused) {
            this.paused = true;
            if (this.events.pause) {
                this.events.pause();
            }
        }
        return this;
    }
    /**
     * Stops the tween and clears all data.
     */
    stop() {
        this.tweening = false;
        this.oscillating = false;
        this.update = null;
        this.elapsed = 0;
		this.lastTime = 0;
        this.paused = false;
    }
}