import {
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { JsonColorPipe } from 'ejflab-front-lib';
import { FlowChartRef } from 'ejflab-front-lib';
import { CallService } from 'ejflab-front-lib';
import {
    FlowchartProcessRequestData,
    FlowchartService,
} from 'ejflab-front-lib';
import { HttpService } from 'ejflab-front-lib';
import { MinioService } from 'ejflab-front-lib';
import { ModalService } from 'ejflab-front-lib';
import { MongoService } from 'ejflab-front-lib';
import { ProcessorResponseData } from './play-intents-types';
import { AccountManagerComponent } from './account-manager.component';

export interface SelectChoiceData {
    key: string;
    value: string;
}

@Component({
    selector: 'app-health-manager',
    template: ` <div></div> `,
    styles: [],
})
export abstract class HealthManagerComponent
    extends AccountManagerComponent
    implements OnInit, OnDestroy {

    file_upload: FileList;
    processorHealtCheckResponse: ProcessorResponseData | null = null;
    processorCommand: string = "";
    pythonFileSelected: string = "";
    pythonChoices: SelectChoiceData[] = [
        { key: "torch_check.py", value: "torch_check.py" },
        { key: "keras_check.py", value: "keras_check.py" },
        { key: "tensorflow_check.py", value: "tensorflow_check.py" },
        { key: "llava.py", value: "llava.py" },
        { key: "vila.py", value: "vila.py" },
        { key: "vila2.py", value: "vila2.py" },
        { key: "gpt4all.py", value: "gpt4all.py" },
    ];

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
    ) {
        super(fb, flowchartSrv, modalSrv, callService, mongoSrv, minioSrv, sanitizer, httpSrv, cdr, jsonColorPipe);
    }

    async startSimple() {
        const payload: FlowChartRef = {
            room: 'test',
            names: {
                Flowchart: '${WORKSPACE}/flowcharts/simple/flow01.drawio',
            },
            multiples: {},
            conf: {
                sleep: 333,
                debug: false,
            },
            autoStart: true,
            dataPath: {},
        };
        const response = await this.flowchartSrv.loadFlowchart(payload);
    }

    async startMultiple() {
        const payload: FlowChartRef = {
            room: 'multiple',
            names: {
                Flowchart: '${WORKSPACE}/flowcharts/multiple/flow01.drawio',
            },
            multiples: {
                First: '${WORKSPACE}/flowcharts/multiple/firstLoop.drawio',
                Second: '${WORKSPACE}/flowcharts/multiple/secondLoop.drawio',
            },
            conf: {
                sleep: 333,
                debug: false,
            },
            autoStart: true,
            dataPath: {},
            dataVal: {
                performance: { track: true },
                myFirstList: [
                    {
                        mySecondList: [
                            { val: 'Pepe' },
                            { val: 'Grillo' },
                            { val: 'Pinocho' },
                        ],
                    },
                    {
                        mySecondList: [{ val: 'Ada' }, { val: 'Guepeto' }],
                    },
                    {
                        mySecondList: [{ val: 'Zorro' }],
                    },
                ],
            },
        };
        const response = await this.flowchartSrv.loadFlowchart(payload);
    }

    async testProcessors(rawJson: boolean = false) {
        const payload: FlowchartProcessRequestData = {
            channel: 'post',
            processorMethod: 'localFiles.echo',
            room: 'processors',
            namedInputs: {
                hey: 'hey!',
            },
            data: {},
        };
        const response = await this.flowchartSrv.process(payload, rawJson);
        this.modalSrv.alert({
            title: 'Result',
            txt: JSON.stringify(response, null, 4),
        });
    }

    async testMinio() {
        const response = await this.httpSrv.get<any>(`srv/minio/ping`, {
            showIndicator: true,
        });
        this.modalSrv.alert({
            title: 'Result',
            txt: JSON.stringify(response, null, 4),
        });
    }

    async testMilvus() {
        const response = await this.httpSrv.get<any>(`srv/milvus/ping`, {
            showIndicator: true,
        });
        this.modalSrv.alert({
            title: 'Result',
            txt: JSON.stringify(response, null, 4),
        });
    }

    async testMongo() {
        const response = await this.httpSrv.get<any>(`srv/mongo/ping`, {
            showIndicator: true,
        });
        this.modalSrv.alert({
            title: 'Result',
            txt: JSON.stringify(response, null, 4),
        });
    }

    async testPostgres() {
        const response = await this.httpSrv.get<any>(`srv/postgres/ping`, {
            showIndicator: true,
        });
        this.modalSrv.alert({
            title: 'Result',
            txt: JSON.stringify(response, null, 4),
        });
    }

    async checkNVCC() {
        if (!(await this.hasProcessor())) {
            return;
        }
        const response = await this.httpSrv.get<any>(
            `srv/widesight/processor/${this.processorSelected}/nvcc`,
            {
                showIndicator: true,
            }
        );
        this.processorHealtCheckResponse = response;
    }

    async checkLdConfigCuda() {
        if (!(await this.hasProcessor())) {
            return;
        }
        const response = await this.httpSrv.get<any>(
            `srv/widesight/processor/${this.processorSelected}/ldconfig`,
            {
                showIndicator: true,
            }
        );
        this.processorHealtCheckResponse = response;
    }

    async checkNvidiaSmi() {
        if (!(await this.hasProcessor())) {
            return;
        }
        const response = await this.httpSrv.get<any>(
            `srv/widesight/processor/${this.processorSelected}/nvidia-smi`,
            {
                showIndicator: true,
            }
        );
        this.processorHealtCheckResponse = response;
    }

    async processorCommandFunction() {
        if (!(await this.hasProcessor())) {
            return;
        }
        this.tic();
        const response = await this.httpSrv.get<any>(
            `srv/widesight/processor/${this.processorSelected}/command/?cmd=${encodeURIComponent(this.processorCommand)}`,
            {
                showIndicator: true,
            }
        );
        this.toc();
        this.processorHealtCheckResponse = response;
    }

    async runPython() {
        if (!(await this.hasProcessor())) {
            return;
        }
        const python = this.formLeft.get('python')?.value;
        if (python) {
            this.tic();
            const response = await this.httpSrv.post<any>(
                `srv/widesight/processor/${this.processorSelected}/python`,
                {
                    code: python
                },
                {
                    showIndicator: true,
                }
            );
            this.processorHealtCheckResponse = response;
            this.toc();
        }
    }

    handleFileUploadChange(l: FileList | null): void {
        if (!l) {
            console.log('No data');
            return;
        }
        this.file_upload = l;
        const displayFileUpload = this.formLeft.get('displayFileUpload');
        if (!displayFileUpload) {
            return;
        }
        if (l.length) {
            const f = l[0];
            const count = l.length > 1 ? `(+${l.length - 1} files)` : '';
            displayFileUpload.patchValue(`${f.name}${count}`);
        } else {
            displayFileUpload.patchValue('');
        }
    }

    async hasPythonFile(): Promise<boolean> {
        if (!this.pythonFileSelected) {
            await this.modalSrv.alert({
                title: 'Verify',
                txt: 'Select some python file',
            });
            return false;
        }
        return true;
    }

    async uploadTestFile() {
        if (!(await this.hasProcessor())) {
            return;
        }
        if (!this.file_upload || this.file_upload.length == 0) {
            this.modalSrv.alert({ txt: 'Select some file to upload' });
            return;
        }
        const formData = new FormData();
        const file = this.file_upload[0];
        formData.append('file', file);
        const response1 = await this.httpSrv.put<any>(
            `srv/widesight/processor/${this.processorSelected}/upload`,
            formData,
            {
                showIndicator: true,
            }
        );
        if (response1?.error) {
            this.modalSrv.alert({ title: "Error", txt: response1?.error });
        } else {
            this.modalSrv.alert({ title: "Confirm", txt: "File uploaded!" });
        }
    }

    async readPythonFile() {
        if (!(await this.hasPythonFile())) {
            return;
        }
        const response1 = await this.httpSrv.get<any>(
            `assets/python/${this.pythonFileSelected}`,
            {
                showIndicator: true,
                rawString: true,
            }
        );
        this.formLeft.get('python')?.setValue(response1);
    }
}