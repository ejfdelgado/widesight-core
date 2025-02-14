import { SafeHtml } from '@angular/platform-browser';

export interface HistoryData {
  id: string;
}

export interface OneArrow {
  id: string;
  txt: string;
  tar: string;
  src: string;
  prefix: string;
}

export interface OneNode {
  id: string;
  txt: string;
  pos: any;
  type: string;
  style: any;
  prefix: string;
}

export interface OneFlowChartData {
  key: string;
  html: SafeHtml;
  body: {
    arrows: Array<OneArrow>;
    shapes: Array<OneNode>;
    prefixes?: Array<string>;
  };
}

export interface PerformanceItem {
  txt: string;
  avg?: number;
  min?: number;
  max?: number;
  med?: number;
  n?: number;
  time: Array<number>;
}
