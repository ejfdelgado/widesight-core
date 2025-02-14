import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { MicVAD } from "@ricky0123/vad-web";
import { FlowchartProcessRequestData, FlowchartService, HttpService, JsonColorPipe, ModalService } from 'ejflab-front-lib';

export interface WordData {
  word: string;
  start: number;
  end: number;
  probability: number;
}

export interface SegmentData {
  text: string;
  start: number;
  end: number;
  words: Array<WordData>;
}

export interface AudioData {
  id: number;
  buffer: ArrayBuffer;
  base64: string;
  duration: number;
  start: number;
  end: number;
  extension: string;
  transcript: {
    transcription: string;
    segments: Array<SegmentData>;
  },
  diarization: Array<DiarizationData>,
  transcriptProgress: {
    ratio: number;
    processTime: number;
  },
  diarizationProgress: {
    ratio: number;
    processTime: number;
  },
  intentProgress: {
    ratio: number;
    processTime: number;
  },
}

export interface DiarizationData {
  "document_id": string;
  "start_time": number;
  "end_time": number;
  "speaker": string;
  "text": string;
  "distance": number;
  "distance_from": string;
}

@Component({
  selector: 'app-speech-to-text',
  templateUrl: './speech-to-text.component.html',
  styleUrl: './speech-to-text.component.css'
})
export class SpeechToTextComponent implements OnInit, OnDestroy {

  myvad: MicVAD | null = null;
  audios: Array<AudioData> = [];
  listening: boolean = false;
  startTime: number = 0;
  states: {
    listening: number,
    speech2text: number,
  } = {
      listening: 0,
      speech2text: 0,
    };
  language: string = 'es';
  formLeft: FormGroup;
  file_store: FileList;
  diarizationDbName: string = 'temp_random';
  queryText: string = '';
  diarizationData: {
    partial: Array<DiarizationData>;
    nspeakers: number;
  } = {
      partial: [],
      nspeakers: 0,
    };
  summaryText: string | null = null;
  summaryRatio: number = 0;

  constructor(
    public cdr: ChangeDetectorRef,
    public flowchartSrv: FlowchartService,
    public modalSrv: ModalService,
    public fb: FormBuilder,
    public httpSrv: HttpService,
    public jsonColorPipe: JsonColorPipe,
  ) {
  }

