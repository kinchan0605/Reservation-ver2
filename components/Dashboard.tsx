import React, { useState, useEffect } from 'react';
import { MonitoringStatus, Settings, LogEntry, UrlPreset } from '../types';
import { InformationCircleIcon, PlusCircleIcon, TrashIcon, PlayCircleIcon, StopCircleIcon } from './Icons';

interface DashboardProps {
  status: MonitoringStatus;
  onBeginSetup: (conditions: Settings) => void;
  onConfirmAndStart: () => void;
  onStopMonitoring: () => void;
  settings: Settings;
  lastCheck: Date | null;
  logs: LogEntry[];
  urlPresets: UrlPreset[];
  onAddPreset: (name: string, url: string) => void;
  onRemovePreset: (id: string) => void;
}

const StatusIndicator: React.FC<{ status: MonitoringStatus }> = ({ status }) => {
  const baseClasses = "px-4 py-1 text-sm font-semibold text-white rounded-full inline-block";
  switch (status) {
    case MonitoringStatus.MONITORING:
      return <span className={`${baseClasses} bg-blue-500`}>監視中</span>;
    case MonitoringStatus.STOPPED:
      return <span className={`${baseClasses} bg-gray-500`}>停止中</span>;
    case MonitoringStatus.FOUND:
      return <span className={`${baseClasses} bg-green-500`}>予約可</span>;
    case MonitoringStatus.BOOKED:
      return <span className={`${baseClasses} bg-yellow-500 text-gray-800`}>予約済み</span>;
    case MonitoringStatus.SETUP_IN_PROGRESS:
       return <span className={`${baseClasses} bg-purple-500`}>セットアップ中</span>;
    default:
      return null;
  }
};

