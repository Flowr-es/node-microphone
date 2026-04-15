'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const EventEmitter = require('events');
const os = require('os');

function createFakeChild() {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.killCalls = [];
    child.kill = function (signal) {
        this.killCalls.push(signal);
    };
    return child;
}

function loadMicrophoneFor(osName, spawnCalls) {
    const originalSpawn = childProcess.spawn;
    const originalType = os.type;
    const modulePath = require.resolve('./index.js');

    childProcess.spawn = function (command, args, options) {
        const child = createFakeChild();
        spawnCalls.push({ command, args, options, child });
        return child;
    };
    os.type = function () {
        return osName;
    };

    delete require.cache[modulePath];

    try {
        return require('./index.js');
    } finally {
        childProcess.spawn = originalSpawn;
        os.type = originalType;
        delete require.cache[modulePath];
    }
}

function testLinuxLifecycle() {
    const spawnCalls = [];
    const Microphone = loadMicrophoneFor('Linux', spawnCalls);
    const mic = new Microphone({
        rate: '44100',
        channels: '2',
        fileType: 'wav',
        additionalParameters: ['--buffer-size', '256'],
        spawnOptions: { cwd: '/tmp' },
        useDataEmitter: true,
    });

    const stream = mic.startRecording();

    assert.strictEqual(spawnCalls.length, 1);
    assert.strictEqual(spawnCalls[0].command, 'arecord');
    assert.deepStrictEqual(spawnCalls[0].options, { cwd: '/tmp' });
    assert.deepStrictEqual(spawnCalls[0].args, [
        '-c',
        '2',
        '-r',
        '44100',
        '-f',
        'S16_LE',
        '-t',
        'wav',
        '-D',
        'plughw:1,0',
        '--buffer-size',
        '256',
    ]);
    assert.strictEqual(stream, spawnCalls[0].child.stdout);
    assert.strictEqual(mic.startRecording(), undefined);

    let infoPayload;
    let dataPayload;
    let closePayload;

    mic.on('info', function (info) {
        infoPayload = info;
    });
    mic.on('data', function (data) {
        dataPayload = data;
    });
    mic.on('close', function (code, signal) {
        closePayload = { code, signal };
    });

    spawnCalls[0].child.stderr.emit('data', Buffer.from('stderr'));
    spawnCalls[0].child.stdout.emit('data', Buffer.from('audio'));
    spawnCalls[0].child.emit('close', 0, null);

    assert.strictEqual(infoPayload.toString(), 'stderr');
    assert.strictEqual(dataPayload.toString(), 'audio');
    assert.deepStrictEqual(closePayload, { code: 0, signal: null });
    assert.strictEqual(mic.ps, null);

    mic.startRecording();
    assert.strictEqual(spawnCalls.length, 2);
}

function testWindowsCommand() {
    const spawnCalls = [];
    const Microphone = loadMicrophoneFor('Windows_NT', spawnCalls);
    const mic = new Microphone({ device: 'microphone' });

    mic.startRecording();

    assert.strictEqual(spawnCalls.length, 1);
    assert.strictEqual(spawnCalls[0].command, 'sox');
    assert.deepStrictEqual(spawnCalls[0].args, [
        '-t',
        'waveaudio',
        'microphone',
        '-b',
        '16',
        '--endian',
        'little',
        '-c',
        '1',
        '-r',
        '16000',
        '-e',
        'signed-integer',
        '-t',
        'raw',
        '-',
    ]);
}

function testMacCommandAndStop() {
    const spawnCalls = [];
    const Microphone = loadMicrophoneFor('Darwin', spawnCalls);
    const mic = new Microphone({
        device: 'Built-in Microphone',
        spawnOptions: { env: { CUSTOM_FLAG: '1' } },
    });

    mic.startRecording();
    mic.stopRecording();

    assert.strictEqual(spawnCalls.length, 1);
    assert.strictEqual(spawnCalls[0].command, 'rec');
    assert.deepStrictEqual(spawnCalls[0].args, [
        '-q',
        '-b',
        '16',
        '-c',
        '1',
        '-r',
        '16000',
        '-e',
        'signed-integer',
        '-t',
        'raw',
        '-',
    ]);
    assert.strictEqual(
        spawnCalls[0].options.env.AUDIODEV,
        'Built-in Microphone',
    );
    assert.strictEqual(spawnCalls[0].options.env.CUSTOM_FLAG, '1');
    assert.deepStrictEqual(spawnCalls[0].child.killCalls, [undefined]);
    assert.strictEqual(mic.ps, null);
}

function testInvalidOptions() {
    const spawnCalls = [];
    const Microphone = loadMicrophoneFor('Linux', spawnCalls);

    assert.throws(function () {
        return new Microphone({ endian: 'middle' });
    }, /endian must be 'big' or 'little'/);

    assert.throws(function () {
        return new Microphone({ useDataEmitter: 'yes' });
    }, /useDataEmitter must be a boolean/);

    assert.throws(function () {
        return new Microphone({ additionalParameters: ['--buffer-size', 256] });
    }, /additionalParameters must be an array of strings or false/);

    assert.throws(function () {
        return new Microphone({ spawnOptions: { stdio: 'ignore' } });
    }, /spawnOptions\.stdio is not supported/);
}

testLinuxLifecycle();
testWindowsCommand();
testMacCommandAndStop();
testInvalidOptions();
