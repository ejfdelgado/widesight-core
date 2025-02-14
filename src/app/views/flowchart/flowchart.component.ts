import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { OptionData } from 'ejflab-front-lib';

import { Auth } from '@angular/fire/auth';
import { ActivatedRoute } from '@angular/router';
import { BackendPageService } from 'ejflab-front-lib';
import { AuthService } from 'ejflab-front-lib';
import { MatDialog } from '@angular/material/dialog';
import { TupleService } from 'ejflab-front-lib';
import { ModalService } from 'ejflab-front-lib';
import { WebcamService } from 'ejflab-front-lib';
import { FileService } from 'ejflab-front-lib';
import { FlowchartService } from 'ejflab-front-lib';
import { CallService } from 'ejflab-front-lib';
import { EchoLogProcessor } from 'ejflab-front-lib';
import { ReceiveLiveChangesProcessor } from 'ejflab-front-lib';
import { SetModelProcessor } from 'ejflab-front-lib';
import { BaseComponent } from 'ejflab-front-lib';
import { FlowChartDiagram } from '@ejfdelgado/ejflab-common/src/FlowChartDiagram';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { Buffer } from 'buffer';
import {
  HistoryData,
  OneArrow,
  OneFlowChartData,
  OneNode,
  PerformanceItem,
} from './types/types';

@Component({
  selector: 'app-flowchart',
  templateUrl: './flowchart.component.html',
  styleUrls: ['./flowchart.component.css'],
})
export class FlowchartComponent extends BaseComponent implements OnInit {
  public currentView: string = 'playground_intents';

  public extraOptions: Array<OptionData> = [];
  public flowCharts: Array<OneFlowChartData> = [];
  public flowChartVersion: number = 0;
  public transcriptions: Array<string> = [];
  updateSvgSizeThis: Function;
  @ViewChildren('svgContainers') svgContainers: QueryList<ElementRef>;
  performance: Array<PerformanceItem> = [
    {
      time: [3734, 3774, 3746],
      txt: 'sleep«2000;5000»',
    },
    {
      time: [1],
      txt: 'set«"scope.progress";100»',
    },
  ];

  constructor(
    public override flowchartSrv: FlowchartService,
    public override callService: CallService,
    public override route: ActivatedRoute,
    public override pageService: BackendPageService,
    public override cdr: ChangeDetectorRef,
    public override authService: AuthService,
    public override dialog: MatDialog,
    public override tupleService: TupleService,
    public override fileService: FileService,
    public override modalService: ModalService,
    public override webcamService: WebcamService,
    public override auth: Auth,
    public sanitizer: DomSanitizer
  ) {
    super(
      flowchartSrv,
      callService,
      route,
      pageService,
      cdr,
      authService,
      dialog,
      tupleService,
      fileService,
      modalService,
      webcamService,
      auth
    );

    this.updateSvgSizeThis = this.updateSvgSize.bind(this);

    const urlParams = new URLSearchParams(window.location.search);

    // Se lee el mode
    const mode = urlParams.get('mode');
    if (mode) {
      this.currentView = mode;
    }

    const VIEW_OPTIONS = [
      { name: 'flowchart', label: 'Flowchart', icon: 'psychology' },
      { name: 'playground_faqs', label: 'Faqs', icon: 'play_arrow' },
      { name: 'playground_intents', label: 'Play Ground', icon: 'sports_esports' },
      { name: 'playground_milvus', label: 'Frame Iterator', icon: 'search' },
      { name: 'playground_document', label: 'Documents', icon: 'inventory_2' },
      { name: 'playground_sppech2text', label: 'Speech 2 Text', icon: 'graphic_eq' },
      { name: 'playground_milvus_admin', label: 'Milvus', icon: 'storage' },
    ];
    for (let i = 0; i < VIEW_OPTIONS.length; i++) {
      const viewOption = VIEW_OPTIONS[i];
      this.extraOptions.push({
        action: () => {
          this.setView(viewOption.name);
        },
        icon: viewOption.icon,
        label: viewOption.label,
      });
    }
  }

  override async ngOnInit() {
    await super.ngOnInit();
    this.socketIoConnect(this.builderConfig);
  }

