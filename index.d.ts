/// <reference types="node" />

import { EventEmitter } from 'events';
import { Readable } from 'stream';

declare namespace Microphone {
    type Endian = 'big' | 'little';

    interface Options {
        endian?: Endian;
        bitwidth?: string | number;
        encoding?: 'signed-integer' | 'unsigned-integer' | string;
        rate?: string | number;
        channels?: string | number;
        fileType?: string;
        additionalParameters?: string[] | false;
        spawnOptions?: import('child_process').SpawnOptionsWithoutStdio;
        useDataEmitter?: boolean;
        device?: string;
    }

    interface InfoEvents {
        info: (info: Buffer) => void;
        data: (data: Buffer) => void;
        error: (error: Error) => void;
        close: (code: number | null, signal: NodeJS.Signals | null) => void;
    }
}

declare class Microphone extends EventEmitter {
    constructor(options?: Microphone.Options);

    ps: import('child_process').ChildProcessWithoutNullStreams | null;
    endian: Microphone.Endian;
    bitwidth: string;
    encoding: string;
    rate: string;
    channels: string;
    fileType: string;
    additionalParameters: string[] | false;
    spawnOptions?: import('child_process').SpawnOptionsWithoutStdio;
    useDataEmitter: boolean;
    device?: string;
    format?: string;
    formatEndian?: string;
    formatEncoding?: string;

    startRecording(): Readable | undefined;
    stopRecording(): void;

    on<U extends keyof Microphone.InfoEvents>(
        event: U,
        listener: Microphone.InfoEvents[U],
    ): this;
    once<U extends keyof Microphone.InfoEvents>(
        event: U,
        listener: Microphone.InfoEvents[U],
    ): this;
    emit<U extends keyof Microphone.InfoEvents>(
        event: U,
        ...args: Parameters<Microphone.InfoEvents[U]>
    ): boolean;
}

export = Microphone;
