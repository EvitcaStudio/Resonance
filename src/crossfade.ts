export interface CrossfadeOptions {
    /** Fade time in milliseconds, measured on the audio clock. */
    durationMS?: number;
    /** Destination gain (0–1), before master volume. Defaults to 1. */
    volume?: number;
}

export interface CrossfadeHandle {
    /** Resolves after completion or cancellation. Sources remain caller-owned. */
    finished: Promise<void>;
    /** Hold both gains at their current levels and cancel pending completion. */
    cancel(): void;
}

/** Equal-power gain automation without animation frames or ownership of sources. */
export function crossfade(context: AudioContext, from: GainNode | null, to: GainNode | null,
    options: CrossfadeOptions = {}): CrossfadeHandle {
    const durationMS = options.durationMS ?? 650;
    const volume = options.volume ?? 1;
    if (!Number.isFinite(durationMS) || durationMS < 0 || !Number.isFinite(volume) || volume < 0 || volume > 1) {
        throw new RangeError('Crossfade duration must be nonnegative and volume must be between 0 and 1.');
    }
    if (from === to) return { finished: Promise.resolve(), cancel() {} };
    const start = context.currentTime;
    const duration = durationMS / 1000;
    const outgoing = from?.gain.value ?? 0;
    const incoming = to?.gain.value ?? 0;
    let done = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let resolve!: () => void;
    const finished = new Promise<void>(finish => { resolve = finish; });
    const level = (initial: number, target: number, progress: number) =>
        Math.sqrt((initial * Math.cos(progress * Math.PI / 2)) ** 2 +
            (target * Math.sin(progress * Math.PI / 2)) ** 2);
    const hold = (node: GainNode | null, value: number) => {
        if (!node) return;
        node.gain.cancelScheduledValues(0);
        node.gain.setValueAtTime(value, context.currentTime);
    };
    const finish = (cancelled: boolean) => {
        if (done) return;
        done = true;
        if (timer !== undefined) clearTimeout(timer);
        context.removeEventListener('statechange', schedule);
        const progress = duration === 0 ? 1 : Math.min(1, Math.max(0, (context.currentTime - start) / duration));
        hold(from, cancelled ? level(outgoing, 0, progress) : 0);
        hold(to, cancelled ? level(incoming, volume, progress) : volume);
        resolve();
    };
    const schedule = () => {
        if (done) return;
        if (timer !== undefined) clearTimeout(timer);
        timer = undefined;
        if (context.state === 'closed') { finish(true); return; }
        const remaining = start + duration - context.currentTime;
        if (remaining <= 0) { finish(false); return; }
        // Suspended audio must not finish its fade on wall time.
        if (context.state === 'running') timer = setTimeout(schedule, Math.max(1, remaining * 1000));
    };
    for (const [node, initial, target] of [[from, outgoing, 0], [to, incoming, volume]] as const) {
        if (!node) continue;
        hold(node, initial);
        if (duration > 0) {
            const curve = Float32Array.from({ length: 65 }, (_, index) => level(initial, target, index / 64));
            node.gain.setValueCurveAtTime(curve, start, duration);
        }
    }
    context.addEventListener('statechange', schedule);
    schedule();
    return { finished, cancel: () => finish(true) };
}
