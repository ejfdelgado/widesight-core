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
import { FileBase64Data, JsonColorPipe } from 'ejflab-front-lib';
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
import { AccountData, AppData, ImgFaceData, VideoData } from './play-intents-types';
import { IntentBaseComponent } from './intent-base.component';

@Component({
    selector: 'app-account-manager',
    template: ` <div></div> `,
    styles: [],
})
export abstract class AccountManagerComponent
    extends IntentBaseComponent
    implements OnInit, OnDestroy {

    formLeft: FormGroup;

    accounts: Array<AccountData> = [];
    apps: Array<AppData> = [];
    videos: Array<VideoData> = [];

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
        public jsonColorPipe: JsonColorPipe,
    ) {
        super(fb, flowchartSrv, modalSrv, callService, mongoSrv, minioSrv, sanitizer, httpSrv, cdr);
    }

    override ngOnInit(): void {
        super.ngOnInit();
        this.formLeft = this.fb.group({
            display: ['', []],
            displayFileUpload: ['', []],
            accountId: ['', []],
            accountAppId: ['', []],
            python: ['', []],
            videoId: ['', []],
            accountEmail: ['edgar@gmail.com', []],
            paralel: [2, []],
            audioGap: [10, []],
            sleep: [333, []],
            eraseTempFiles: [true, []],
            useFace: [false, []],
            usePlate: [false, []],
            useSpeech: [false, []],
        });
    }

    async destroyGeneral() {
        const confirm = await this.modalSrv.confirm({
            title: '¿Sure?',
            txt: "Can't be undone.",
        });
        if (!confirm) {
            return;
        }
        const response = await this.httpSrv.post<any>(
            `/srv/widesight/db/general/destroy`,
            {
                showIndicator: true,
            }
        );
        this.modalSrv.alert({
            title: 'Result',
            txt: JSON.stringify(response, null, 4),
        });
    }

    async recreateGeneral() {
        const confirm = await this.modalSrv.confirm({
            title: '¿Sure?',
            txt: "Can't be undone.",
        });
        if (!confirm) {
            return;
        }
        const response = await this.httpSrv.post<any>(
            `/srv/widesight/db/general/create`,
            {
                showIndicator: true,
            }
        );
        this.modalSrv.alert({
            title: 'Result',
            txt: JSON.stringify(response, null, 4),
        });
    }

    getAccountId() {
        const accountId = this.formLeft.value.accountId;
        if (!accountId || accountId.length == 0) {
            this.modalSrv.alert({ txt: 'Define account id' });
            return null;
        }
        return accountId;
    }

    getAppId() {
        const appId = this.formLeft.value.accountAppId;
        if (!appId || appId.length == 0) {
            this.modalSrv.alert({ txt: 'Define app id' });
            return null;
        }
        return appId;
    }

    getVideoId() {
        const videoId = this.formLeft.value.videoId;
        if (!videoId || videoId.length == 0) {
            this.modalSrv.alert({ txt: 'Define video id' });
            return null;
        }
        return videoId;
    }

    async listApps() {
        // Get account Id
        const accountId = this.getAccountId();
        if (!accountId) {
            return;
        }
        const response = await this.httpSrv.get<any>(
            `srv/widesight/accounts/${accountId}/apps?limit=20&page=0`,
            {
                showIndicator: true,
            }
        );
        this.apps = response;
        if (this.apps.length == 1) {
            // Assign unique account
            this.formLeft.get('accountAppId')?.setValue(this.apps[0].id);
        }
    }

    async createApp() {
        const accountId = this.getAccountId();
        if (!accountId) {
            return;
        }
        const response1 = await this.httpSrv.post<any>(
            `srv/widesight/accounts/${accountId}/apps`,
            {
                name: `My app ${new Date().getTime()}`,
            },
            {
                showIndicator: true,
            }
        );
        requestAnimationFrame(() => {
            this.listApps();
            this.cdr.detectChanges();
        });
    }

    async deleteApp() {
        const accountId = this.getAccountId();
        if (!accountId) {
            return;
        }
        const appId = this.getAppId();
        if (!appId) {
            return;
        }
        const response1 = await this.httpSrv.delete<any>(
            `srv/widesight/accounts/${accountId}/apps/${appId}`,
            {
                showIndicator: true,
            }
        );
        requestAnimationFrame(() => {
            this.listApps();
            this.cdr.detectChanges();
        });
    }

    async listAccounts() {
        // List accounts
        const accountEmail = this.formLeft.value.accountEmail;
        if (!accountEmail || accountEmail.length == 0) {
            this.modalSrv.alert({ txt: 'Define account email' });
            return;
        }
        const response = await this.httpSrv.get<any>(
            `srv/widesight/accounts/${accountEmail}?limit=20&page=0`,
            {
                showIndicator: true,
            }
        );
        this.accounts = response;
        if (this.accounts.length == 1) {
            // Assign unique account
            this.formLeft.get('accountId')?.setValue(this.accounts[0].id);
        }
    }

    async createAccount() {
        const accountEmail = this.formLeft.value.accountEmail;
        if (!accountEmail || accountEmail.length == 0) {
            this.modalSrv.alert({ txt: 'Define account email' });
            return;
        }
        const response1 = await this.httpSrv.post<any>(
            `srv/widesight/accounts`,
            {
                email: accountEmail,
                name: `My account ${new Date().getTime()}`,
            },
            {
                showIndicator: true,
            }
        );
        requestAnimationFrame(() => {
            this.listAccounts();
            this.cdr.detectChanges();
        });
    }

    async deleteAccount() {
        const accountId = this.getAccountId();
        if (!accountId) {
            return;
        }
        const confirm = await this.modalSrv.confirm({
            title: '¿Sure?',
            txt: "Can't be undone.",
        });
        if (!confirm) {
            return;
        }
        const response2 = await this.httpSrv.delete<any>(
            `srv/widesight/accounts/${accountId}`,
            {
                showIndicator: true,
            }
        );
        requestAnimationFrame(() => {
            this.listAccounts();
            this.cdr.detectChanges();
        });
    }

    async listVideos() {
        const accountId = this.getAccountId();
        if (!accountId) {
            return;
        }
        const accountAppId = this.getAppId();
        if (!accountAppId) {
            return;
        }
        const response = await this.httpSrv.get<any>(
            `srv/widesight/accounts/${accountId}/apps/${accountAppId}/videos?limit=20&page=0`,
            {
                showIndicator: true,
            }
        );
        this.videos = response.results;
        if (this.videos.length == 1) {
            // Assign unique account
            this.formLeft.get('videoId')?.setValue(this.videos[0].id);
        }
    }

    async getVideoById() {
        // Account Id
        const accountId = this.getAccountId();
        if (!accountId) {
            return;
        }
        const accountAppId = this.getAppId();
        if (!accountAppId) {
            return;
        }
        // Video Id
        const videoId = this.getVideoId();
        if (!videoId) {
            return;
        }
        const response = await this.httpSrv.get<any>(
            `srv/widesight/accounts/${accountId}/apps/${accountAppId}/videos/${videoId}`,
            {
                showIndicator: true,
            }
        );
        const html = "<pre>" + this.jsonColorPipe.transform(response) + "</pre>";
        this.modalSrv.alert({ title: "Detail", txt: html, ishtml: true });
    }

    async deleteVideo() {
        //
    }
}