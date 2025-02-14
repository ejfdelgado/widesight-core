import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FlowchartService, HttpService, JsonColorPipe, ModalService } from 'ejflab-front-lib';

export interface MilvusCollectionData {
  name: string;
}

export interface MilvusDatabaseData {
  name: string;
  collections: MilvusCollectionData[],
}

@Component({
  selector: 'app-milvus',
  templateUrl: './milvus.component.html',
  styleUrl: './milvus.component.css'
})
export class MilvusComponent implements OnInit, OnDestroy {

  dbs: MilvusDatabaseData[] = [];
  selectedSchema: string;
  dataBaseName: string = '';
  schemaMap: any = {
    "intent": {
      json: './flowcharts/audio/flow01milvus.json',
      path: 'intent',
    },
    "diarization": {
      json: './flowcharts/audio/flow01milvus.json',
      path: 'diarization',
    },
    "faces": {
      json: './flowcharts/audio/flow01milvus.json',
      path: 'faces',
    },
  }

  constructor(
    public cdr: ChangeDetectorRef,
    public flowchartSrv: FlowchartService,
    public modalSrv: ModalService,
    public httpSrv: HttpService,
    public jsonColorPipe: JsonColorPipe,
  ) {

  }
  ngOnInit(): void {
    //
  }
  ngOnDestroy(): void {
    //
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

  async introspect() {
    const response = await this.execute("introspect");
    if (response?.answer?.dbs instanceof Array) {
      this.dbs = response?.answer?.dbs;
      //sort =
      this.dbs.sort((dbA, dbB) => {
        return dbA.name.localeCompare(dbB.name);
      });
      this.dbs.forEach((db) => {
        db.collections.sort((collectionA, collectionB) => {
          return collectionA.name.localeCompare(collectionB.name);
        });
      })
    }
  }

  async destroyCollection(db: string, collection: string) {
    const confirm = await this.modalSrv.confirm({
      title: '¿Sure?',
      txt: "Can't be undone.",
    });
    if (!confirm) {
      return;
    }
    await this.execute("collection.destroy", db, collection);
    await this.introspect();
  }

  async describeCollection(db: string, collection: string) {
    const response = await this.execute("collection.describe", db, collection);
    if (response.answer) {
      const html = "<pre>" + this.jsonColorPipe.transform(response.answer) + "</pre>";
      this.modalSrv.alert({ title: "Detail", txt: html, ishtml: true });
    }
  }

  async destroyDatabase(db: string) {
    const confirm = await this.modalSrv.confirm({
      title: '¿Sure?',
      txt: "Can't be undone.",
    });
    if (!confirm) {
      return;
    }
    await this.execute("database.destroy", db);
    await this.introspect();
  }

  async addCollection(db: string) {
    const actual = this.schemaMap[this.selectedSchema];
    if (!actual) {
      this.modalSrv.alert({ txt: 'Please select some schema' });
      return;
    }
    await this.execute("collection.create", db, '', actual.json, actual.path);
    await this.introspect();
  }

  async createDatabase() {
    const db = this.dataBaseName;
    if (!db) {
      this.modalSrv.alert({ txt: 'Please define the database name' });
      return;
    }
    await this.execute("database.create", db);
    await this.introspect();
  }
}
