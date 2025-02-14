import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FileBase64Data, IndicatorService, JsonColorPipe } from 'ejflab-front-lib';
import { FlowChartRef } from 'ejflab-front-lib';
import { ImagepickerOptionsData } from 'ejflab-front-lib';
import { CallService } from 'ejflab-front-lib';
import {
  FlowchartProcessRequestData,
  FlowchartService,
} from 'ejflab-front-lib';
import { HttpService } from 'ejflab-front-lib';
import { MinioService } from 'ejflab-front-lib';
import { ModalService } from 'ejflab-front-lib';
import { MongoReadData, MongoService } from 'ejflab-front-lib';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { MyUtilities } from '@ejfdelgado/ejflab-common/src/MyUtilities';

import {
  AccountData,
  AnswerData,
  ChatGPT4AllSessionData,
  FlowchartRoomsProgressData,
  ImgFaceData,
  JobData,
  ProcessorFaceSearchData,
  ProcessorFaceSearchResponseData,
  ProcessorResponseData,
  SearchPlateItemData,
  SearchPlateResponseData,
  SearchTextLikeResponseData,
  SearchTextResponseData,
  SearchTextResponseItemData,
  VideoData,
} from './play-intents-types';
import { HealthManagerComponent } from './healt-manager.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-play-intents',
  templateUrl: './play-intents.component.html',
  styleUrls: ['./play-intents.component.css'],
})
export class PlayIntentsComponent extends HealthManagerComponent implements OnInit {

  formRight: FormGroup;
  sourceQuery: string = '';
  file_store: FileList;
  file_list: Array<string> = [];
  jobs: Array<JobData> = [];
  answers: Array<AnswerData> = [];
  currentSearchImage: string = MyConstants.PAGE.DEFAULT_IMAGE;
  currentSearchBlob: Blob | null = null;
  processorResponse: any = null;
  imageOptions: ImagepickerOptionsData = {
    isEditable: true,
    isRounded: false,
    useBackground: true,
    defaultImage: MyConstants.PAGE.DEFAULT_IMAGE,
    imageStyle: {
      'max-height': '200px',
    },
  };
  processorMethod: string = 'frameExtractor1.read'; //localFiles.write
  boundingBoxDetection: Array<ImgFaceData> = [];
  @ViewChildren('image_found_face') imageFoundFaceRef: QueryList<ElementRef>;

  gpt4allSession: Array<ChatGPT4AllSessionData> = [];

  constructor(
    public override fb: FormBuilder,
    public override flowchartSrv: FlowchartService,
    public override modalSrv: ModalService,
    public override callService: CallService,
    public override mongoSrv: MongoService,
    public override minioSrv: MinioService,
    public override sanitizer: DomSanitizer,
    public override httpSrv: HttpService,
    public override cdr: ChangeDetectorRef,
    public override jsonColorPipe: JsonColorPipe,
    private http: HttpClient,
    private indicatorSrv: IndicatorService,
  ) {
    super(fb, flowchartSrv, modalSrv, callService, mongoSrv, minioSrv, sanitizer, httpSrv, cdr, jsonColorPipe);
    //this.updateForEver();
    // Se lee el mode
    const urlParams = new URLSearchParams(window.location.search);
    const queryProcessorMethod = urlParams.get('processor_method');
    if (queryProcessorMethod) {
      this.processorMethod = queryProcessorMethod;
    }
  }

  async updateFacesImagesSize() {
    /*
    [attr.data-x1]="oneFame.x1"
    const singleImg: HTMLImageElement = imgFaceRef.nativeElement;
    let { x1 } = singleImg.dataset;
    */
    const promises = this.imageFoundFaceRef.toArray().map((imgFaceRef) => {
      return new Promise<void>((resolve) => {
        const singleImg: HTMLImageElement = imgFaceRef.nativeElement;
        const { index } = singleImg.dataset;
        if (index) {
          const img = new Image();
          const element = this.boundingBoxDetection[parseInt(index)];
          img.onload = () => {
            const { width, height, clientWidth, clientHeight } = img;
            let imageWidth = clientWidth;
            let imageHeight = clientHeight;
            if (imageWidth == 0) {
              imageWidth = width;
            }
            if (imageHeight == 0) {
              imageHeight = height;
            }
            element.width = imageWidth;
            element.height = imageHeight;
            element.element = singleImg;
            resolve();
          };
          img.src = singleImg.src;
        }
      });
    });
    console.log('before');
    await Promise.all(promises);
    console.log('after');
    this.cdr.detectChanges();
    //console.log(this.imgBboxList);
    requestAnimationFrame(async () => {
      await this.updateFaceBoundingBoxes();
    });
  }

