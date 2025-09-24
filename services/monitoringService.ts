import { Settings } from '../types';

interface MonitoringCallbacks {
  onCheck: () => void;
  onLog: (message: string, isError?: boolean) => void;
  onSlotFound: (time: string) => void;
  onAlreadyBooked: () => void;
  onStop: () => void;
}

// Helper to create a full day of unavailable slots
const allDayUnavailable = () => {
    const slots: { [time: string]: 'X' } = {};
    for (let i = 0; i < 24; i++) {
        slots[`${String(i).padStart(2, '0')}:00`] = 'X';
    }
    return slots;
};

// Simulated reservation data based on the provided image
const reservationTable: { [day: string]: { [time: string]: 'O' | 'X' } } = {
    '23': { ...allDayUnavailable() },
    '24': { ...allDayUnavailable(), '01:00': 'O', '02:00': 'O', '03:00': 'O', '04:00': 'O' },
    '25': { ...allDayUnavailable(), '01:00': 'O', '02:00': 'O', '03:00': 'O', '04:00': 'O' },
    '26': { ...allDayUnavailable(), '01:00': 'O', '02:00': 'O', '03:00': 'O', '04:00': 'O', '05:00': 'O', '06:00': 'O' },
    '27': { ...allDayUnavailable(), '01:00': 'O', '02:00': 'O', '03:00': 'O', '04:00': 'O', '05:00': 'O', '06:00': 'O', '07:00': 'O' },
    '28': { ...allDayUnavailable(), '01:00': 'O', '02:00': 'O', '03:00': 'O', '04:00': 'O', '05:00': 'O', '06:00': 'O', '10:00': 'O' },
    '29': {
        ...allDayUnavailable(),
        '00:00': 'O', '01:00': 'O', '02:00': 'O', '03:00': 'O', '04:00': 'O', '05:00': 'O',
        '08:00': 'O', '12:00': 'O', '18:00': 'O', '19:00': 'O', '23:00': 'O',
    },
};

class MonitoringService {
  private mainTimerId: number | null = null;
  private checkTimerId: number | null = null;
  private isRunning: boolean = false;
  private checkCount: number = 0;
  private readonly maxChecksPerCycle: number = 2; // 1度の監視は2回
  private readonly retryDelay: number = 5 * 60 * 1000; // 5分後にリトライ
  private currentCallbacks: MonitoringCallbacks | null = null;
  private settings: Settings | null = null;

  start(settings: Settings, callbacks: MonitoringCallbacks) {
    if (this.isRunning) {
      this.stop(); // 既存の監視を停止
    }
    this.isRunning = true;
    this.settings = settings;
    this.currentCallbacks = callbacks;
    callbacks.onLog(`監視を開始しました。1サイクルあたり${this.maxChecksPerCycle}回チェックします。`);
    callbacks.onLog(`空きが見つからない場合、5分後に自動で次のサイクルを開始します。`);
    
    this.runMonitoringCycle();
  }

  private runMonitoringCycle() {
    if (!this.isRunning) return;

    this.checkCount = 0;
    this.currentCallbacks?.onLog('新しい監視サイクルを開始します。(ページの再読み込みをシミュレート)');
    this.performCheck();
  }

  private performCheck = () => {
    if (!this.isRunning || !this.settings || !this.currentCallbacks) return;

    this.checkCount++;
    this.currentCallbacks.onCheck();
    this.currentCallbacks.onLog(`空きスロットをチェック中... (試行 ${this.checkCount}/${this.maxChecksPerCycle})`);

    // --- Slot checking logic simulation ---
    const { day, startTime, endTime } = this.settings;
    const daySchedule = reservationTable[day] || {};
    
    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = parseInt(endTime.split(':')[0], 10);

    let foundSlotTime: string | null = null;

    for (let hour = startHour; hour <= endHour; hour++) {
        const timeToCheck = `${String(hour).padStart(2, '0')}:00`;
        if (daySchedule[timeToCheck] === 'O') {
            foundSlotTime = timeToCheck;
            break; // Found the first available slot
        }
    }

    // Delay simulation
    setTimeout(() => {
        if (!this.isRunning) return;

        if (foundSlotTime) {
            this.currentCallbacks?.onLog(`発見！ ${this.settings?.day}日 ${foundSlotTime} に空きがあります。`);
            this.currentCallbacks?.onSlotFound(foundSlotTime);
            this.stop();
            return;
        }

        if (this.checkCount >= this.maxChecksPerCycle) {
            this.currentCallbacks?.onLog('このサイクルでは空きスロットが見つかりませんでした。');
            this.scheduleNextCycle();
        } else {
            this.currentCallbacks?.onLog('空きスロットなし。少し待ってから再チェックします。');
            this.checkTimerId = window.setTimeout(this.performCheck, 10 * 1000); // Demo interval
        }
    }, 1500); // Network delay simulation
  };
  
  private scheduleNextCycle() {
    if (!this.isRunning) return;

    this.currentCallbacks?.onLog(`5分後に次の監視サイクルを開始します。`);
    this.mainTimerId = window.setTimeout(() => this.runMonitoringCycle(), this.retryDelay);
  }

  stop() {
    if (this.mainTimerId) {
      clearTimeout(this.mainTimerId);
      this.mainTimerId = null;
    }
    if (this.checkTimerId) {
      clearTimeout(this.checkTimerId);
      this.checkTimerId = null;
    }

    if (this.isRunning) {
      const wasRunning = this.isRunning;
      this.isRunning = false;
      if (wasRunning) {
        this.currentCallbacks?.onStop();
      }
      this.currentCallbacks = null;
      this.settings = null;
    }
  }
}

export const monitoringService = new MonitoringService();