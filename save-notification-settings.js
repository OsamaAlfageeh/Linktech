import axios from 'axios';

// Usage examples:
//   API_BASE=https://linktech.app USERNAME=tech_solutions PASSWORD=password123 node save-notification-settings.js --email=true --push=false --messages=true --offers=true --system=true
//   node save-notification-settings.js --email=false --messages=true (defaults API_BASE http://localhost:5000 and demo creds)

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const USERNAME = process.env.USERNAME || 'tech_solutions';
const PASSWORD = process.env.PASSWORD || 'password123';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

function parseBool(val, fallback) {
  if (val === undefined) return fallback;
  if (typeof val === 'boolean') return val;
  const v = String(val).toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(v)) return false;
  return fallback;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const part = argv[i];
    if (!part.startsWith('--')) continue;
    const [key, raw] = part.slice(2).split('=');
    args[key] = raw === undefined ? true : raw;
  }
  return args;
}

async function login(username, password) {
  const { data } = await api.post('/api/auth/login', { username, password });
  if (!data?.token) throw new Error('No token returned by login');
  api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
  return data.user;
}

async function getSettings() {
  const { data } = await api.get('/api/user/settings');
  return data;
}

async function saveSettings(settings) {
  const { data } = await api.post('/api/user/settings', settings);
  return data;
}

async function main() {
  try {
    const argv = parseArgs(process.argv);
    const desired = {
      emailNotifications: parseBool(argv.email, undefined),
      pushNotifications: parseBool(argv.push, undefined),
      messageNotifications: parseBool(argv.messages, undefined),
      offerNotifications: parseBool(argv.offers, undefined),
      systemNotifications: parseBool(argv.system, undefined),
    };

    console.log(`API_BASE: ${API_BASE}`);
    console.log('Logging in...');
    const user = await login(USERNAME, PASSWORD);
    console.log(`Logged in as ${user.username} (id=${user.id})`);

    console.log('Fetching current settings...');
    const current = await getSettings();
    console.log('Current:', current);

    // Only include keys that were provided; fallback to current for others
    const toSave = {
      emailNotifications: desired.emailNotifications ?? current.emailNotifications ?? true,
      pushNotifications: desired.pushNotifications ?? current.pushNotifications ?? true,
      messageNotifications: desired.messageNotifications ?? current.messageNotifications ?? true,
      offerNotifications: desired.offerNotifications ?? current.offerNotifications ?? true,
      systemNotifications: desired.systemNotifications ?? current.systemNotifications ?? true,
    };

    console.log('Saving:', toSave);
    const saved = await saveSettings(toSave);
    console.log('Saved response:', saved);

    console.log('Verifying...');
    const after = await getSettings();
    console.log('After:', after);

    const ok = Object.keys(toSave).every(k => String(after?.[k]) === String(toSave[k]));
    if (!ok) {
      console.error('❌ Verification failed: saved settings do not match.');
      process.exit(1);
    }

    console.log('✅ Notification settings saved and verified successfully.');
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

main();