  async updateFaceBoundingBoxes() {
    console.log('updateFaceBoundingBoxes');
    this.boundingBoxDetection.forEach((item) => {
      const parent = item.element?.parentElement;
      if (parent && item.width && item.height) {
        const overlayElement = parent.getElementsByTagName('div')[0];
        if (overlayElement) {
          const width = parent.clientWidth;
          const height = parent.clientHeight;
          //console.log(`${width} x ${height}`);
          // Limite the width
          let computedHeight = item.height;
          let computedWidth = item.width;

          if (computedHeight > height) {
            computedWidth = (computedWidth * height) / computedHeight;
            computedHeight = height;
          }

          if (computedWidth > width) {
            computedHeight = (computedHeight * width) / computedWidth;
            computedWidth = width;
          }

          const applyStyle = (key: string, value: string) => {
            //console.log(`applyStyle(${key}, ${value})`);
            const style1: any = item.element?.style;
            if (style1) {
              style1[key] = value;
              const style2: any = overlayElement.style;
              style2[key] = value;
            }
          };

          if (computedWidth < width) {
            const half = Math.floor((width - computedWidth) / 2);
            applyStyle('left', `${half}px`);
          }
          if (computedHeight < height) {
            const half = Math.floor((height - computedHeight) / 2);
            applyStyle('top', `${half}px`);
          }
          applyStyle('maxHeight', `${computedHeight}px`);
          applyStyle('height', `${computedHeight}px`);
          applyStyle('maxWidth', `${computedWidth}px`);
          applyStyle('width', `${computedWidth}px`);

          // get bbox div
          for (let k = 0; k < item.bbox.length; k++) {
            const oneBBox = item.bbox[k];
            const style: any = {};
            style.left = `${Math.floor(oneBBox.x1 * computedWidth)}px`;
            style.top = `${Math.floor(oneBBox.y1 * computedHeight)}px`;
            style.width = `${Math.floor(
              (oneBBox.x2 - oneBBox.x1) * computedWidth
            )}px`;
            style.height = `${Math.floor(
              (oneBBox.y2 - oneBBox.y1) * computedHeight
            )}px`;
            oneBBox.style = style;
          }
        } else {
          alert(`NO overlayElement`);
        }
      } else {
        alert(
          `parent ${parent} && item.width ${item.width} && item.height ${item.height}`
        );
      }
    });
    this.cdr.detectChanges();
  }

  async updateOnce() {
    const payload = {};
    const response = await this.flowchartSrv.introspect(payload);
    if (response && response.response) {
      this.jobs = response.response.map((elem: FlowchartRoomsProgressData) => {
        const nuevo: JobData = {
          url: PlayIntentsComponent.getUrlFromRoom(elem.room),
          percentage: elem.percentage,
          text: elem.room,
        };
        return nuevo;
      });
    }
  }

  async updateForEver() {
    while (true) {
      await this.updateOnce();
      await this.sleep(1000);
    }
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.formRight = this.fb.group({
      text: ['', []],
    });
    this.formRight.controls['text'].valueChanges.subscribe((value) => {
      if (/[\n\r]/.exec(value) != null) {
        this.chat();
      }
    });
  }

  getPageImage(): string | null {
    return this.currentSearchImage;
  }

  async changedImage(imagenBase64: FileBase64Data) {
    if (imagenBase64.base64) {
      this.currentSearchBlob = await this.httpSrv.b64toBlob(
        imagenBase64.base64
      );
      this.currentSearchImage = URL.createObjectURL(this.currentSearchBlob);
    }
  }

  async searchFaceApi() {
    const accountId = this.getAccountId();
    if (!accountId) {
      return;
    }
    const accountAppId = this.getAppId();
    if (!accountAppId) {
      return;
    }
    if (!this.currentSearchBlob) {
      this.modalSrv.alert({ txt: 'Select some image clicking above...' });
      return;
    }
    const formData = new FormData();
    const file = new File([this.currentSearchBlob], 'image', {
      type: this.currentSearchBlob.type,
    });
    formData.append('sourcePhoto', file);
    formData.append('searchBy', 'face');
    //formData.append('minDistance', '0');
    const response = await this.httpSrv.post<any>(
      `srv/widesight/accounts/${accountId}/apps/${accountAppId}/objects?limit=10&page=0`,
      formData,
      {
        showIndicator: true,
      }
    );
    console.log(response);
  }

