
import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, Renderer2
} from '@angular/core';

export interface TimeInterface {
  tick_count: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  timer: any;
}

@Component({
  selector: 'app-timer',
  template: '<ng-content></ng-content>'
})
export class TimerComponent implements AfterViewInit, OnDestroy {
  private timeoutId: any;
  private isRunning: boolean;
  private tickCounter: number;
  private ngContentNode: any;
  private ngContentSchema: string;

  private seconds: number;
  private minutes: number;
  private hours: number;
  private days: number;

  @Input() startTime: number;
  @Input() endTime: number;
  @Input() countdown: boolean;
  @Input() autoStart: boolean;
  @Input() maxTimeUnit: string;
  @Output() onStart: EventEmitter<TimerComponent>;
  @Output() onStop: EventEmitter<TimerComponent>;
  @Output() onTick: EventEmitter<TimeInterface>;
  @Output() onComplete: EventEmitter<TimerComponent>;

  constructor(private elt: ElementRef, private renderer: Renderer2) {
    // Initialization
    this.onStart    = new EventEmitter();
    this.onComplete = new EventEmitter();
    this.onStop     = new EventEmitter();
    this.onTick     = new EventEmitter();

    // Checking for trim function since IE8 doesn't have it
    // If not a function, create tirm with RegEx to mimic native trim
    if (typeof String.prototype.trim !== 'function') {
      String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
      };
    }

    this.autoStart  = true;
    this.startTime  = null;
    this.endTime    = null;
    this.timeoutId  = null;
    this.countdown  = null;
    this.isRunning  = false;
  }

  ngAfterViewInit() {
    this.ngContentNode = this.elt.nativeElement.childNodes[0];
    this.ngContentSchema = this.ngContentNode.nodeValue;
    if (this.autoStart === undefined || this.autoStart === true) {
      this.start();
    }
  }

  ngOnDestroy() {
    this.resetTimeout();
    this.isRunning = false;
  }

  public start() {
    this.startTime = this.startTime || 0;
    this.endTime   = this.endTime || null;
    this.countdown = this.countdown || false;
    this.tickCounter = this.startTime;

    // Disable countdown if start time not defined
    if (this.countdown && this.startTime === 0) {
      this.countdown = false;
    }

    this.resetTimeout();
    this.tick(this);
    this.isRunning = true;

    this.onStart.emit(this);
  }

  public resume() {
    this.resetTimeout();

    if (this.countdown) {
      this.tickCounter += 1;
    }

    this.tick(this);
    this.isRunning = true;
  }

  public stop() {
    this.clear();

    this.onStop.emit(this);
  }

  public reset() {
    this.startTime = this.startTime || 0;
    this.endTime   = this.endTime || null;
    this.countdown = this.countdown || false;
    this.tickCounter = this.startTime;

    // Disable countdown if start time not defined
    if (this.countdown && this.startTime === 0) {
      this.countdown = false;
    }

    this.resetTimeout();
    this.tick(this);
    this.clear();
    this.isRunning = false;
  }

  private resetTimeout() {
    if (this.timeoutId) {
      clearInterval(this.timeoutId);
    }
  }

  private renderText() {
    const items = {
      seconds: this.seconds,
      minutes: this.minutes,
      hours: this.hours,
      days: this.days
    };

    let outputText = this.ngContentSchema;

    for (const key of Object.keys(items)) {
      outputText = outputText.replace('[' + key + ']', items[key].toString());
    }

    this.renderer.setValue(this.ngContentNode, outputText);
  }

  private clear() {
    this.resetTimeout();
    this.timeoutId = null;
    this.isRunning = false;
  }

  protected calculateTimeUnits() {
    if (!this.maxTimeUnit || this.maxTimeUnit === 'day') {
      this.seconds  = Math.floor(this.tickCounter % 60);
      this.minutes  = Math.floor((this.tickCounter / 60) % 60);
      this.hours    = Math.floor((this.tickCounter / 3600) % 24);
      this.days     = Math.floor((this.tickCounter / 3600) / 24);
    } else if (this.maxTimeUnit === 'second') {
      this.seconds  = Math.floor(this.tickCounter % 60);
      this.minutes  = 0;
      this.hours    = 0;
      this.days     = 0;
    } else if (this.maxTimeUnit === 'minute') {
      this.seconds  = Math.floor(this.tickCounter % 60);
      this.minutes  = Math.floor((this.tickCounter / 60) % 60);
      this.hours    = 0;
      this.days     = 0;
    } else if (this.maxTimeUnit === 'hour') {
      this.seconds  = Math.floor(this.tickCounter % 60);
      this.minutes  = Math.floor((this.tickCounter / 60) % 60);
      this.hours    = Math.floor((this.tickCounter / 3600) % 24);
      this.days     = 0;
    }

    this.renderText();
  }

  protected tick (that: TimerComponent) {
    let counter;

    if (this.countdown) {
      // Compute finish counter for countdown
      counter = that.tickCounter;

      if (that.startTime > that.endTime) {
        counter = that.tickCounter - that.endTime;
      }
    } else {
      // Compute finish counter for timer
      counter = that.tickCounter - that.startTime;

      if (that.endTime > that.startTime) {
        counter = that.endTime - that.tickCounter;
      }
    }

    if (counter <= 0) {
      that.stop();
      that.calculateTimeUnits();

      this.onComplete.emit(this);
      return;
    }

    that.calculateTimeUnits();

    if (this.countdown) {
      that.tickCounter--;
    } else {
      that.tickCounter++;
    }

    that.timeoutId = setTimeout(function() {
      that.tick(that);
    }, 1000); // Each seconds

    const timer: TimeInterface = {
      seconds: this.seconds,
      minutes: this.minutes,
      hours: this.hours,
      days: this.days,
      timer: this.timeoutId,
      tick_count: this.tickCounter
    };

    this.onTick.emit(timer);

  }

}
