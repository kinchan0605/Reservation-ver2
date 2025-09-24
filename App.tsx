import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
// FIX: Removed unused 'View' type from import to resolve module export error.
import { Settings, LogEntry, MonitoringStatus, UrlPreset } from './types';
import Dashboard from './components/Dashboard';
import { monitoringService } from './services/monitoringService';
import { BellIcon } from './components/Icons';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [settings, setSettings] = useLocalStorage<Settings>('reservation-settings', {
    targetUrl: 'https://join.fiteasy.jp/mypage/login',
    day: '01',
    startTime: '13:00',
    endTime: '17:00',
  });

  const [urlPresets, setUrlPresets] = useLocalStorage<UrlPreset[]>('url-presets', [
      { id: '1', name: 'Fitサウナ', url: 'https://join.fiteasy.jp/mypage/login' },
      { id: '2', name: 'Fit酸素ルーム', url: 'https://join.fiteasy.jp/mypage/login' },
  ]);

  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus>(MonitoringStatus.STOPPED);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const addLog = useCallback((message: string, isError: boolean = false) => {
    setLogs(prev => [{ timestamp: new Date(), message, isError }, ...prev.slice(0, 49)]);
  }, []);

  const beginSetup = useCallback((conditions: Settings) => {
    setSettings(prev => ({
      ...prev,
      ...conditions,
    }));
    setMonitoringStatus(MonitoringStatus.SETUP_IN_PROGRESS);
    addLog('セットアップを開始しました。新しいタブでサイトを開きます。ログイン後、予約ページに移動してから、この画面に戻って監視を開始してください。');
    window.open(conditions.targetUrl, '_blank', 'noopener,noreferrer');
  }, [addLog, setSettings]);

  const showNotification = useCallback((day: string, time: string) => {
    setMonitoringStatus(MonitoringStatus.FOUND);
    addLog(`空きスロットを発見しました！ ${day}日 ${time}。監視を一時停止します。`);

    if (!('Notification' in window)) {
      addLog('このブラウザはデスクトップ通知に対応していません。', true);
      return;
    }
    
    const targetPreset = urlPresets.find(p => p.url === settings.targetUrl);
    const targetName = targetPreset ? targetPreset.name : settings.targetUrl;
    const notificationTitle = '予約の空きを発見しました！';
    const notificationBody = `${targetName} ${settings.day}日 ${settings.startTime}から${settings.endTime}に空き時間を発見`;

    const permissionCallback = (permission: NotificationPermission) => {
        if (permission === 'granted') {
            new Notification(notificationTitle, {
                body: notificationBody,
                icon: '/favicon.ico' 
            });
        } else {
             addLog('通知の許可がありません。システム通知を表示できません。', true);
        }
    };

    if (Notification.permission === 'granted') {
        permissionCallback('granted');
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permissionCallback);
    } else { // Notification.permission is 'denied'
        permissionCallback('denied');
    }
  }, [addLog, settings, urlPresets, setMonitoringStatus]);

  const confirmAndStartMonitoring = useCallback(() => {
    setMonitoringStatus(MonitoringStatus.MONITORING);
    addLog('ユーザーがページ移動を確認しました。バックグラウンド監視を開始します。');
    monitoringService.start(settings, {
      onCheck: () => setLastCheck(new Date()),
      onLog: addLog,
      onSlotFound: (time) => {
        showNotification(settings.day, time);
      },
      onAlreadyBooked: () => {
        setMonitoringStatus(MonitoringStatus.BOOKED);
        addLog('既に予約が存在します。監視を一時停止します。');
      },
      onStop: () => {
        setMonitoringStatus(currentStatus => {
            if (currentStatus === MonitoringStatus.MONITORING || currentStatus === MonitoringStatus.SETUP_IN_PROGRESS) {
                return MonitoringStatus.STOPPED;
            }
            return currentStatus;
        });
      }
    });
  }, [settings, addLog, showNotification]);

  const stopMonitoring = useCallback(() => {
    monitoringService.stop();
    setMonitoringStatus(currentStatus => {
      if (currentStatus !== MonitoringStatus.STOPPED) {
        addLog('監視を停止しました。');
      }
      return MonitoringStatus.STOPPED;
    });
  }, [addLog]);

  useEffect(() => {
    return () => {
      monitoringService.stop();
    };
  }, []);
  
  const addUrlPreset = (name: string, url: string) => {
    if (name && url) {
        const newPreset = { id: uuidv4(), name, url };
        setUrlPresets(prev => [...prev, newPreset]);
        setSettings(prev => ({ ...prev, targetUrl: newPreset.url }));
        addLog(`プリセット「${name}」を追加し、選択しました。`);
    }
  };

  const removeUrlPreset = (id: string) => {
    setUrlPresets(prev => prev.filter(p => p.id !== id));
    addLog('プリセットを削除しました。');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-700">予約監視アシスタント</h1>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-6">
        <Dashboard 
          status={monitoringStatus}
          onBeginSetup={beginSetup}
          onConfirmAndStart={confirmAndStartMonitoring}
          onStopMonitoring={stopMonitoring}
          settings={settings}
          lastCheck={lastCheck}
          logs={logs}
          urlPresets={urlPresets}
          onAddPreset={addUrlPreset}
          onRemovePreset={removeUrlPreset}
        />
      </main>
    </div>
  );
};

export default App;
