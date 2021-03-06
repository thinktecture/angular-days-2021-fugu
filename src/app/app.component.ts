import { AfterViewInit, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import {PaintService} from './paint.service';
import {DOCUMENT} from "@angular/common";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  // EX #1
  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>;
  context: CanvasRenderingContext2D;

  // EX #11
  private fileOptions = {
    types: [{
      description: 'PNG files',
      accept: {'image/png': ['.png']}
    }, {
      description: 'JPEG files',
      accept: {'image/jpeg': ['.jpg', '.jpeg']}
    }]
  };

  previousPoint: { x: number, y: number } | null = null;
  // EX #17

  constructor(private paintService: PaintService, @Inject(DOCUMENT) private document: Document) {
  }

  async ngAfterViewInit(): Promise<any> {
    // EX #2
    const canvas = this.canvas.nativeElement;
    const ctx = this.context = canvas.getContext('2d', {
      desynchronized: true
    });

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';

    // EX #16
  }

  onPointerDown(event: PointerEvent): void {
    this.previousPoint = {x: Math.floor(event.offsetX), y: Math.floor(event.offsetY)};
  }

  onPointerMove(canvas: HTMLCanvasElement, event: PointerEvent): void {
    // EX #4
    if (this.previousPoint) {
      const currentPoint = {
        x: Math.floor(event.offsetX),
        y: Math.floor(event.offsetY)
      };
      const points = this.paintService.bresenhamLine(
        this.previousPoint.x, this.previousPoint.y,
        currentPoint.x, currentPoint.y
      );

      for (const {x, y} of points) {
        this.context.fillRect(x, y, 2, 2);
      }

      this.previousPoint = currentPoint;
    }
  }

  onPointerUp(): void {
    this.previousPoint = null;
  }

  colorChange($event) {
    // EX #6
    this.context.fillStyle = $event.target.value;
  }

  async open(): Promise<void> {
    // EX #12
    const [handle] = await (window as any).showOpenFilePicker(this.fileOptions);
    const file = await handle.getFile();
    const image = await this.paintService.getImage(file);
    this.context.drawImage(image, 0, 0);
  }

  async save(): Promise<void> {
    // EX #11
    const blob = await this.paintService.toBlob(this.canvas.nativeElement);
    const handle = await (window as any).showSaveFilePicker(this.fileOptions);
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    // EX #18
  }

  async copy(): Promise<void> {
    // EX #13
    const blob = await this.paintService.toBlob(this.canvas.nativeElement);
    await navigator.clipboard.write([
      new ClipboardItem({[blob.type]: blob})
    ]);
  }

  async paste(): Promise<void> {
    // EX #14
    const clipboardItems = await navigator.clipboard.read();
    for (const clipboardItem of clipboardItems) {
      for (const type of clipboardItem.types) {
        if (type === 'image/png') {
          const blob = await clipboardItem.getType(type);
          const image = await this.paintService.getImage(blob);
          this.context.drawImage(image, 0, 0);
        }
      }
    }
  }

  async share(): Promise<any> {
    // EX #15
    const blob = await this.paintService.toBlob(this.canvas.nativeElement);
    const file = new File([blob], 'untitled.png', {type: 'image/png'});
    const item = {files: [file], title: 'untitled.png'};
    if (await navigator.canShare(item)) {
      await navigator.share(item);
    }
  }
}
