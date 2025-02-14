import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    QueryList,
    ViewChildren,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FileBase64Data } from 'ejflab-front-lib';
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
import { ImgFaceData } from './play-intents-types';

@Component({
    selector: 'app-intent-base',
    template: ` <div></div> `,
    styles: [],
})
export abstract class IntentBaseComponent
    implements OnInit, OnDestroy {

    searchedWords: Array<string> = [];
    start: number = 0;
    seconds: string = '';
    processorSelected: string | null = null;

    constructor(
        public fb: FormBuilder,
        public flowchartSrv: FlowchartService,
        public modalSrv: ModalService,
        public callService: CallService,
        public mongoSrv: MongoService,
        public minioSrv: MinioService,
        public sanitizer: DomSanitizer,
        public httpSrv: HttpService,
        public cdr: ChangeDetectorRef
    ) {
    }
    ngOnInit(): void {

    }
    ngOnDestroy(): void {

    }

    static getUrlFromRoom(room: string) {
        return `${location.origin}${location.pathname}?mode=flowchart&room=${room}`;
    }

    getDocumentPage(documentId: string) {
        return `${location.origin}${location.pathname}?mode=playground_document&document_id=${documentId}`;
    }

    completeResultImage(element: ImgFaceData) {
        const localPath = `srv/minio/${element.bucket}/${element.imagePath}`;
        const completeUrl =
            MyConstants.SRV_ROOT + localPath + '?authcookie=1&max_age=30';
        return completeUrl;
    }

    async sleep(millis: number) {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, millis);
        });
    }

    async getFileBytes(oneFile: File) {
        const reader = new FileReader();
        return new Promise<Uint8Array>((resolve, reject) => {
            reader.onload = function () {
                const arrayBuffer: any = this.result;
                const array = new Uint8Array(arrayBuffer);
                resolve(array);
            };
            reader.readAsArrayBuffer(oneFile);
        });
    }

    computeSearchedWords(text: string) {
        this.searchedWords = text
            .replace(/['\n]/g, '')
            .split(/[\s]+/g)
            .map((word: string) => {
                return word.trim().toLocaleLowerCase();
            })
            .filter((word: string) => {
                return word.length > 0;
            });
    }

    async hasProcessor(): Promise<boolean> {
        if (!this.processorSelected) {
            await this.modalSrv.alert({
                title: 'Verify',
                txt: 'Select some processor to check',
            });
            return false;
        }
        return true;
    }

    tic() {
        this.start = new Date().getTime();
    }
    toc() {
        const end = new Date().getTime();
        const duration = ((end - this.start) / 1000).toFixed(2);
        this.seconds = `${duration} seconds`;
    }
}