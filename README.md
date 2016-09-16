# node-microphone
![](http://img.shields.io/badge/stability-stable-orange.svg?style=flat)
![](http://img.shields.io/npm/v/node-microphone.svg?style=flat)
![](http://img.shields.io/npm/dm/node-microphone.svg?style=flat)
![](http://img.shields.io/npm/l/node-microphone.svg?style=flat)
## Information
node-microphone is a module that use arecord ALSA tools on Linux or SoX on Windows & OSX method to start and stop recording sound from a USB Microphone in PCM</td>

## Notice
Version 0.1.0 API is incompatible to 0.0.x ! 
It is currently only tested with Windows (sox 14.4.2), will be also tested with Raspbian in the near future.
As it uses EcmasScript 2015 code it will probably not work with older Node Versions (works with NodeJs 5.10.0)

For Windows do not forget to add sox to your environment variables.

## Roadmap
Optional Silence Detection
Mac and Linux tests
Unit-Tests
Optimizations

## Dependencies

This library need

* ALSA tools installed on the machine (`sudo apt-get install alsa-utils`) **for Linux**
* SoX Tools installed on the machine **for Windows or OSX**

## Usage

#### Simple example

A simple example how to use this module.

    let Mic = require('node-microphone');
	let mic = new Mic();
	let micStream = mic.startRecording();
	micStream.pipe( myWritableStream );
	setTimeout(() => {
        logger.info('stopped recording');
        mic.stopRecording();
    }, 3000);
	mic.on('info', (info) => {
		console.log(info);
	});
	mic.on('error', (error) => {
		console.log(error);
	});
    

## API

### new Class(options)

Create a new Class of the microphone module.
You can give an options Object with the class.
        options - JSON containing sound options.Following are valid options:
        endian: big OR little, default: little
        bitwidth: 8 OR 16 OR 24 OR anything valid supported by arecord OR sox, default: 16
        encoding: signed - integer OR unsinged- integer(none of the other encoding formats are supported), default:signed - integer
        rate: 8000 OR 16000 OR 44100 OR anything valid supported by arecord OR sox, default: 16000
        channels: 1 OR 2 OR anything valid supported by arecord OR sox, default: 1(mono)
        device: hw: 0, 0 OR plughw: 1, 0 OR anything valid supported by arecord. For sox it is taken as waveaudio drive.

#### startRecording()

Start the recording with the given sound options in the class.
Creates a new child process.
It will return the recording PCM Wave Stream as Node Stream.

#### stopRecording();

Stops the child process 

#### events

The Microphone Class is extended by events: info and error
See simple example, how to use them.

## CONTRIBUTORS
Thanks to ashishbajaj99 and vincentsaluzzo for their node microphone modules.

## LICENSE

(MIT License)

Copyright (c) 2016 Carlos Knoke Flores <carlos@knoke.net>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


