import { dateToJD } from './kepler';

// Manages the simulation clock: current Julian date, play/pause and rate.
export class TimeController {
  jd: number;
  playing = true;
  daysPerSecond = 5;

  constructor(initialJD?: number) {
    this.jd = initialJD ?? dateToJD(new Date());
  }

  step(dtSeconds: number) {
    if (this.playing) {
      this.jd += this.daysPerSecond * dtSeconds;
    }
  }

  setPlaying(p: boolean) {
    this.playing = p;
  }

  togglePlaying() {
    this.playing = !this.playing;
  }
}
