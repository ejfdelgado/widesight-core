import { Pipe, PipeTransform } from '@angular/core';
import { PerformanceItem } from '../types/types';

@Pipe({
  name: 'MillisToSeconds',
})
export class MillisToSecondsPipe implements PipeTransform {
  transform(value: any): string {
    if (typeof value == 'number') {
      return (value / 1000).toFixed(2);
    }
    return '-';
  }
}
