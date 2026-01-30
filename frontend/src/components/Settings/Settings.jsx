import { useState } from 'react';
import { FiSettings, FiBell, FiMoon, FiSun, FiGlobe, FiCheck } from 'react-icons/fi';

const Settings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    weeklyDigest: false,
    darkMode: false,
    language: 'en',
    timezone: 'UTC',
  });
  const [saved, setSaved] = useState(false);

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
    setSaved(false);
  };

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
    setSaved(false);
  };

  const handleSave = () => {
    // In a real app, this would save to the backend
    localStorage.setItem('userSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Customize your experience</p>
      </div>

      {/* Notifications */}
      <div className="card mb-6">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiBell className="text-blue-600 text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500">Manage how you receive notifications</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <SettingToggle
            label="Email Notifications"
            description="Receive email notifications for task updates"
            enabled={settings.emailNotifications}
            onToggle={() => handleToggle('emailNotifications')}
          />
          <SettingToggle
            label="Push Notifications"
            description="Receive push notifications in your browser"
            enabled={settings.pushNotifications}
            onToggle={() => handleToggle('pushNotifications')}
          />
          <SettingToggle
            label="Task Reminders"
            description="Get reminded about upcoming task deadlines"
            enabled={settings.taskReminders}
            onToggle={() => handleToggle('taskReminders')}
          />
          <SettingToggle
            label="Weekly Digest"
            description="Receive a weekly summary of your activity"
            enabled={settings.weeklyDigest}
            onToggle={() => handleToggle('weeklyDigest')}
          />
        </div>
      </div>

      {/* Appearance */}
      <div className="card mb-6">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              {settings.darkMode ? (
                <FiMoon className="text-purple-600 text-xl" />
              ) : (
                <FiSun className="text-purple-600 text-xl" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
              <p className="text-sm text-gray-500">Customize the look of the app</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <SettingToggle
            label="Dark Mode"
            description="Switch between light and dark themes"
            enabled={settings.darkMode}
            onToggle={() => handleToggle('darkMode')}
          />
        </div>
      </div>

      {/* Localization */}
      <div className="card mb-6">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiGlobe className="text-green-600 text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Localization</h2>
              <p className="text-sm text-gray-500">Set your language and timezone</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="form-label">Language</label>
            <select
              value={settings.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="form-input"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
          <div>
            <label className="form-label">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className="form-input"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Shanghai">Shanghai (CST)</option>
              <option value="Asia/Kolkata">India (IST)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="btn btn-primary flex items-center gap-2">
          {saved ? (
            <>
              <FiCheck />
              Saved!
            </>
          ) : (
            <>
              <FiSettings />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const SettingToggle = ({ label, description, enabled, onToggle }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-primary-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default Settings;
