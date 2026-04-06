import { ChangeDetectionStrategy, Component, input } from '@angular/core'

@Component({
  selector: 'sty-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sty-button-host',
  },
  template: `
    <button class="sty-button" [attr.type]="type()" [disabled]="disabled()">
      <ng-content />
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .sty-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2.75rem;
      padding: 0.75rem 1rem;
      border: 0;
      border-radius: 999px;
      background: linear-gradient(135deg, #38bdf8, #6366f1);
      color: #eff6ff;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }

    .sty-button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  `,
})
export class StyloraButtonComponent {
  readonly type = input<'button' | 'submit' | 'reset'>('button')
  readonly disabled = input(false)
}
