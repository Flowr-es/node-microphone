# node-microphone

![](https://img.shields.io/badge/stability-stable-orange.svg?style=flat)
![](https://img.shields.io/npm/v/node-microphone.svg?style=flat)
![](https://img.shields.io/npm/dm/node-microphone.svg?style=flat)
![](https://img.shields.io/npm/l/node-microphone.svg?style=flat)

`node-microphone` provides microphone input in Node.js by spawning platform tools:

- Linux: `arecord`
- macOS: `rec` from SoX
- Windows: `sox`

It returns the underlying PCM stream and also exposes `info`, `error`, and optional `data` events through an `EventEmitter` API.

The current 0.2.0 release also improves a few rough edges from 0.1.6:

- consistent default output format across platforms with `fileType: 'raw'`
- bundled TypeScript declarations
- constructor validation for invalid option values
- automatic cleanup when the recorder process closes
- test coverage for command generation and lifecycle behavior

## Requirements

Install the audio capture tool for your platform before using the package.

- Linux: ALSA tools, for example `sudo apt-get install alsa-utils`
- macOS: SoX, with the `rec` command available in `PATH`
- Windows: SoX, with `sox` available in `PATH`

## Install

```bash
npm install node-microphone
```

TypeScript declarations are bundled with the package.
The package now targets Node.js 12+.

## What's New In 0.2.0

Compared with 0.1.6, version 0.2.0 adds and changes:

- TypeScript support through bundled `index.d.ts`
- a new `fileType` option so Linux, macOS, and Windows can produce the same output type by default
- a new `spawnOptions` option for passing supported `child_process.spawn()` settings
- a new `close` event emitted when the recording process exits
- safer constructor validation for malformed options such as invalid `endian`, non-boolean `useDataEmitter`, or unsupported `spawnOptions.stdio`
- internal process cleanup so a `Microphone` instance can be started again after the child exits
- refreshed package metadata, repository links, and automated tests

## Usage

```js
const Microphone = require('node-microphone');

const mic = new Microphone({
    rate: '16000',
    channels: '1',
    fileType: 'raw',
});

const micStream = mic.startRecording();

if (micStream) {
	micStream.pipe(myWritableStream);
}

mic.on('info', (info) => {
	console.log(info.toString());
});

mic.on('error', (error) => {
	console.error(error);
});

setTimeout(() => {
	mic.stopRecording();
}, 3000);
```

If `useDataEmitter` is enabled, audio chunks are also emitted through `mic.on('data', chunk)` in addition to being available from the returned stream.
Invalid option values throw synchronously from the constructor with a `TypeError`.

## API

### `new Microphone(options)`

Creates a new microphone instance.

| Option | Value | Default |
| --- | --- | --- |
| `endian` | `'big'` or `'little'` | `'little'` |
| `bitwidth` | `8`, `16`, `24`, or any value supported by the backend tool | `'16'` |
| `encoding` | `'signed-integer'`, `'unsigned-integer'`, or backend-specific value | `'signed-integer'` |
| `rate` | Sample rate supported by the backend tool | `'16000'` |
| `channels` | Channel count supported by the backend tool | `'1'` |
| `fileType` | Output container or stream type supported by the backend tool | `'raw'` |
| `device` | Input device identifier | Linux: `'plughw:1,0'`, Windows: `'default'`, macOS: SoX/CoreAudio device name |
| `additionalParameters` | Raw string arguments appended to the spawn command | `false` |
| `spawnOptions` | Options object passed to `child_process.spawn()` except `stdio` | `undefined` |
| `useDataEmitter` | Emit audio chunks through the `data` event | `false` |

Notes:

- On Linux, the package uses `arecord -f <format> -t <fileType> -D <device>`.
- On macOS, the package uses `rec -t <fileType> -`.
- On Windows, the package uses `sox -t waveaudio <device> ... -t <fileType> -`.
- On macOS, when `device` is provided, the package passes it through SoX's `AUDIODEV` environment variable.
- `spawnOptions.stdio` is intentionally rejected because the library depends on piped `stdout` and `stderr`.

### `startRecording()`

Starts the recording process and returns the spawned process `stdout` stream. If recording is already active, it returns `undefined`.

### `stopRecording()`

Stops the spawned recording process and clears the internal process reference.

### Events

- `info`: stderr output from the recording command as a `Buffer`
- `error`: process or stream error
- `close`: emitted when the recording process closes
- `data`: stdout audio chunk as a `Buffer` when `useDataEmitter` is enabled

## TypeScript

```ts
import Microphone = require('node-microphone');

const mic = new Microphone({
    rate: 16000,
    channels: 1,
    fileType: 'wav',
});

mic.on('close', (code, signal) => {
	console.log(code, signal);
});
```

## Testing

```bash
npm test
```

The test suite covers Linux, macOS, and Windows command construction using mocked child processes.

## Credits

Thanks to ashishbajaj99 and vincentsaluzzo for related microphone modules that helped shape this package.

## License

MIT. See `LICENSE`.
