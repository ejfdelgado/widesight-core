import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModalService } from 'ejflab-front-lib';
import { MongoReadData, MongoService } from 'ejflab-front-lib';
import { MyColor } from '@ejfdelgado/ejflab-common/src/MyColor';

export interface DocumentWidesight {
  _id: string;
  date_modified_content: number;
  date_modified_inode: number;
  date_created: number;
  date_modified: number;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  seconds: number;
  encoder: string;
  image: {
    width: number;
    height: number;
    x_resolution: number;
    y_resolution: number;
    bit_dept: number;
    frame_rate_hz: number;
    pixel_ratio: string;
  };
  audio: {
    format: string;
    channels: number;
    bits_per_sample: number;
    sample_rate_hz: number;
  };
  document_id: string;
  process_time: number;
}

@Component({
  selector: 'app-play-documents',
  templateUrl: './play-documents.component.html',
  styleUrls: ['./play-documents.component.css'],
})
export class PlayDocumentsComponent implements OnInit {
  max: number = 20;
  loadedArray: Array<any> = [];
  formLeft: FormGroup;
  currenSearch: string = '';
  currentDocument: DocumentWidesight | null = null;

  constructor(
    private fb: FormBuilder,
    private modalSrv: ModalService,
    public mongoSrv: MongoService
  ) {}

  ngOnInit(): void {
    // get from query params
    const urlParams = new URLSearchParams(window.location.search);
    const documentId = urlParams.get('document_id');
    //console.log(`documentId=${documentId}`);
    this.formLeft = this.fb.group({
      moviePath: [documentId, []],
    });
    if (documentId) {
      this.pageMongo();
      this.readGeneralDocument();
    }
  }

  async readGeneralDocument() {
    const moviePath = this.formLeft.get('moviePath')?.getRawValue();
    const payload: MongoReadData = {
      database: 'dbnotes',
      where: `select * from collection_document \
      WHERE document_id = "${moviePath}" \
      LIMIT 1`,
    };
    const ans = await this.mongoSrv.read(payload);
    if (ans.status == 'ok') {
      if (ans.list.length > 0) {
        this.currentDocument = ans.list[0];
      }
    }
  }

  async pageMongo() {
    const moviePath = this.formLeft.get('moviePath')?.getRawValue();

    // Make a hash
    const currenSearch = `${moviePath}`;
    if (currenSearch != this.currenSearch) {
      this.loadedArray = [];
    }
    const payload: MongoReadData = {
      database: 'dbnotes',
      where: `select * from collection_segment \
      WHERE document_id = "${moviePath}" \
      ORDER BY start_time ASC
      LIMIT ${this.max} OFFSET ${this.loadedArray.length}`,
    };
    const ans = await this.mongoSrv.read(payload);
    if (ans.status == 'ok') {
      const lista = ans.list;
      for (let i = 0; i < lista.length; i++) {
        const element = lista[i];
        this.loadedArray.push(element);
      }
      this.currenSearch = currenSearch;
    }
  }

  getColorForSpeaker(speakerId: string) {
    const myNumber = /\d+$/.exec(speakerId);
    if (myNumber) {
      const speakerId = parseInt(myNumber[0]) + 1;
      const rotation: any = MyColor.int2HueDegree(speakerId);
      return `hue-rotate(${parseInt(rotation)}deg)`;
    }
    return 'hue-rotate(0deg)';
  }
}
