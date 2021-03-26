import { CustomEventWrapper } from "../common/custom-event-wrapper";
import { RemoteCallable } from "../common/remote-callable"

const TIMES_UP_EVENT_KEY = "timing-monitor-times-up";

class TimingInfo {
  constructor(timePt = 0, handle = -1) {
    this.timeOutHandle = handle;
    this.endTimePt = timePt;
  }
}

/**
 * Used to bind a timer with the given host
 */
class HostTimingMonitor extends RemoteCallable {
  static get MINIMAL_TIMER_LEN() {
    return 1000;
  }

  /**
   * Create a timing monitor with given name.
   *
   * @param {string} name the name of monitor
   */
  constructor(name) {
    super(name);

    this._timingInfoMap = new Map();
    this._eventTarget = new EventTarget();
    this._timesUpEvent = new CustomEventWrapper(
      TIMES_UP_EVENT_KEY,
      this._eventTarget
    );
  }

  /**
   * The event that will be triggered on any host's times up.
   *
   * The callback function format for this event is:
   *
   *     function (hostname: string, timePoint: number)
   *  - hostname: the hostname bind to the timer.
   *  - timePoint: the ending time point of unlock period (in milliseconds from epoch).
   */
  get onTimesUp() {
    return this._timesUpEvent;
  }

  /**
   * Check if the hostname is in the timing list.
   *
   * @param {String} hostname the hostname to be checked.
   * @return {boolean} whether the monitor is timing for the host
   */
  isTiming(hostname) {
    return this._timingInfoMap.has(hostname);
  }

  /**
   * Stop the timing for the given hostname immediately.
   *
   * @param {String} hostname the hostname that the timer bind.
   * @param {boolean} triggerEvent whether the times up event is triggered.
   * @return {boolean} whether a timer is removed.
   */
  stopTiming(hostname, triggerEvent = true) {
    let info = this._timingInfoMap.get(hostname);
    if (!info) return false;

    window.clearTimeout(info.timeOutHandle);
    this._timingInfoMap.delete(hostname);

    if (triggerEvent) {
      this.onTimesUp.trigger(hostname, info.endTimePt);
    }
    return true;
  }

  /**
   * Check the rest time of the given hostname
   * @param {String} hostname the hostname to be checked.
   * @returns {(Number|undefined)} the rest time in milliseconds,
   *   or undefined if the hostname is not in the timing list.
   */
  restTime(hostname) {
    let endTimePoint = this.endTimePoint(hostname);
    if (endTimePoint == undefined) return undefined;
    return endTimePoint - Date.now();
  }

  /**
   * Check the ending time point of timer of the given hostname.
   * @param {String} hostname the hostname to be checked.
   * @returns {(Number|undefined)} the end time point of bind timer,
   *   or undefined if the hostname is not in the list.
   */
  endTimePoint(hostname) {
    let info = this._timingInfoMap.get(hostname);
    if (info == undefined) return undefined;
    return info.endTimePt;
  }

  /**
   * Bind the given hostname with a timer ends the given time point.
   *
   * @param {String} hostname the hostname.
   * @param {(Number|Date)} timePoint the ending time point of timer.
   * @return {boolean} whether a new timer is set
   */
  setTimerOn(hostname, timePoint) {
    if (!hostname) return false;
    if (this.isTiming(hostname)) return false;

    if (timePoint instanceof Date) timePoint = timePoint.getTime();

    let duration = timePoint - Date.now();
    if (duration <= HostTimingMonitor.MINIMAL_TIMER_LEN) return;

    let restTimeMap = this._timingInfoMap;
    let timesUpEvent = this._timesUpEvent;

    let handle = window.setTimeout(function () {
      timesUpEvent.trigger(hostname, duration);
      restTimeMap.delete(hostname);
    }, timePoint - Date.now());

    this._timingInfoMap.set(hostname, new TimingInfo(timePoint, handle));

    console.log(`Unlocked ${hostname} until ${new Date(timePoint)}.`);
    return true;
  }

  /**
   * Bind the given hostname with a timer of given time length.
   *
   * @param {String} hostname the hostname
   * @param {Number} milliseconds the duration of timer
   * @return {boolean} whether a new timer is set
   */
  setTimerFor(hostname, milliseconds) {
    return this.setTimerOn(hostname, Date.now() + milliseconds);
  }
}

export { HostTimingMonitor };