  async searchFace() {
    const accountId = this.getAccountId();
    if (!accountId) {
      return;
    }
    const boundingBoxDetection: Array<any> = [];
    this.boundingBoxDetection = [];
    this.cdr.detectChanges();
    if (!this.currentSearchBlob) {
      this.modalSrv.alert({ txt: 'Select some image clicking above...' });
      return;
    }
    const fileBytes = new Uint8Array(
      await this.currentSearchBlob.arrayBuffer()
    );
    const payload: FlowchartProcessRequestData = {
      channel: 'post',
      processorMethod: this.processorMethod,
      room: 'processors',
      namedInputs: {
        extra: {
          //minDistance: 1
        },
        bytes: fileBytes,
        dbData: {
          accountId,
          // Should we limit by appId
        },
        paging: {
          limit: 10,
          offset: 0,
        },
      },
      data: {
        extension: 'png',
      },
    };

    this.processorResponse = await this.flowchartSrv.process(payload);

    const tempResponse = this
      .processorResponse as ProcessorFaceSearchResponseData;

    const { status } = tempResponse;
    if (status == 'ok') {
      const data = tempResponse.response?.data as ProcessorFaceSearchData;
      if (data && data.results) {
        const results = data.results;
        for (let k = 0; k < results.length; k++) {
          const actual = results[k].entity;
          const { face_path, x1, x2, y1, y2 } = actual;
          const nuevo: ImgFaceData = {
            imagePath: face_path,
            bucket: 'public',
            loaded: false,
            text: this.sanitizer.bypassSecurityTrustHtml(
              `Video <strong>${actual.document_id}</strong> at <strong>${actual.millis}</strong> second(s)`
            ),
            bbox: [
              {
                class: 'face',
                x1,
                x2,
                y1,
                y2,
                style: {},
              },
            ],
          };
          boundingBoxDetection.push(nuevo);
        }
        requestAnimationFrame(() => {
          this.boundingBoxDetection = boundingBoxDetection;
          this.cdr.detectChanges();
          requestAnimationFrame(() => {
            this.updateFacesImagesSize();
          });
        });
      }
    }
  }

  async searchPlate() {
    const boundingBoxDetection: Array<any> = [];
    this.boundingBoxDetection = [];
    this.cdr.detectChanges();
    if (!this.formRight.valid) {
      return;
    }
    let text = this.formRight.get('text')?.value;
    if (text.trim().length == 0) {
      this.modalSrv.alert({ txt: 'Write something to search' });
      return;
    }
    // Check regex
    text = text.toLocaleUpperCase();
    //const plateTokens = /^\s*[a-z]{0,3}[0-9]{0,3}\s*$/i.exec(text);
    const plateTokens = /^\s*[a-z0-9]{0,6}\s*$/i.exec(text);
    if (!plateTokens) {
      this.modalSrv.alert({
        txt: `"${text}" does not looks like a valid plate id`,
      });
      return;
    }
    const sqlText = `select * from collection_plates where license_plate_text LIKE '%${text}%' LIMIT 1`;
    const payload: MongoReadData = {
      database: 'dbtemp',
      where: sqlText,
    };
    const ans = (await this.mongoSrv.read(payload)) as SearchPlateResponseData;
    if (ans.status == 'ok') {
      const list: Array<SearchPlateItemData> = ans.list;
      list.forEach((plateResult) => {
        const {
          vehicle,
          license_plate,
          license_plate_path,
          license_plate_text,
        } = plateResult;
        //console.log(JSON.stringify(plateResult, null, 4));
        const nuevo: ImgFaceData = {
          imagePath: license_plate_path,
          text: this.sanitizer.bypassSecurityTrustHtml(
            `Plate <strong>${license_plate_text}</strong> in Video <strong>${plateResult.document_id}</strong> at <strong>${plateResult.millis}</strong> second(s)`
          ),
          bucket: 'public',
          bbox: [],
          loaded: false,
        };
        const vehicleBBox: any = {
          class: 'vehicle',
          style: {},
          x1: vehicle.bbox.x1,
          x2: vehicle.bbox.x2,
          y1: vehicle.bbox.y1,
          y2: vehicle.bbox.y2,
        };
        nuevo.bbox.push(vehicleBBox);
        const plateBBox: any = {
          class: 'plate',
          style: {},
          x1: license_plate.bbox.x1,
          x2: license_plate.bbox.x2,
          y1: license_plate.bbox.y1,
          y2: license_plate.bbox.y2,
        };
        nuevo.bbox.push(plateBBox);
        boundingBoxDetection.push(nuevo);
      });
    }
    requestAnimationFrame(() => {
      this.boundingBoxDetection = boundingBoxDetection;
      this.cdr.detectChanges();
      requestAnimationFrame(() => {
        this.updateFacesImagesSize();
      });
    });
  }

