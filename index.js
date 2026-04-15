'use strict';
const osType = require('os').type();
const isMac = osType === 'Darwin';
const isWin = osType.indexOf('Windows') > -1;
const spawn = require('child_process').spawn;
const EventEmitter = require('events');

function normalizeStringOption(name, value, defaultValue) {
    const normalizedValue = value === undefined ? defaultValue : value;

    if (
        typeof normalizedValue !== 'string' &&
        typeof normalizedValue !== 'number'
    ) {
        throw new TypeError(name + ' must be a string or number');
    }

    const stringValue = String(normalizedValue);

    if (stringValue.trim() === '') {
        throw new TypeError(name + ' must not be empty');
    }

    return stringValue;
}

function normalizeEndian(value) {
    const endian = normalizeStringOption('endian', value, 'little');

    if (endian !== 'big' && endian !== 'little') {
        throw new TypeError("endian must be 'big' or 'little'");
    }

    return endian;
}

function normalizeBooleanOption(name, value, defaultValue) {
    if (value === undefined) {
        return defaultValue;
    }

    if (typeof value !== 'boolean') {
        throw new TypeError(name + ' must be a boolean');
    }

    return value;
}

function normalizeAdditionalParameters(value) {
    if (value === undefined || value === false) {
        return false;
    }

    if (
        !Array.isArray(value) ||
        value.some((item) => typeof item !== 'string')
    ) {
        throw new TypeError(
            'additionalParameters must be an array of strings or false',
        );
    }

    return value.slice();
}

function normalizeSpawnOptions(value) {
    if (value === undefined) {
        return undefined;
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new TypeError('spawnOptions must be an object');
    }

    if (Object.prototype.hasOwnProperty.call(value, 'stdio')) {
        throw new TypeError(
            'spawnOptions.stdio is not supported because node-microphone requires stdout and stderr pipes',
        );
    }

    return Object.assign({}, value);
}

class Microphone extends EventEmitter {
    constructor(options) {
        super();
        this.ps = null;

        options = options || {};
        this.endian = normalizeEndian(options.endian);
        this.bitwidth = normalizeStringOption(
            'bitwidth',
            options.bitwidth,
            '16',
        );
        this.encoding = normalizeStringOption(
            'encoding',
            options.encoding,
            'signed-integer',
        );
        this.rate = normalizeStringOption('rate', options.rate, '16000');
        this.channels = normalizeStringOption(
            'channels',
            options.channels,
            '1',
        );
        this.fileType = normalizeStringOption(
            'fileType',
            options.fileType,
            'raw',
        );
        this.additionalParameters = normalizeAdditionalParameters(
            options.additionalParameters,
        );
        this.spawnOptions = normalizeSpawnOptions(options.spawnOptions);
        this.useDataEmitter = normalizeBooleanOption(
            'useDataEmitter',
            options.useDataEmitter,
            false,
        );
        if (isWin) {
            this.device = normalizeStringOption(
                'device',
                options.device,
                'default',
            );
        }
        if (isMac && options.device !== undefined) {
            this.device = normalizeStringOption(
                'device',
                options.device,
                options.device,
            );
        }
        if (!isWin && !isMac) {
            this.device = normalizeStringOption(
                'device',
                options.device,
                'plughw:1,0',
            );
            this.format = undefined;
            this.formatEndian = undefined;
            this.formatEncoding = undefined;

            if (this.encoding === 'unsigned-integer') {
                this.formatEncoding = 'U';
            } else {
                this.formatEncoding = 'S';
            }
            if (this.endian === 'big') {
                this.formatEndian = 'BE';
            } else {
                this.formatEndian = 'LE';
            }
            this.format =
                this.formatEncoding + this.bitwidth + '_' + this.formatEndian;
        }
    }

    // end on silence - default threshold 0.5
    //'silence', '1', '0.1', options.threshold + '%',
    //'1', '1.0', options.threshold + '%'

    startRecording() {
        let audioOptions;
        let command;
        if (this.ps === null) {
            if (isWin) {
                audioOptions = [
                    '-t',
                    'waveaudio',
                    this.device,
                    '-b',
                    this.bitwidth,
                    '--endian',
                    this.endian,
                    '-c',
                    this.channels,
                    '-r',
                    this.rate,
                    '-e',
                    this.encoding,
                    '-t',
                    this.fileType,
                    '-',
                ];
                command = 'sox';
            } else if (isMac) {
                audioOptions = [
                    '-q',
                    '-b',
                    this.bitwidth,
                    '-c',
                    this.channels,
                    '-r',
                    this.rate,
                    '-e',
                    this.encoding,
                    '-t',
                    this.fileType,
                    '-',
                ];
                command = 'rec';
            } else {
                audioOptions = [
                    '-c',
                    this.channels,
                    '-r',
                    this.rate,
                    '-f',
                    this.format,
                    '-t',
                    this.fileType,
                    '-D',
                    this.device,
                ];
                command = 'arecord';
            }

            if (this.additionalParameters) {
                audioOptions = audioOptions.concat(this.additionalParameters);
            }

            let spawnOptions = this.spawnOptions;

            if (isMac && this.device !== undefined) {
                spawnOptions = Object.assign({}, this.spawnOptions, {
                    env: Object.assign(
                        {},
                        process.env,
                        this.spawnOptions && this.spawnOptions.env,
                        { AUDIODEV: this.device },
                    ),
                });
            }

            this.ps = spawn(command, audioOptions, spawnOptions);

            const childProcess = this.ps;

            childProcess.on('error', (error) => {
                this.emit('error', error);
            });
            childProcess.on('close', (code, signal) => {
                if (this.ps === childProcess) {
                    this.ps = null;
                }
                this.emit('close', code, signal);
            });
            childProcess.stderr.on('error', (error) => {
                this.emit('error', error);
            });
            childProcess.stderr.on('data', (info) => {
                this.emit('info', info);
            });
            if (this.useDataEmitter) {
                childProcess.stdout.on('data', (data) => {
                    this.emit('data', data);
                });
            }
            return childProcess.stdout;
        }

        return undefined;
    }

    stopRecording() {
        if (this.ps) {
            this.ps.kill();
            this.ps = null;
        }
    }
}

module.exports = Microphone;
