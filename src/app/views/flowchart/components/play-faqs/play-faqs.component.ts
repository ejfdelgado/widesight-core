import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FlowchartProcessRequestData, FlowchartService, HttpService } from 'ejflab-front-lib';
import { ModalService } from 'ejflab-front-lib';

@Component({
  selector: 'app-play-faqs',
  templateUrl: './play-faqs.component.html',
  styleUrls: ['./play-faqs.component.css'],
})
export class PlayFaqsComponent implements OnInit {
  formLeft: FormGroup;
  formRight: FormGroup;
  respuesta: string = '';
  sourceQuery: string = '';
  seconds: string = '';
  constructor(
    private fb: FormBuilder,
    public flowchartSrv: FlowchartService,
    private modalSrv: ModalService,
    public cdr: ChangeDetectorRef,
    public httpSrv: HttpService,
  ) { }

  ngOnInit(): void {
    this.formLeft = this.fb.group({
      text: ['', [Validators.required]],
    });
    this.formRight = this.fb.group({
      text: ['es un dia frio', [Validators.required]],
      phrase: ['hoy parece invierno\nacá parece el infierno', [Validators.required]],
    });
  }

  async textAreaKeyDown(event: any) {
    if (event.key == 'Enter') {
      await this.ask();
    }
  }

  async compare() {
    if (!this.formRight.valid) {
      return;
    }
    const question = this.formRight.get('text')?.value;
    if (question.trim().length == 0) {
      return;
    }
    const phrase = this.formRight.get('phrase')?.value;
    if (phrase.trim().length == 0) {
      return;
    }
    this.compareIntents(question, phrase);
  }

  async ask() {
    if (!this.formRight.valid) {
      return;
    }
    const text = this.formRight.get('text')?.value;
    if (text.trim().length == 0) {
      return;
    }
    const payload: any = {
      room: 'public',
      processorMethod: 'milvusIx1.searchfaq',
      namedInputs: {
        k: 2,
        db: 'searchable',
        collection: 'faqs',
        query: text,
      },
    };
    const start = new Date().getTime();
    const response = await this.flowchartSrv.process(payload);
    const end = new Date().getTime();
    const duration = ((end - start) / 1000).toFixed(2);
    this.seconds = `${duration} seconds`;
    this.respuesta = response?.response?.data[0]?.answer;
    this.sourceQuery = response?.response?.data[0]?.query;
  }

  async index() {
    if (!this.formLeft.valid) {
      return;
    }
    const text = this.formLeft.get('text')?.value;
    const payload: any = {
      room: 'public',
      processorMethod: 'milvusIx1.indexfaqs',
      namedInputs: {
        text: text,
      },
    };
    const start = new Date().getTime();
    const response = await this.flowchartSrv.process(payload);
    const responsePayload = response?.response?.data;
    const end = new Date().getTime();
    const duration = ((end - start) / 1000).toFixed(2);
    this.modalSrv.alert({
      txt: `Indexed ${responsePayload.currentCount} entries in ${duration} seconds. Overall count is ${responsePayload.count}`,
    });
  }

  async compareIntents(phrase1: string, phrase2: string) {
    const payload: FlowchartProcessRequestData = {
      id: `manual`,
      loadingIndicator: true,
      channel: 'post',
      processorMethod: 'milvusIx1.compare',
      room: 'processors',
      namedInputs: {
        phrase1,
        phrase2,
        type: "dense", //sparse, dense
      },
      data: {

      },
    };
    this.cdr.detectChanges();
    const response = await this.flowchartSrv.process(payload, false);
    this.respuesta = JSON.stringify(response);
    this.cdr.detectChanges();
  }
}
