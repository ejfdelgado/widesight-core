import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MinioService } from 'ejflab-front-lib';
import { ModalService } from 'ejflab-front-lib';
import { MongoReadData, MongoService } from 'ejflab-front-lib';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';

@Component({
  selector: 'app-play-minio',
  templateUrl: './play-minio.component.html',
  styleUrls: ['./play-minio.component.css'],
})
export class PlayMinioComponent implements OnInit {
  max: number = 5;
  loadedArray: Array<any> = [];
  formLeft: FormGroup;
  currenSearch: string = '';

  constructor(
    private fb: FormBuilder,
    private modalSrv: ModalService,
    public mongoSrv: MongoService,
    private minioSrv: MinioService
  ) {}

  ngOnInit(): void {
    this.formLeft = this.fb.group({
      moviePath: ['/tmp/movies/protesta.mp4', []],
      startTime: [0, []],
      endTime: [400, []],
    });
  }

  completeResultImage(bucket: string, path: string) {
    const localPath = `srv/minio/${bucket}/${path}`;
    return MyConstants.SRV_ROOT + localPath + '?authcookie=1&max_age=30';
  }

  async destroyFrames() {
    const response = await this.modalSrv.confirm({
      title: '¿Sure to erase the collection?',
      txt: "Can't be undone.",
    });
    if (!response) {
      return;
    }
    const payload: MongoReadData = {
      database: 'dbtemp',
      where: 'select * from collection_frames',
    };
    await this.mongoSrv.delete(payload);
  }

  async pageMongo() {
    const moviePath = this.formLeft.get('moviePath')?.getRawValue();
    const startTime = this.formLeft.get('startTime')?.getRawValue();
    const endTime = this.formLeft.get('endTime')?.getRawValue();

    // Make a hash
    const currenSearch = `${moviePath}-${startTime}-${endTime}`;
    if (currenSearch != this.currenSearch) {
      this.loadedArray = [];
    }
    const payload: MongoReadData = {
      database: 'dbtemp',
      where: `select * from collection_frames \
      WHERE src = "${moviePath}" \
      AND t >= ${startTime} \
      AND t <= ${endTime}
      ORDER BY t ASC
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
}
