const fs = require('fs');
const { promisify } = require('util');
const path = require('path');
const { EventEmitter } = require('events');

const fsp = {
  readFile: promisify(fs.readFile),
  writeFile: promisify(fs.writeFile),
};

const SETTINGS_FILE_PATH = path.resolve(process.cwd(), 'server-settings.json');
const settingsEvents = new EventEmitter();

function emitSettingUpdate(key, value) {
  settingsEvents.emit(`set:${key}`, value);
}

function readSettings() {
  return fsp.readFile(SETTINGS_FILE_PATH, 'utf8')
    .then((fileBuffer) => JSON.parse(fileBuffer))
    .then((settingsRead) => {
      settingsEvents.emit('readFromDisk', settingsRead);
      return settingsRead;
    });
}

let settings = {};

settingsEvents.on('readFromDisk', (settingsRead) => {
  settings = settingsRead;
  Object.entries(settingsRead).forEach(([key, value]) => emitSettingUpdate(key, value));
});
// initial read :S
setTimeout(readSettings, 2e3);


function writeSettings() {
  return Promise.resolve()
    .then(() => JSON.stringify(settings, null, 2))
    .then((stringified) => fsp.writeFile(SETTINGS_FILE_PATH, stringified, 'utf8'))
    .then(() => settingsEvents.emit('writtenToDisk'));
}

function get(key) {
  return settings[key];
}

function set(key, value) {
  settings[key] = value;
  emitSettingUpdate(key, value);
  return writeSettings();
}

module.exports = {
  get,
  set,
  readSettings,
  // eventing
  addListener: (...args) => settingsEvents.addListener(...args),
  addOnceListener: (...args) => settingsEvents.once(...args),
  removeListener: (...args) => settingsEvents.removeListener(...args),
};
