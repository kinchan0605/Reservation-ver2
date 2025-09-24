import React, { useState } from 'react';
import { Settings } from '../types';

interface SettingsPageProps {
  initialSettings: Settings;
  onSave: (settings: Settings) => void;
  onCancel: () => void;
}

// FIX: Added `name: string` to the InputField component's props type to fix errors where the component was being used with a `name` prop.
const InputField: React.FC<{ label: string; id: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; placeholder?: string }> = 
({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
    <input id={id} {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500" />
  </div>
);

const SettingsPage: React.FC<SettingsPageProps> = ({ initialSettings, onSave, onCancel }) => {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };
  
  const handleTestLogin = () => {
    setIsTesting(true);
    setTestResult(null);
    setTimeout(() => {
        if (settings.userId === 'test' && settings.password === 'password') {
            setTestResult('Login test successful!');
        } else {
            setTestResult('Login test failed. Please check credentials.');
        }
        setIsTesting(false);
    }, 1500);
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-6">設定</h2>
      <div className="space-y-6">
        <div>
            <h3 className="text-md font-semibold text-gray-700 mb-2 border-b pb-2">ログイン情報</h3>
            <div className="space-y-4 mt-4">
                {/* FIX: Added fallback to empty string for optional 'userId' setting to ensure InputField value is always a string and prevent React warnings. */}
                <InputField label="対象サイトのID/ユーザー名" id="userId" name="userId" value={settings.userId || ''} onChange={handleChange} placeholder="test"/>
                {/* FIX: Added fallback to empty string for optional 'password' setting to ensure InputField value is always a string and prevent React warnings. */}
                <InputField label="対象サイトのパスワード" id="password" name="password" value={settings.password || ''} onChange={handleChange} type="password" placeholder="password"/>
            </div>
        </div>
        
        <div>
            <h3 className="text-md font-semibold text-gray-700 mb-2 border-b pb-2">監視条件設定</h3>
            <div className="space-y-4 mt-4">
                 <InputField label="対象施設URL" id="targetUrl" name="targetUrl" value={settings.targetUrl} onChange={handleChange} />
                 <div>
                    <label htmlFor="day" className="block text-sm font-medium text-gray-600 mb-1">希望日</label>
                    <select id="day" name="day" value={settings.day} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={String(day).padStart(2, '0')}>
                                {String(day).padStart(2, '0')}日
                            </option>
                        ))}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-600 mb-1">開始時間</label>
                        <input type="time" id="startTime" name="startTime" value={settings.startTime} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"/>
                    </div>
                    <div>
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-600 mb-1">終了時間</label>
                        <input type="time" id="endTime" name="endTime" value={settings.endTime} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"/>
                    </div>
                </div>
            </div>
        </div>

        <div className="border-t pt-6 space-y-4">
           <div className="flex items-center gap-4">
                <button 
                    onClick={handleTestLogin}
                    disabled={isTesting}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-sm hover:bg-blue-600 disabled:bg-blue-300 transition-colors">
                    {isTesting ? 'Testing...' : 'ログインテスト'}
                </button>
                {testResult && <p className={`text-sm ${testResult.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>{testResult}</p>}
           </div>

            <div className="flex justify-end gap-4">
                <button onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors">
                    キャンセル
                </button>
                <button onClick={() => onSave(settings)} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 transition-colors">
                    保存
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
