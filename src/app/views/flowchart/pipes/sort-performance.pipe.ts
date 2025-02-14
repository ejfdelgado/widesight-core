import { Pipe, PipeTransform } from '@angular/core';
import { PerformanceItem } from '../types/types';

@Pipe({
  name: 'sortPerformance',
})
export class SortPerformancePipe implements PipeTransform {
  computeAverage(list?: Array<number>): number {
    let suma = 0;
    if (!list || list.length == 0) {
      return 0;
    }
    for (let i = 0; i < list.length; i++) {
      suma += list[i];
    }
    return Math.ceil(suma / list.length);
  }
  computeMinMaxMedian(list?: Array<number>): {
    min: number;
    max: number;
    med: number;
  } {
    const response = { min: 0, max: 0, med: 0 };
    if (!list || list.length == 0) {
      return response;
    }
    list.sort((a, b) => a - b);
    response.min = list[0];
    response.max = list[list.length - 1];
    response.med = list[Math.ceil((list.length - 1) / 2)];
    return response;
  }
  transform(value: any, arg1?: any, arg2?: any): Array<PerformanceItem> {
    let list: Array<PerformanceItem> = [];
    if (value) {
      const llaves = Object.keys(value);
      // Compute avg
      for (let i = 0; i < llaves.length; i++) {
        const llave = llaves[i];
        const item = value[llave];
        if (item && item.txt && item.txt.trim().length > 0) {
          const { min, max, med } = this.computeMinMaxMedian(item.time);
          list.push({
            time: item.time,
            txt: item.txt,
            avg: this.computeAverage(item.time),
            min,
            max,
            med,
            n: item.time ? item.time.length : 0,
          });
        } else {
          //console.log(`Ignoring ${JSON.stringify(item)}`);
        }
      }
      list = list.sort((a, b) => {
        let comparation = 0;
        comparation = (b.avg ? b.avg : 0) - (a.avg ? a.avg : 0);
        // console.log(`Sorting ${b.avg}, ${a.avg} = ${comparation}`);
        return comparation;
      });
    }
    return list;
  }
}
