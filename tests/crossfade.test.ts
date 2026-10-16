import { afterEach, expect, spyOn, test } from 'bun:test';
import { crossfade, type CrossfadeHandle } from '../src/crossfade';

const handles: CrossfadeHandle[] = [];
afterEach(() => { for (const handle of handles.splice(0)) handle.cancel(); });
function fixture() {
    const listeners = new Set<() => void>();
    const context = { currentTime: 0, state: 'running',
        addEventListener(_name: string, listener: () => void) { listeners.add(listener); },
        removeEventListener(_name: string, listener: () => void) { listeners.delete(listener); },
    };
    const gain = (value: number) => ({ gain: { value, curve: null as Float32Array | null,
        cancelScheduledValues() { this.curve = null; },
        setValueAtTime(value: number) { this.value = value; },
        setValueCurveAtTime(curve: Float32Array, start: number, duration: number) {
            Object.assign(this, { curve, start, duration });
        },
    } });
    const from = gain(.25), to = gain(0);
    const start = (options = {}) => {
        const handle = crossfade(context as any, from as any, to as any, { volume: .25, ...options });
        handles.push(handle); return handle;
    };
    return { context, from, to, start, listeners,
        advance(time: number, state = 'running') {
            context.currentTime = time; context.state = state;
            for (const listener of [...listeners]) listener();
        },
    };
}

test('native gain curves are simultaneous and equal-power', () => {
    const f = fixture(); f.start();
    expect(f.from.gain.curve).toHaveLength(65);
    expect(f.to.gain.curve).toHaveLength(65);
    expect(f.from.gain.curve![0]).toBe(.25);
    expect(f.to.gain.curve![0]).toBe(0);
    expect(f.from.gain.curve![32]).toBeCloseTo(.25 / Math.sqrt(2));
    expect(f.to.gain.curve![32]).toBeCloseTo(.25 / Math.sqrt(2));
    expect(f.to.gain.curve![64]).toBe(.25);
});

test('audio completion sets exact final gains and removes listeners', async () => {
    const f = fixture(), handle = f.start();
    f.advance(.65); await handle.finished;
    expect(f.from.gain.value).toBe(0); expect(f.to.gain.value).toBe(.25);
    expect(f.listeners.size).toBe(0);
});

test('cancellation holds intermediate levels for a smooth reversed fade', async () => {
    const f = fixture(), handle = f.start();
    f.context.currentTime = .325; handle.cancel(); await handle.finished;
    expect(f.from.gain.value).toBeCloseTo(.25 / Math.sqrt(2));
    expect(f.to.gain.value).toBeCloseTo(.25 / Math.sqrt(2));
    const reversed = crossfade(f.context as any, f.to as any, f.from as any, { volume: .25 });
    handles.push(reversed);
    expect(f.from.gain.curve![0]).toBeCloseTo(.25 / Math.sqrt(2));
    expect(f.to.gain.curve![0]).toBeCloseTo(.25 / Math.sqrt(2));
    f.advance(.976); await reversed.finished;
    expect(f.from.gain.value).toBe(.25); expect(f.to.gain.value).toBe(0);
});

test('wall-time timeout cannot finish a suspended audio fade', async () => {
    let timer: () => void = () => {};
    const clock = spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void) => { timer = fn; return 1; }) as any);
    try {
        const f = fixture(), handle = f.start();
        let finished = false; void handle.finished.then(() => { finished = true; });
        f.advance(.2, 'suspended'); timer(); await Promise.resolve();
        expect(finished).toBe(false);
        f.advance(.2); expect(finished).toBe(false);
        f.advance(.65); await handle.finished;
        expect(finished).toBe(true);
    } finally { clock.mockRestore(); }
});

test('zero duration, same gain, and invalid parameters are safe', async () => {
    const f = fixture(); await f.start({ durationMS: 0 }).finished;
    expect(f.to.gain.value).toBe(.25); expect(f.from.gain.value).toBe(0);
    await crossfade(f.context as any, f.to as any, f.to as any).finished;
    expect(f.to.gain.value).toBe(.25);
    expect(() => f.start({ durationMS: -1 })).toThrow(RangeError);
    expect(() => f.start({ volume: NaN })).toThrow(RangeError);
});

test('closing the audio context cancels and releases the completion promise', async () => {
    const f = fixture(), handle = f.start();
    f.advance(.1, 'closed'); await handle.finished;
    expect(f.listeners.size).toBe(0);
});