  bindEvents() {
    const instance = this.getCallServiceInstance();
    instance.registerProcessor('echoLog', (message: any) => {
      new EchoLogProcessor(this).execute(message);
    });
    instance.registerProcessor('clientChange', async (message: any) => {
      await new ReceiveLiveChangesProcessor(this).execute(message);
      if (message['*'].length > 0) {
        const key = message['*'][0].k;
        if (key == 'version') {
          const version = message['*'][0].v;
          if (this.flowChartVersion != version) {
            this.onFlowChartLoaded();
            this.flowChartVersion = version;
          }
        }
      }
    });
    instance.registerProcessor('flowChartModified', async (message: any) => {
      console.log('flowChartModified...');
      await this.onFlowChartLoaded();
    });
    instance.registerProcessor('setModel', async (message: any) => {
      await new SetModelProcessor(this).execute(message);
      await this.onFlowChartLoaded();
    });
    instance.registerProcessor('processResponse', async (message: any) => {
      const { data, sourcePath, processorId } = message;
      console.log(`processorId = ${processorId} sourcePath = ${sourcePath} data = ${JSON.stringify(data)}`);
      if (processorId == 'audioFeature1.diarization') {
        const { partial } = data;
        const nextList = [];
        for (let i = 0; i < partial.length; i++) {
          nextList.push(partial[i]);
        }
        for (let i = 0; i < this.transcriptions.length; i++) {
          const actual = this.transcriptions[i];
          nextList.push(actual);
        }
        this.transcriptions = nextList;
      }
    });
    const subscribeMe = async (message: any) => {
      //subscribeme
      const room = this.builderConfig.roomName;
      const destiny = `${room}.d.state.temporal.diarization`;
      console.log(`Subscribeme to ${destiny}`);
      instance.emitEvent('subscribeme', { ref: destiny });
    };
    instance.registerProcessor('flowchartLoaded', subscribeMe);
    subscribeMe(null);
  }

  localLoadFlowChart() {
    const { request } = this.livemodel;
    if (request) {
      const texto = Buffer.from(request, 'base64').toString('utf8');
      const decoded = JSON.parse(texto);
      this.loadFlowChart(decoded);
    }
  }

  getOrCreate(prefix: string, temporal: any) {
    if (!(prefix in temporal)) {
      temporal[prefix] = {
        key: prefix,
        html: '',
        body: {
          arrows: [],
          shapes: [],
        },
      };
    }
    const ref = temporal[prefix];
    return ref;
  }

  override async onFlowChartLoaded() {
    this.flowCharts = [];
    if (!this.livemodel.flowchart) {
      return;
    }
    const temporal: { [key: string]: OneFlowChartData } = {};
    // Se debe partir el flowchart
    const flowchart = this.livemodel.flowchart;
    //console.log(JSON.stringify(flowchart, null, 4));
    const arrows = flowchart.arrows;
    const shapes = flowchart.shapes;
    arrows.forEach((arrow: OneArrow) => {
      const prefix = arrow.prefix;
      const ref = this.getOrCreate(prefix, temporal);
      ref.body.arrows.push(arrow);
    });
    shapes.forEach((node: OneNode) => {
      const prefix = node.prefix;
      const ref = this.getOrCreate(prefix, temporal);
      ref.body.shapes.push(node);
    });
    for (let prefix in temporal) {
      const ref = temporal[prefix];
      if (ref.key == '') {
        ref.key = 'Base';
      }
      this.flowCharts.push(ref);
    }
    // Se debe pintar
    const currentNodes: Array<string> = this.livemodel.currentNodes;
    const history: Array<HistoryData> = this.livemodel.history;
    this.flowCharts.forEach((flowChart) => {
      const html = FlowChartDiagram.computeGraph(
        flowChart.body,
        currentNodes,
        history
      );
      flowChart.html = this.sanitizer.bypassSecurityTrustHtml(html);
    });
    this.cdr.detectChanges();
    requestAnimationFrame(() => {
      this.updateSvgSize();
    });
  }

  updateSvgSize() {
    this.svgContainers.toArray().forEach((mySvgRef) => {
      this.graphRecomputeBoundingBox(mySvgRef);
    });
  }

  tabFlowChartChanged(event: MatTabChangeEvent) {
    this.updateSvgSize();
  }

  graphRecomputeBoundingBox(mySvgRef: ElementRef) {
    if (mySvgRef) {
      const svg = mySvgRef.nativeElement;
      var bbox = svg.getBBox();
      // Update the width and height using the size of the contents
      svg.setAttribute('width', bbox.x + bbox.width + bbox.x);
      svg.setAttribute('height', bbox.y + bbox.height + bbox.y);
    }
    return true;
  }

  async runFlowChart() {
    this.flowChartVersion = 0;
    this.transcriptions = [];
    this.errors = [];
    this.getCallServiceInstance().emitEvent('startFlowChart', {});
  }

  async stopFlowChart() {
    this.transcriptions = [];
    this.getCallServiceInstance().emitEvent('stopFlowChart', {});
  }

  async pauseFlowChart() {
    this.getCallServiceInstance().emitEvent('pauseFlowChart', {});
  }

  setView(viewName: string) {
    const searchParams = new URLSearchParams(window.location.search);

    const url = new URL(`${location.origin}${location.pathname}`);

    url.searchParams.append('mode', viewName);
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'mode') {
        url.searchParams.append(key, value);
      }
    }
    location.assign(url.toString());
  }

  identifyPerformanceItem(index: number, item: PerformanceItem) {
    return item.txt;
  }
}
