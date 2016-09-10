'use strict'
var isMac = require('os').type() == 'Darwin';
var isWin = require('os').type().indexOf('Windows') > -1;
var spawn = require('child_process').spawn

class Microphone {
    constructor(options) {
        this.ps = null;

        options = options || {};
        this.endian = options.endian || 'little';
        this.bitwidth = options.bitwidth || '16';
        this.encoding = options.encoding || 'signed-integer';
        this.rate = options.rate || '16000';
        this.channels = options.channels || '1';

        if (!isWin && !isMac) {
            this.device = options.device || 'plughw:1,0';
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
            this.format = this.formatEncoding + this.bitwidth + '_' + this.formatEndian;
        }


    }
      
    // end on silence - default threshold 0.5
    //'silence', '1', '0.1', options.threshold + '%',
    //'1', '1.0', options.threshold + '%'

    startRecording() {
        if (this.ps === null) {
            if (isWin) {         
                this.ps = spawn('sox', ['-b', this.bitwidth, '--endian', this.endian, '-c', this.channels, '-r', this.rate, '-e', this.encoding, '-t', 'waveaudio', 'default', '-p']);
            } else if (isMac) {
                this.ps = spawn('rec', ['q', '-b', this.bitwidth, '-c', this.channels, '-r', this.rate, '-e', this.encoding, '-t', 'wav', '-']);  
            } else {
                this.ps = spawn('arecord', ['-c', this.channels, '-r', this.rate, '-f', this.format, '-D', this.device]);
            }
            this.ps.on('error', (error) => { console.log(error.message); });
            return this.ps.stdout;
           
        }
    }

    stopRecording() {
        if (this.ps) {
            console.log('here');
         
            this.ps.stdout.close();
            this.ps.kill();
            this.ps = null;
        }
    }
}

module.exports = Microphone;
