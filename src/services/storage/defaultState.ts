import { DashboardState } from '../../types/dashboard';
import { createNewDeviceIdentity } from '../device/deviceService';

export const DEFAULT_DASHBOARD_STATE: DashboardState = {
  version: 1,
  schemaVersion: 2,
  app: 'PersonalDashboard',
  device: createNewDeviceIdentity(),
  sync: {
    enabled: false,
    syncGroupId: null,
    lastServerRevision: 0,
    pendingChanges: [],
    pairedDevices: [],
    serverUrl: '',
    syncStatus: 'LOCAL_ONLY',
  },
  theme: {
    themePreset: 'matrix',
    backgroundType: 'gradient',
    backgroundValue: 'radial-gradient(ellipse at top, #0c2417 0%, #050f0a 45%, #010402 100%)',
    accentColor: '#00ff66',
    accentRgb: '0, 255, 102',
    secondaryColor: '#7ba38e',
    glassOpacity: 0.72,
    glassBlur: 16,
    borderIntensity: 0.2,
  },
  preferences: {
    timeFormat: '12h',
    weather: {
      city: 'Pune',
      lat: 18.5204,
      lon: 73.8567,
      units: 'metric',
      autoDetect: false,
    },
    google: {
      enabled: false,
      clientId: '',
    },
    reminders: [],
  },
  bookmarkGroups: [],
};