  async askSearchable(type: string) {
    if (!this.formRight.valid) {
      return;
    }
    let text = this.formRight.get('text')?.value;
    if (text.trim().length == 0) {
      this.modalSrv.alert({ txt: 'Write something to search' });
      return;
    }
    this.updateMatchesList([]);
    this.computeSearchedWords(text);
    let finalSearchText = '';
    if (type == 'and') {
      finalSearchText = this.searchedWords.join("%' AND text LIKE '%");
    } else if (type == 'or') {
      finalSearchText = this.searchedWords.join("%' OR text LIKE '%");
    } else if (type == 'ordered') {
      finalSearchText = this.searchedWords.join('%');
    } else {
      return;
    }
    if (finalSearchText.length == 0) {
      return;
    }
    const sqlText = `select * from collection_segment where text LIKE '%${finalSearchText}%'`;
    const payload: MongoReadData = {
      database: 'dbnotes',
      where: sqlText,
    };
    const ans = (await this.mongoSrv.read(
      payload
    )) as SearchTextLikeResponseData;
    if (ans.status == 'ok') {
      this.updateMatchesList(ans.list);
    }
  }

  async searchIntent() {
    if (!this.formRight.valid) {
      return;
    }
    const text = this.formRight.get('text')?.value;
    if (text.trim().length == 0) {
      this.modalSrv.alert({ txt: 'Write something to search' });
      return;
    }
    this.computeSearchedWords(text);
    const payload: FlowchartProcessRequestData = {
      channel: 'post',
      room: 'processors',
      processorMethod: 'milvusIx1.searchintent',
      namedInputs: {
        k: 3,
        query: text,
      },
      data: {
        db: 'searchable',
        collection: 'intent',
      },
    };
    this.tic();
    const response = await this.flowchartSrv.process(payload);
    this.toc();
    const tempResponse = response as SearchTextResponseData;
    const responses = tempResponse?.response?.data;
    if (responses) {
      this.updateMatchesList(responses);
    }
  }

