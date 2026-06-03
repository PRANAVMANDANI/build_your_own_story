class AudioEngine {
    constructor() {
        this.ctx = null;
        this.ambientOsc = null;
        this.ambientGain = null;
        this.ambientLFO = null;
        this.soundOn = localStorage.getItem("sound_enabled") !== "false";
    }

    init() {
        if (this.ctx) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            this.ctx = new AudioContextClass();
        }
    }

    setSound(enabled) {
        this.soundOn = enabled;
        localStorage.setItem("sound_enabled", enabled ? "true" : "false");
        if (!enabled) {
            this.stopAmbient();
        }
    }

    toggleSound() {
        this.setSound(!this.soundOn);
        return this.soundOn;
    }

    playClick() {
        if (!this.soundOn) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playSelect() {
        if (!this.soundOn) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = "triangle";
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playWin() {
        if (!this.soundOn) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const playNote = (freq, delay, duration) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.15, now + delay + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);

            osc.start(now + delay);
            osc.stop(now + delay + duration);
        };

        // Major Chord Arpeggio: C4, E4, G4, C5
        playNote(261.63, 0.0, 0.4);
        playNote(329.63, 0.1, 0.4);
        playNote(392.00, 0.2, 0.4);
        playNote(523.25, 0.3, 0.8);
    }

    playLose() {
        if (!this.soundOn) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.8);

        // Lowpass filter to make it sound muffled/dark
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(300, now);
        
        osc.disconnect(gain);
        osc.connect(filter);
        filter.connect(gain);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.8);

        osc.start();
        osc.stop(now + 0.8);
    }

    startAmbient(type = "default") {
        if (!this.soundOn) return;
        this.init();
        if (!this.ctx) return;

        this.stopAmbient();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        this.ambientOsc = osc;
        this.ambientGain = gain;

        // Customize sound based on type
        if (type === "space") {
            osc.type = "sine";
            osc.frequency.setValueAtTime(60, this.ctx.currentTime); // Low space rumble
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(120, this.ctx.currentTime);
            // Apply slight frequency modulation (LFO)
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.frequency.value = 0.2; // 0.2 Hz slow pulse
            lfoGain.gain.value = 5; // Modulate by 5 Hz
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            lfo.start();
            this.ambientLFO = lfo;
        } else if (type === "horror") {
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(45, this.ctx.currentTime); // Low eerie drone
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(90, this.ctx.currentTime);
            // LFO for spooky volume wavering
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.frequency.value = 0.5;
            lfoGain.gain.value = 0.05;
            lfo.connect(lfoGain);
            lfoGain.connect(gain.gain);
            lfo.start();
            this.ambientLFO = lfo;
        } else if (type === "fantasy") {
            osc.type = "triangle";
            osc.frequency.setValueAtTime(110, this.ctx.currentTime); // Soft melodic pad
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(250, this.ctx.currentTime);
        } else if (type === "pirates" || type === "ocean") {
            osc.type = "sine";
            osc.frequency.setValueAtTime(80, this.ctx.currentTime);
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(150, this.ctx.currentTime);
            // Wave simulation
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.frequency.value = 0.15; // Slow waves
            lfoGain.gain.value = 0.07;
            lfo.connect(lfoGain);
            lfoGain.connect(gain.gain);
            lfo.start();
            this.ambientLFO = lfo;
        } else {
            // default/classic slate
            osc.type = "sine";
            osc.frequency.setValueAtTime(70, this.ctx.currentTime);
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(100, this.ctx.currentTime);
        }

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 1.5); // Fade in ambient sound

        osc.start();
    }

    stopAmbient() {
        if (this.ambientOsc) {
            try {
                this.ambientOsc.stop();
            } catch (e) {}
            this.ambientOsc = null;
        }
        if (this.ambientLFO) {
            try {
                this.ambientLFO.stop();
            } catch (e) {}
            this.ambientLFO = null;
        }
        this.ambientGain = null;
    }
}

const audioEngine = new AudioEngine();
export default audioEngine;
