import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MycommonModule } from 'ejflab-front-lib';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';

import { FlowchartRoutingModule } from './flowchart-routing.module';
import { FlowchartComponent } from './flowchart.component';
import { PlayFaqsComponent } from './components/play-faqs/play-faqs.component';
import { PlayIntentsComponent } from './components/play-intents/play-intents.component';
import { PlayMinioComponent } from './components/play-minio/play-minio.component';
import { PlayDocumentsComponent } from './components/play-documents/play-documents.component';
import { SortPerformancePipe } from './pipes/sort-performance.pipe';
import { MillisToSecondsPipe } from './pipes/millis-to-seconds.pipe';
import { SpeechToTextComponent } from './components/speech-to-text/speech-to-text.component';
import { MilvusComponent } from './components/milvus/milvus.component';

@NgModule({
  declarations: [
    FlowchartComponent,
    PlayFaqsComponent,
    PlayIntentsComponent,
    PlayMinioComponent,
    PlayDocumentsComponent,
    SortPerformancePipe,
    MillisToSecondsPipe,
    SpeechToTextComponent,
    MilvusComponent,
  ],
  imports: [
    CommonModule,
    FlowchartRoutingModule,
    MatIconModule,
    MycommonModule,
    FormsModule,
    MatMenuModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatTabsModule,
  ],
})
export class FlowchartModule {}
