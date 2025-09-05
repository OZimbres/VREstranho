import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

interface Agent {
  id: string;
  name: string;
  hostname: string;
  platform: string;
  version: string;
  status: 'online' | 'offline';
  last_seen: Date;
  ip_address: string;
  network_id?: string;
  store_id?: string;
}

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatMenuModule,
    MatBadgeModule
  ],
  templateUrl: './agents.component.html',
  styleUrls: ['./agents.component.scss']
})
export class AgentsComponent implements OnInit {
  
  displayedColumns: string[] = ['name', 'hostname', 'platform', 'status', 'last_seen', 'ip_address', 'actions'];
  
  agents: Agent[] = [
    {
      id: 'agent-001',
      name: 'PDV-Loja-001',
      hostname: 'PDV-001-MAIN',
      platform: 'Windows 10',
      version: '1.0.0',
      status: 'online',
      last_seen: new Date(),
      ip_address: '192.168.1.10',
      network_id: 'network-001',
      store_id: 'store-001'
    },
    {
      id: 'agent-002',
      name: 'PDV-Loja-002',
      hostname: 'PDV-002-BACKUP',
      platform: 'Linux Ubuntu 20.04',
      version: '1.0.0',
      status: 'online',
      last_seen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      ip_address: '192.168.1.11',
      network_id: 'network-001',
      store_id: 'store-001'
    },
    {
      id: 'agent-003',
      name: 'PDV-Loja-003',
      hostname: 'PDV-003-TEST',
      platform: 'Windows 11',
      version: '1.0.0',
      status: 'offline',
      last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      ip_address: '192.168.1.12',
      network_id: 'network-001',
      store_id: 'store-002'
    }
  ];

  ngOnInit() {
    this.loadAgents();
  }

  private loadAgents() {
    // In a real app, this would call the API service
    console.log('Loading agents...');
  }

  onAgentAction(agent: Agent, action: string) {
    console.log(`Action ${action} for agent ${agent.name}`);
    // Implement actions like restart, update, etc.
  }

  getStatusIcon(status: string): string {
    return status === 'online' ? 'cloud_done' : 'cloud_off';
  }

  getStatusClass(status: string): string {
    return status === 'online' ? 'online' : 'offline';
  }

  getPlatformIcon(platform: string): string {
    if (platform.toLowerCase().includes('windows')) {
      return 'computer';
    } else if (platform.toLowerCase().includes('linux')) {
      return 'terminal';
    }
    return 'device_unknown';
  }
}