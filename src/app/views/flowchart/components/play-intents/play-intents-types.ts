import { SafeHtml } from "@angular/platform-browser";

/**
 * Search face type with:
 * srv/flowchart/processor_process
 */
export interface ProcessorFaceSearchItemData {
  id: number;
  distance: number;
  entity: {
    millis: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    id: number;
    document_id: string;
    face_path: string;
  };
}

export interface ProcessorFaceSearchData {
  results: Array<ProcessorFaceSearchItemData>;
}

export interface ProcessorFaceSearchResponseData {
  status: string;
  message?: string;
  response?: {
    data: ProcessorFaceSearchData;
  };
}

/**
 * Search intents type with:
 * srv/flowchart/processor_process
 */
export interface SearchTextResponseItemData {
  score: number;
  document_id: string;
  text: string;
  speaker: string;
  start_time: number;
  end_time: number;
}

export interface SearchTextResponseData {
  status: string;
  message?: string;
  response?: {
    data: Array<SearchTextResponseItemData>;
  };
}

/**
 * Search words with "or" or "and" with:
 * srv/mongo/searchable/read
 */
export interface SearchTextLikeResponseData {
  status: string;
  message?: string;
  list: Array<SearchTextResponseItemData>;
}

/**
 * Search plate type with:
 * srv/mongo/dbtemp/read
 */
export interface SearchPlateItemData {
  _id: string;
  vehicle: {
    bbox: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };
  };
  license_plate: {
    bbox: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };
    bbox_score: number;
    text_score: number;
  };
  license_plate_text: string;
  license_plate_path: string;
  document_id: string;
  millis: number;
}

export interface SearchPlateResponseData {
  status: string;
  message?: string;
  list: Array<SearchPlateItemData>;
}

/**
 * Item of list of current flowchart instances with:
 * srv/flowchart/introspect
 */
export interface FlowchartRoomsProgressData {
  room: string;
  percentage: number;
}

export interface AccountData {
  id: string;
  name: string;
  created_at: number;
}

export interface AppData {
  id: string;
  name: string;
  account_id: string;
  //created_at: number;
}

export interface VideoData {
  id: string;
  createdtime: number;
  description: string | null;
  duration: number | null;
  endtime: number | null;
  filesize: number;
  frameheight: number | null;
  framewidth: number | null;
  name: string;
  sourceurl: string | null;
  starttime: number | null;
  thumbnail: string | null;
  state: string | null;
}

export interface BBoxResultData {
  class: string;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  style: {};
}

export interface ImgFaceData {
  imagePath: string;
  bucket: string;
  loaded: boolean;
  element?: HTMLImageElement;
  width?: number;
  height?: number;
  bbox: Array<BBoxResultData>;
  text: SafeHtml;
}

export interface AnswerData {
  txt: SafeHtml;
  detail: SafeHtml;
}

export interface JobData {
  text: string;
  url: string;
  percentage: number;
}

export interface ChatGPT4AllSessionData {
  role: string;
  content: string;
}

export interface ProcessorResponseData {
  stdout: string;
  stderr: string;
  command: string;
}