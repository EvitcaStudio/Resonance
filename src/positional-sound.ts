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

    constructor(pSoundPath?: string, pVolume?: number, pStartTime?: number, pEndTime?: number, pSave?: boolean, pPlayUnfocused?: boolean, pPlaybackRate?: number, pLoop?: boolean) {
        super(pSoundPath, pVolume, pStartTime, pEndTime, pSave, pPlayUnfocused, pPlaybackRate, pLoop);
        this.panner = Resonance.audioCtx.createPanner();
        
        // Default settings for 2D/3D spatialization
        this.panner.panningModel = 'HRTF';
        this.panner.distanceModel = 'inverse';
        this.panner.refDistance = 1;
        this.panner.maxDistance = 10000;
        this.panner.rolloffFactor = 1;
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

    get x() { return this._x; }
    set x(val: number) {
        this._x = val;
        this.updatePanner();
    }

    get y() { return this._y; }
    set y(val: number) {
        this._y = val;
        this.updatePanner();
    }

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
