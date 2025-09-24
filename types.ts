// FIX: Added optional 'userId' and 'password' to the Settings interface to support login credentials in SettingsPage and resolve type errors.
export interface Settings {
  targetUrl: string;
  day: string;
  startTime: string;
  endTime:string;
  userId?: string;
  password?: string;
}

export interface UrlPreset {
    id: string;
    name: string;
    url: string;
}

export interface LogEntry {
  timestamp: Date;
  message: string;
  isError?: boolean;
}

export enum MonitoringStatus {
  STOPPED = 'Stopped',
  SETUP_IN_PROGRESS = 'Setup: In Progress',
  MONITORING = 'Monitoring',
  FOUND = 'Slot Found! Paused',
  BOOKED = 'Already Booked. Paused'
}
