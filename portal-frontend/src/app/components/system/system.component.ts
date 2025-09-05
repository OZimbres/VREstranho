import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-system',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="component-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>settings</mat-icon>
            Sistema
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Configurações e informações do sistema serão exibidas aqui.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .component-container {
      padding: 20px;
      max-width: 1200px;
    }
  `]
})
export class SystemComponent { }