  writeString(view: DataView, offset: number, string: string) {
    for (var i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  writeFloat32(output: DataView, offset: number, input: Float32Array) {
    for (var i = 0; i < input.length; i++, offset += 4) {
      output.setFloat32(offset, input[i] as number, true)
    }
  }

  floatTo16BitPCM(
    output: DataView,
    offset: number,
    input: Float32Array
  ) {
    for (var i = 0; i < input.length; i++, offset += 2) {
      var s = Math.max(-1, Math.min(1, input[i] as number))
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }
  }

  encodeWAV(
    samples: Float32Array,
    format: number = 3,
    sampleRate: number = 16000,
    numChannels: number = 1,
    bitDepth: number = 32
  ) {
    var bytesPerSample = bitDepth / 8
    var blockAlign = numChannels * bytesPerSample
    var buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
    var view = new DataView(buffer)
    /* RIFF identifier */
    this.writeString(view, 0, "RIFF")
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * bytesPerSample, true)
    /* RIFF type */
    this.writeString(view, 8, "WAVE")
    /* format chunk identifier */
    this.writeString(view, 12, "fmt ")
    /* format chunk length */
    view.setUint32(16, 16, true)
    /* sample format (raw) */
    view.setUint16(20, format, true)
    /* channel count */
    view.setUint16(22, numChannels, true)
    /* sample rate */
    view.setUint32(24, sampleRate, true)
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * blockAlign, true)
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, blockAlign, true)
    /* bits per sample */
    view.setUint16(34, bitDepth, true)
    /* data chunk identifier */
    this.writeString(view, 36, "data")
    /* data chunk length */
    view.setUint32(40, samples.length * bytesPerSample, true)
    if (format === 1) {
      // Raw PCM
      this.floatTo16BitPCM(view, 44, samples)
    } else {
      this.writeFloat32(view, 44, samples)
    }
    return buffer
  }

  async audioFileToArray(audioFileData: Blob) {
    const ctx = new OfflineAudioContext(1, 1, 44100)
    const reader = new FileReader()
    let audioBuffer: AudioBuffer | null = null
    await new Promise<void>((res) => {
      reader.addEventListener("loadend", (ev) => {
        const audioData = reader.result as ArrayBuffer
        ctx.decodeAudioData(
          audioData,
          (buffer) => {
            audioBuffer = buffer
            ctx
              .startRendering()
              .then((renderedBuffer) => {
                console.log("Rendering completed successfully")
                res()
              })
              .catch((err) => {
                console.error(`Rendering failed: ${err}`)
              })
          },
          (e) => {
            console.log(`Error with decoding audio data: ${e}`)
          }
        )
      })
      reader.readAsArrayBuffer(audioFileData)
    })
    if (audioBuffer === null) {
      throw Error("some shit")
    }
    let _audioBuffer = audioBuffer as AudioBuffer
    let out = new Float32Array(_audioBuffer.length)
    for (let i = 0; i < _audioBuffer.length; i++) {
      for (let j = 0; j < _audioBuffer.numberOfChannels; j++) {
        // @ts-ignore
        out[i] += _audioBuffer.getChannelData(j)[i]
      }
    }
    return { audio: out, sampleRate: _audioBuffer.sampleRate }
  }

  arrayBufferToBase64(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    const binary = new Array(len)
    for (var i = 0; i < len; i++) {
      const byte = bytes[i]
      if (byte === undefined) {
        break
      }
      binary[i] = String.fromCharCode(byte)
    }
    return btoa(binary.join(""))
  }

  getRoot(): string {
    return MyConstants.SRV_ROOT;
  }

  async ngOnInit() {
    this.formLeft = this.fb.group({
      display: ['', []],
      displayFileUpload: ['', []],
    });

    this.myvad = await MicVAD.new({
      baseAssetPath: this.getRoot() + "assets/processors/",
      onnxWASMBasePath: this.getRoot() + "assets/processors/onnxruntime-web/",
      onSpeechStart: () => {
        this.states.listening = 1;
        //console.log("Speech start...");
        this.startTime = new Date().getTime();
        this.cdr.detectChanges();
      },
      onSpeechEnd: (samples) => {
        this.states.listening = 0;
        const sampleRate = 16000;
        const time = samples.length / sampleRate;
        const wavBuffer = this.encodeWAV(samples);
        const base64 = this.arrayBufferToBase64(wavBuffer);
        const url = `data:audio/wav;base64,${base64}`;
        const audio: AudioData = {
          id: new Date().getTime(),
          buffer: wavBuffer,
          base64: url,
          duration: time,
          transcriptProgress: {
            ratio: 0,
            processTime: 0,
          },
          diarizationProgress: {
            ratio: 0,
            processTime: 0,
          },
          intentProgress: {
            ratio: 0,
            processTime: 0,
          },
          start: this.startTime,
          end: new Date().getTime(),
          extension: 'wav',
          transcript: {
            transcription: '',
            segments: [],
          },
          diarization: [],
        };
        this.audios.push(audio);
        this.speechToText(audio);
        this.cdr.detectChanges();
      },
    });
  }

  start() {
    if (this.myvad) {
      this.myvad.start();
      this.listening = true;
    }
  }

  pause() {
    if (this.myvad) {
      this.myvad.pause();
      this.listening = false;
      this.states.listening = 0;
    }
  }

  ngOnDestroy() {
    if (this.myvad) {
      this.myvad.destroy();
    }
  }

  audioIdentity(index: number, item: AudioData) {
    return item.id;
  }

  async removeAudio(audio: AudioData) {
    const confirm = await this.modalSrv.confirm({
      title: '¿Sure?',
      txt: "Can't be undone.",
    });
    if (!confirm) {
      return;
    }
    const index = this.audios.indexOf(audio);
    if (index >= 0) {
      this.audios.splice(index, 1);
      this.cdr.detectChanges();
    }
  }

  async speechToText(audio: AudioData) {
    this.states.speech2text += 1;
    try {
      audio.transcriptProgress.processTime = 0;
      const startTime = new Date().getTime();
      const payload: FlowchartProcessRequestData = {
        loadingIndicator: false,
        channel: 'post',
        processorMethod: 'speechToText1.transcript',
        room: 'processors',
        namedInputs: {
          bytes: new Uint8Array(audio.buffer),
          timeline: {
            t: 0,
            end: audio.duration,
            period: audio.duration,
          }
        },
        data: {
          language: this.language,
          extension: audio.extension,
          min_duration_ms: audio.duration,
        },
      };
      this.cdr.detectChanges();
      const response = await this.flowchartSrv.process(payload, false);
      if (response.status == 'ok' && response?.response?.data?.transcript) {
        audio.transcript = response?.response?.data?.transcript;
        audio.transcriptProgress.processTime = (new Date().getTime() - startTime) / 1000;
        audio.transcriptProgress.ratio = 100 * (audio.transcriptProgress.processTime / audio.duration);
        // Fire diarization
        this.diarization(audio);
        this.cdr.detectChanges();
      } else {
        this.modalSrv.alert({
          title: 'Error',
          txt: JSON.stringify(response, null, 4),
        });
      }
    } catch (err) {
      this.states.speech2text -= 1;
    }
  }

  async diarization(audio: AudioData) {
    audio.diarizationProgress.processTime = 0;
    const startTime = new Date().getTime();
    const payload: FlowchartProcessRequestData = {
      id: `manual_${audio.id}`,
      loadingIndicator: false,
      channel: 'post',
      processorMethod: 'audioFeature1.diarization',
      room: 'processors',
      namedInputs: {
        diarization: this.diarizationData,//unused
        transcript: audio.transcript,//OK
        bytes: new Uint8Array(audio.buffer),//OK
        timeline: {//OK
          t: 0,
          period: audio.duration,
          end: audio.duration,
        },
      },
      data: {
        extension: audio.extension,
        db: this.diarizationDbName,//temporal use_database
        collection: "diarization",//temporal collection
      },
    };
    this.cdr.detectChanges();
    const response = await this.flowchartSrv.process(payload, false);
    if (response?.response?.data?.diarization) {
      this.diarizationData = response.response.data.diarization;
      audio.diarization = this.diarizationData.partial;
      audio.diarizationProgress.processTime = (new Date().getTime() - startTime) / 1000;
      audio.diarizationProgress.ratio = 100 * (audio.diarizationProgress.processTime / audio.duration);
      this.indexIntent(audio);// Fire indexing
      this.cdr.detectChanges();
    }
  }

  async indexIntent(audio: AudioData) {
    audio.intentProgress.processTime = 0;
    const startTime = new Date().getTime();
    const payload: FlowchartProcessRequestData = {
      id: `manual_${audio.id}`,
      loadingIndicator: false,
      channel: 'post',
      processorMethod: 'milvusIx1.indexintent',
      room: 'processors',
      namedInputs: {
        media: {
          startTime: 0,
        },
        diarization: {
          partial: audio.diarization
        },
        transcript: audio.transcript,
      },
      data: {
        indexsql: false,
        indexintent: false,
        db: this.diarizationDbName,//use_database
        collection: "intent",//collection
      },
      dbData: {
        accountId: "",
        appId: "",
        mediaId: "",
        mediaType: ""
      }
    };
    this.cdr.detectChanges();
    const response = await this.flowchartSrv.process(payload, false);

    if (response) {
      audio.intentProgress.processTime = (new Date().getTime() - startTime) / 1000;
      audio.intentProgress.ratio = 100 * (audio.intentProgress.processTime / audio.duration);
      this.cdr.detectChanges();
    }
  }

  async summarize() {
    // Debe recorrer todos y convertir
    const startTime = new Date().getTime();
    let totalDuration = 0;
    this.summaryRatio = 0;
    const rows = [];
    for (let i = 0; i < this.audios.length; i++) {
      const audio = this.audios[i];
      totalDuration += audio.duration;
      const diarizations = audio.diarization;
      for (let j = 0; j < diarizations.length; j++) {
        const diarization = diarizations[j];
        rows.push({
          txt: `${diarization.speaker}: ${diarization.text}`,
        })
      }
    }

    if (rows.length == 0) {
      this.modalSrv.alert({ txt: "No conversation found to summarize." });
      return;
    }

    const payload: FlowchartProcessRequestData = {
      id: `id_${new Date().getTime()}`,
      loadingIndicator: true,
      channel: 'post',
      processorMethod: 'llm.summary',
      room: 'processors',
      namedInputs: {
        source: {
          rows
        }
      },
      data: {
        prefixPrompt: 'Describe la situación en español:',
        maxTokens: 1000,
      },
    };

    const response = await this.flowchartSrv.process(payload, false);
    const endTime = new Date().getTime();
    const processTime = (endTime - startTime) / 1000;

    this.summaryRatio = 100 * (processTime) / totalDuration;

    const summary = response?.response?.data?.summary;
    if (response && summary) {
      this.summaryText = summary;
    }
  }

  async getMeta(audio: AudioData) {
    const payload: FlowchartProcessRequestData = {
      id: `manual_${audio.id}`,
      loadingIndicator: false,
      channel: 'post',
      processorMethod: 'localFiles1.bytesmeta',
      room: 'processors',
      namedInputs: {
        bytes: new Uint8Array(audio.buffer),
        media: {
          startTime: 1,
        }
      },
      data: {
        extension: audio.extension
      },
    };
    this.cdr.detectChanges();
    const response = await this.flowchartSrv.process(payload, false);
    const metadata = response?.response?.data?.metadata;
    if (metadata) {
      audio.duration = metadata.seconds;
      const ahora = new Date().getTime();
      audio.start = ahora;
      audio.end = ahora + 1000 * audio.duration;
    }
  }

  handleFileInputChange(l: FileList | null): void {
    if (!l) {
      console.log('No data');
      return;
    }
    this.file_store = l;
    const display = this.formLeft.get('display');
    if (!display) {
      return;
    }
    if (l.length) {
      const f = l[0];
      const count = l.length > 1 ? `(+${l.length - 1} files)` : '';
      display.patchValue(`${f.name}${count}`);
    } else {
      display.patchValue('');
    }
  }

  async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();

      reader.onload = function (e) {
        const temp: any = reader.result;
        //let arrayBuffer = new Uint8Array(temp);
        resolve(temp)
      }
      reader.readAsArrayBuffer(file);
    });
  }

  async uploadFile() {
    if (!this.file_store || this.file_store.length == 0) {
      this.modalSrv.alert({ txt: 'Select some file' });
      return;
    }
    const file = this.file_store[0];
    const name = file.name;
    const fileParts = /\.([^.]+)$/.exec(name);
    if (!fileParts) {
      this.modalSrv.alert({ txt: `Can't deduce extension from ${name}` });
      return;
    }
    const extension = fileParts[1];
    const soundBuffer = await this.fileToArrayBuffer(file);
    const base64 = this.arrayBufferToBase64(soundBuffer);
    const url = `data:audio/wav;base64,${base64}`;
    const audio: AudioData = {
      id: new Date().getTime(),
      buffer: soundBuffer,
      base64: url,
      // getMeta will complete this info
      duration: 0,
      start: 0,
      end: 0,
      transcriptProgress: {
        ratio: 0,
        processTime: 0,
      },
      diarizationProgress: {
        ratio: 0,
        processTime: 0,
      },
      intentProgress: {
        ratio: 0,
        processTime: 0,
      },
      extension,
      transcript: {
        transcription: '',
        segments: [],
      },
      diarization: [],
    };
    await this.getMeta(audio);
    this.speechToText(audio);
    this.audios.push(audio);
    this.cdr.detectChanges();
  }

  async execute(action: string, db: string = '', collection: string = '', json: string = '', path: string = '') {
    const response = await this.httpSrv.post<any>(
      `srv/milvus/admin`,
      {
        action,
        db,
        collection,
        json,
        path,
      },
      {
        showIndicator: true,
      }
    );
    return response;
  }

  async createDiarizationDB() {
    try {
      await this.execute("database.destroy", this.diarizationDbName);
    } catch (err) { }
    await this.execute("database.create", this.diarizationDbName);
    const diarizationCollection = {
      json: './flowcharts/audio/flow01milvus.json',
      path: 'diarization',
    }
    await this.execute("collection.create", this.diarizationDbName, '', diarizationCollection.json, diarizationCollection.path);
    const intentCollection = {
      json: './flowcharts/audio/flow01milvus.json',
      path: 'intent',
    }
    await this.execute("collection.create", this.diarizationDbName, '', intentCollection.json, intentCollection.path);
    this.resetSpeakers();
  }

  resetSpeakers() {
    this.diarizationData = {
      partial: [],
      nspeakers: 0,
    };
  }

  async searchIntent() {
    const payload: FlowchartProcessRequestData = {
      id: `x`,
      loadingIndicator: true,
      channel: 'post',
      processorMethod: 'milvusIx1.searchintent',
      room: 'processors',
      namedInputs: {
        query: this.queryText,
        k: 1,
      },
      data: {
        db: this.diarizationDbName,//use_database
        collection: "intent",//collection
      },
    };
    const response = await this.flowchartSrv.process(payload, false);
    const html = "<pre>" + this.jsonColorPipe.transform(response) + "</pre>";
    this.modalSrv.alert({ title: "Detail", txt: html, ishtml: true });
  }

  showAudioDetail(audio: AudioData) {
    const html = "<pre>" + this.jsonColorPipe.transform(audio) + "</pre>";
    this.modalSrv.alert({ title: "Detail", txt: html, ishtml: true });
  }
}
