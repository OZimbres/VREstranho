import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  
  stats = {
    totalAgents: 0,
    onlineAgents: 0,
    totalOperations: 0,
    successfulOperations: 0
  };

  recentOperations = [
    {
      id: 1,
      agentName: 'PDV-001',
      operation: 'File Upload',
      status: 'completed',
      timestamp: new Date()
    },
    {
      id: 2,
      agentName: 'PDV-002',
      operation: 'Application Install',
      status: 'in-progress',
      timestamp: new Date()
    }
  ];

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    // Mock data for demonstration
    this.stats = {
      totalAgents: 15,
      onlineAgents: 12,
      totalOperations: 143,
      successfulOperations: 128
    };
  }

  get onlinePercentage(): number {
    return this.stats.totalAgents > 0 ? 
      (this.stats.onlineAgents / this.stats.totalAgents) * 100 : 0;
  }

  get successPercentage(): number {
    return this.stats.totalOperations > 0 ? 
      (this.stats.successfulOperations / this.stats.totalOperations) * 100 : 0;
  }
}