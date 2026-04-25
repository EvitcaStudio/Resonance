import { Sound } from "./sound.js";
import { Resonance, ResonanceSingleton } from "./resonance.js";

/**
 * A class for sounds that have a position in space.
 * Uses PannerNode for spatial audio and distance-based volume.
 * 
 * @class PositionalSound
 * @extends Sound
 */
class PositionalSound extends Sound {
    panner: PannerNode;
    _x: number = 0;
    _y: number = 0;
    _z: number = 0;

    _refDistance: number = 1;
    _rolloffFactor: number = 1;
    _maxDistance: number = 10000;

    /**
     * @param {string} pSoundPath - The path of the sound file
     * @param {number} pVolume - The volume of the sound
     * @param {number} pStartTime - The start time of this sound (to play a clipped version)
     * @param {number} pEndTime - The end time of this sound (to play a clipped version)
     * @param {boolean} pSave - Whether to save this sound, or recycle it when it's completed
     * @param {boolean} pPlayUnfocused - If this sound is set to true then it will not be paused automatically when the game screen is not focused
     * @param {number} pPlaybackRate - The rate at which the sound is played, Higher numbers for faster playback (MAX 10)
     * @param {boolean} pLoop - Whether this sound should loop or not
     * @param {number} [pRefDistance=1] - The reference distance for the sound
     * @param {number} [pRolloffFactor=1] - The rolloff factor for the sound
     * @param {number} [pMaxDistance=10000] - The maximum distance for the sound
     * @returns {PositionalSound} - A positional sound object
     */
    constructor(pSoundPath?: string, pVolume?: number, pStartTime?: number, pEndTime?: number, pSave?: boolean, pPlayUnfocused?: boolean, pPlaybackRate?: number, pLoop?: boolean, pRefDistance: number = 1, pRolloffFactor: number = 1, pMaxDistance: number = 10000) {
        super(pSoundPath, pVolume, pStartTime, pEndTime, pSave, pPlayUnfocused, pPlaybackRate, pLoop);
        this.panner = Resonance.audioCtx.createPanner();
        
        // Default settings for 2D/3D spatialization
        this.panner.panningModel = 'HRTF';
        this.panner.distanceModel = 'inverse';
        this.refDistance = pRefDistance;
        this.rolloffFactor = pRolloffFactor;
        this.maxDistance = pMaxDistance;
    }

    /**
     * Sets the position of the sound in 3D space.
     * @param {number} x - The x position
     * @param {number} y - The y position
     * @param {number} [z=0] - The z position
     * @returns {this} This sound instance
     */
    setPosition(x: number, y: number, z: number = 0): this {
        this._x = x;
        this._y = y;
        this._z = z;
        this.updatePanner();
        return this;
    }

    /**
     * Resets this sound to default state or builds it with new parameters.
     * 
     * @param {string} pSoundPath - The path of the sound file
     * @param {number} pVolume - The volume of the sound
     * @param {number} pStartTime - The start time of this sound (to play a clipped version)
     * @param {number} pEndTime - The end time of this sound (to play a clipped version)
     * @param {boolean} pSave - Whether to save this sound, or recycle it when it's completed
     * @param {boolean} pPlayUnfocused - If this sound is set to true then it will not be paused automatically when the game screen is not focused
     * @param {number} pPlaybackRate - The rate at which the sound is played, Higher numbers for faster playback (MAX 10)
     * @param {boolean} pLoop - Whether this sound should loop or not
     * @param {number} [pRefDistance=1] - The reference distance for the sound
     * @param {number} [pRolloffFactor=1] - The rolloff factor for the sound
     * @param {number} [pMaxDistance=10000] - The maximum distance for the sound
     * @returns {this} This sound instance
     */
    build(pSoundPath?: string, pVolume: number = 100, pStartTime: number = 0, pEndTime: number = 0, pSave: boolean = false, pPlayUnfocused: boolean = false, pPlaybackRate: number = 1, pLoop: boolean = false, pRefDistance: number = 1, pRolloffFactor: number = 1, pMaxDistance: number = 10000): this {
        super.build(pSoundPath, pVolume, pStartTime, pEndTime, pSave, pPlayUnfocused, pPlaybackRate, pLoop);
        this.refDistance = pRefDistance;
        this.rolloffFactor = pRolloffFactor;
        this.maxDistance = pMaxDistance;
        return this;
    }

    /**
     * The reference distance for the sound.
     * Within this distance, the sound is at its maximum volume.
     * @type {number}
     */
    get refDistance() { return this._refDistance; }
    set refDistance(val: number) {
        this._refDistance = val;
        if (this.panner) {
            this.panner.refDistance = val;
        }
    }

    /**
     * The rolloff factor for the sound.
     * Higher values cause the volume to drop off more rapidly with distance.
     * @type {number}
     */
    get rolloffFactor() { return this._rolloffFactor; }
    set rolloffFactor(val: number) {
        this._rolloffFactor = val;
        if (this.panner) {
            this.panner.rolloffFactor = val;
        }
    }

    /**
     * The maximum distance for the sound.
     * Beyond this distance, the sound will be silent.
     * @type {number}
     */
    get maxDistance() { return this._maxDistance; }
    set maxDistance(val: number) {
        this._maxDistance = val;
        if (this.panner) {
            this.panner.maxDistance = val;
        }
    }

    /**
     * Stops the sound and disconnects the panner.
     * @param {string} [pState] - Current state of the sound
     * @returns {this} This sound instance
     */
    stop(pState?: string): this {
        super.stop(pState);
        if (this.panner) {
            this.panner.disconnect();
        }
        return this;
    }

    /**
     * Resets the sound and disconnects the panner.
     */
    wipe(): void {
        super.wipe();
        if (this.panner) {
            this.panner.disconnect();
        }
    }

    /**
     * The x position of the sound.
     * @type {number}
     */
    get x() { return this._x; }
    set x(val: number) {
        this._x = val;
        this.updatePanner();
    }

    /**
     * The y position of the sound.
     * @type {number}
     */
    get y() { return this._y; }
    set y(val: number) {
        this._y = val;
        this.updatePanner();
    }

    /**
     * The z position of the sound.
     * @type {number}
     */
    get z() { return this._z; }
    set z(val: number) {
        this._z = val;
        this.updatePanner();
    }

    /**
     * Updates the PannerNode with the current position.
     */
    updatePanner(): void {
        const now = Resonance.audioCtx.currentTime;
        if (this.panner.positionX) {
            this.panner.positionX.setTargetAtTime(this._x, now, 0.1);
            this.panner.positionY.setTargetAtTime(this._y, now, 0.1);
            this.panner.positionZ.setTargetAtTime(this._z, now, 0.1);
        } else {
            // Older browser support
            (this.panner as any).setPosition(this._x, this._y, this._z);
        }
    }

    /**
     * Overrides base connection to include the PannerNode.
     * Chain: source -> gainNode -> panner -> Resonance.gainNode
     */
    connectNodes(): void {
        if (!this.source || !this.gainNode) return;
        this.source.connect(this.gainNode);
        this.gainNode.connect(this.panner);
        this.panner.connect(Resonance.gainNode);
        Resonance.gainNode.connect(Resonance.audioCtx.destination);
    }
}

export { PositionalSound };