  updateMatchesList(responses: Array<SearchTextResponseItemData>) {
    this.answers = [];
    try {
      this.answers = responses.map((elem: SearchTextResponseItemData) => {
        let textHTML = MyUtilities.htmlEntities(elem.text)
          .split(/[\s]+/g)
          .map((word: string) => {
            let found = false;
            const wordLower = word.toLowerCase();
            for (let i = 0; i < this.searchedWords.length; i++) {
              const myWord = this.searchedWords[i];
              if (wordLower.indexOf(myWord) >= 0) {
                found = true;
                break;
              }
            }
            if (found) {
              return `<span style="background-color: #ffff00;">${word}</span>`;
            }
            return word;
          })
          .join(' ');
        return {
          txt: this.sanitizer.bypassSecurityTrustHtml(`"${textHTML}"`),
          detail: this.sanitizer.bypassSecurityTrustHtml(
            `Document <a target="_blank" href="${this.getDocumentPage(
              elem.document_id
            )}">"${elem.document_id}"</a> at second ${elem.start_time.toFixed(
              2
            )}`
          ),
        };
      });
    } catch (err) { }
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

  async upload() {
    if (!this.file_store || this.file_store.length == 0) {
      this.modalSrv.alert({ txt: 'Select some file' });
      return;
    }
    await this.minioSrv.uploadFiles('public', 'local/uploads', this.file_store);
  }

  resetChat() {
    this.gpt4allSession = [];
    this.answers = [];
  }

  getRoot(): string {
    return MyConstants.SRV_ROOT;
  }

  async chat() {
    if (!this.formRight.valid) {
      return;
    }
    const field = this.formRight.get('text');
    if (!field) {
      return;
    }
    let text = field.value;
    if (text.trim().length == 0) {
      this.modalSrv.alert({ txt: 'Write something to search' });
      return;
    }
    const activity = this.indicatorSrv.start();
    const payload: FlowchartProcessRequestData = {
      channel: 'post',
      processorMethod: 'llm.chat',
      room: 'processors',
      namedInputs: {
        session: this.gpt4allSession,
        message: text,
      },
      data: {
        maxTokens: 1024,
        systemMessage: 'Eres un asistente en español',
        chatTemplate: "### Human:\n{0}\n\n### Assistant:\n",
        streaming: true,
      },
    };
    this.tic();

    const gpt4allSession = this.gpt4allSession;
    const currentAnswer = {
      txt: text,
      detail: "",
    };
    this.answers.unshift(currentAnswer);
    field.setValue("");

    const urlServer = this.getRoot() + "srv/flowchart/processor_process_json";
    fetch(urlServer, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Set headers if necessary
      },
      body: JSON.stringify(payload), // Send data in the request body
    })
      .then((response: any) => {
        this.toc();
        activity.done();
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        function readChunk() {
          return reader.read().then((temporal: any) => {
            const { done, value } = temporal;
            if (done) {
              gpt4allSession.push({
                role: "user",
                content: text,
              });
              gpt4allSession.push({
                role: "assistant",
                content: currentAnswer.detail,
              });
              return;
            }
            const chunk = decoder.decode(value, { stream: true });
            currentAnswer.detail += chunk;
            return readChunk();
          });
        }
        return readChunk();
      })
      .catch(error => {
        this.modalSrv.error(error);
        activity.done();
      });
  }

  async addMedia() {
    if (!this.file_store || this.file_store.length == 0) {
      this.modalSrv.alert({ txt: 'Select some file' });
      return;
    }
    const accountId = this.getAccountId();
    if (!accountId) {
      return;
    }
    const accountAppId = this.getAppId();
    if (!accountAppId) {
      return;
    }
    try {
      const ahora = new Date().getTime();
      const response1 = await this.httpSrv.post<any>(
        `srv/widesight/accounts/${accountId}/apps/${accountAppId}/videos`,
        {
          video: {
            name: 'Video ' + ahora,
            description: 'Description ' + ahora,
            startTime: ahora,
            tags: ['tag1', 'tag2'],
          },
        },
        {
          showIndicator: true,
        }
      );
      const videoId = response1.video.id;
      const formData = new FormData();
      const file = this.file_store[0];
      formData.append('video', file);
      const response2 = await this.httpSrv.put<any>(
        `srv/widesight/accounts/${accountId}/apps/${accountAppId}/videos/${videoId}/upload`,
        formData,
        {
          showIndicator: true,
        }
      );
      // Ask to start the process
      const paralel = this.formLeft.value.paralel;
      const audioGap = this.formLeft.value.audioGap;
      const sleep = this.formLeft.value.sleep;
      const response3 = await this.httpSrv.post<any>(
        `srv/widesight/accounts/${accountId}/apps/${accountAppId}/videos/${videoId}/process`,
        {
          settings: {
            preserveTempFiles: !this.formLeft.value.eraseTempFiles,
            useFace: this.formLeft.value.useFace,
            usePlate: this.formLeft.value.usePlate,
            useSpeech: this.formLeft.value.useSpeech,
            timelineSpeech: audioGap,
            timelineNSpeech: 1,
            timelineFace: paralel,
            timelineNFace: paralel,
            timelinePlate: 2,
            timelineNPlate: 1,
            sleep: sleep,
          },
        },
        {
          showIndicator: true,
        }
      );
      await this.updateOnce();
    } catch (err: any) {
      this.modalSrv.error(err);

    }
  }

  async listObjects() {
    const accountId = this.getAccountId();
    if (!accountId) {
      return;
    }
    const accountAppId = this.getAppId();
    if (!accountAppId) {
      return;
    }
    const response = await this.httpSrv.get<any>(
      `srv/widesight/accounts/${accountId}/apps/${accountAppId}/objects?limit=20&page=0`,
      {
        showIndicator: true,
      }
    );
    const results = response.results;
    const html = "<pre>" + this.jsonColorPipe.transform(results) + "</pre>";
    this.modalSrv.alert({ title: "Detail", txt: html, ishtml: true });
  }
}