const LogItem: React.FC<{ log: LogEntry }> = ({ log }) => (
  <li className={`flex items-start p-3 border-b border-gray-200 ${log.isError ? 'text-red-600' : 'text-gray-600'}`}>
     <InformationCircleIcon className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${log.isError ? 'text-red-400' : 'text-gray-400'}`} />
    <div className="flex-grow">
      <p className="text-sm">{log.message}</p>
      <p className="text-xs text-gray-400 mt-1">{log.timestamp.toLocaleTimeString()}</p>
    </div>
  </li>
);

const Dashboard: React.FC<DashboardProps> = ({ status, onBeginSetup, onConfirmAndStart, onStopMonitoring, settings, lastCheck, logs, urlPresets, onAddPreset, onRemovePreset }) => {
  const isSetupInProgress = status === MonitoringStatus.SETUP_IN_PROGRESS;
  const isMonitoringActive = status !== MonitoringStatus.STOPPED;
  
  const [selectedUrl, setSelectedUrl] = useState(settings.targetUrl);
  const [day, setDay] = useState(settings.day);
  const [startTime, setStartTime] = useState(settings.startTime);
  const [endTime, setEndTime] = useState(settings.endTime);

  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetUrl, setNewPresetUrl] = useState('');

  useEffect(() => {
    if (!isMonitoringActive) {
        setSelectedUrl(settings.targetUrl);
        setDay(settings.day);
        setStartTime(settings.startTime);
        setEndTime(settings.endTime);
    }
  }, [settings, isMonitoringActive]);
  
  useEffect(() => {
    if (!urlPresets.some(p => p.url === selectedUrl)) {
        setSelectedUrl(urlPresets.length > 0 ? urlPresets[0].url : '');
    }
  }, [urlPresets, selectedUrl]);

  const handleStartSetup = () => {
    onBeginSetup({
        targetUrl: selectedUrl,
        day,
        startTime,
        endTime
    });
  };

  const handleAddPreset = () => {
    onAddPreset(newPresetName, newPresetUrl);
    setNewPresetName('');
    setNewPresetUrl('');
  };
  
  const canStart = selectedUrl && day && startTime && endTime;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">監視ステータス</h2>
          <StatusIndicator status={status} />
        </div>
        <p className="text-xs text-gray-400 text-right">
          最終チェック: {lastCheck ? lastCheck.toLocaleString() : 'N/A'}
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        {!isSetupInProgress && (
            <fieldset disabled={isMonitoringActive} className="space-y-4">
                <div>
                    <h3 className="text-base font-bold text-gray-600 mb-2">1. 監視対象を選択</h3>
                    <div className="space-y-2 rounded-md border p-2 max-h-40 overflow-y-auto">
                        {urlPresets.map(preset => (
                            <label key={preset.id} className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedUrl === preset.url ? 'bg-green-100 border-green-300' : 'hover:bg-gray-100 border-transparent'} border`}>
                                <input type="radio" name="url-preset" value={preset.url} checked={selectedUrl === preset.url} onChange={e => setSelectedUrl(e.target.value)} className="w-4 h-4 text-green-600 focus:ring-green-500"/>
                                <span className="ml-3 text-sm font-medium text-gray-800">{preset.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-base font-bold text-gray-600 mb-2">2. 監視条件を設定</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="day" className="block text-sm font-medium text-gray-600 mb-1">希望日</label>
                            <select id="day" name="day" value={day} onChange={e => setDay(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 bg-gray-50">
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                    <option key={d} value={String(d).padStart(2, '0')}>
                                        {String(d).padStart(2, '0')}日
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="startTime" className="block text-sm font-medium text-gray-600 mb-1">開始時間</label>
                            <input type="time" id="startTime" name="startTime" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 bg-gray-50 [color-scheme:light]"/>
                        </div>
                        <div>
                            <label htmlFor="endTime" className="block text-sm font-medium text-gray-600 mb-1">終了時間</label>
                            <input type="time" id="endTime" name="endTime" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 bg-gray-50 [color-scheme:light]"/>
                        </div>
                    </div>
                </div>
            </fieldset>
        )}

        <div className="mt-6">
            {isMonitoringActive ? (
                <button onClick={onStopMonitoring} className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 transition-colors">
                    <StopCircleIcon className="w-6 h-6 mr-2"/>
                    キャンセルして停止
                </button>
            ) : (
                <button onClick={handleStartSetup} disabled={!canStart} className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                     <PlayCircleIcon className="w-6 h-6 mr-2"/>
                    アクセス開始
                </button>
            )}
        </div>
        
        {isSetupInProgress && (
            <div className="mt-6 space-y-4">
                <div className="bg-purple-50 border-t-4 border-purple-500 p-6 rounded-b-lg text-center">
                    <h3 className="font-bold text-purple-800 text-lg">セットアップ: ブラウザ操作</h3>
                    <p className="text-sm text-purple-700 mt-2">
                        新しいタブでサイトが開かれました。
                    </p>
                    <p className="text-sm text-purple-700 mt-1">
                        ログイン後、監視したい予約ページまで移動してください。
                    </p>
                    <p className="font-semibold text-purple-800 mt-4">
                        目的のページに移動したら、ここに戻って下のボタンを押してください。
                    </p>
                    <button 
                        onClick={onConfirmAndStart} 
                        className="w-full max-w-sm mx-auto flex items-center justify-center mt-4 px-4 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700"
                    >
                        <PlayCircleIcon className="w-6 h-6 mr-2"/>
                        監視実行
                    </button>
                </div>
            </div>
        )}
      </div>
      
      {!isSetupInProgress && (
        <>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-base font-bold text-gray-500 mb-4">URLプリセット管理</h3>
                <div className="space-y-4">
                    <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {urlPresets.map(preset => (
                            <li key={preset.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                <div>
                                    <p className="font-semibold text-gray-700">{preset.name}</p>
                                    <p className="text-xs text-gray-500 break-all">{preset.url}</p>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                    <button onClick={() => onRemovePreset(preset.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors" aria-label="Remove preset">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </li>
                        ))}
                        {urlPresets.length === 0 && <p className="text-center text-gray-500 text-sm py-4">プリセットがありません。</p>}
                    </ul>
                    <div className="border-t pt-4 space-y-2">
                        <input type="text" value={newPresetName} onChange={e => setNewPresetName(e.target.value)} placeholder="プリセット名 (例: FIT-GOLF)" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm bg-gray-50"/>
                        <input type="url" value={newPresetUrl} onChange={e => setNewPresetUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm bg-gray-50"/>
                        <button onClick={handleAddPreset} className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={!newPresetName || !newPresetUrl}>
                            <PlusCircleIcon className="w-5 h-5 mr-2"/>
                            プリセットを追加
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg">
                <h3 className="text-base font-bold text-gray-500 p-4 border-b border-gray-200">動作ログ</h3>
                <ul className="max-h-80 overflow-y-auto divide-y divide-gray-200">
                {logs.length > 0 ? (
                    logs.map((log, index) => <LogItem key={index} log={log} />)
                ) : (
                    <p className="p-4 text-center text-gray-500">ログはありません。</p>
                )}
                </ul>
            </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;