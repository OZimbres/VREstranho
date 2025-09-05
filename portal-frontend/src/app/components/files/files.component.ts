import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified: Date;
}

interface Agent {
  id: string;
  name: string;
  status: 'online' | 'offline';
}

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatMenuModule,
    MatProgressBarModule
  ],
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss']
})
export class FilesComponent implements OnInit {
  
  selectedAgentId: string = '';
  currentPath: string = '/';
  isLoading: boolean = false;
  
  agents: Agent[] = [
    { id: 'agent-001', name: 'PDV-Loja-001', status: 'online' },
    { id: 'agent-002', name: 'PDV-Loja-002', status: 'online' },
    { id: 'agent-003', name: 'PDV-Loja-003', status: 'offline' }
  ];

  files: FileItem[] = [
    {
      name: 'vr.properties',
      type: 'file',
      size: 1024,
      lastModified: new Date('2024-09-05T10:00:00')
    },
    {
      name: 'config',
      type: 'directory',
      lastModified: new Date('2024-09-05T09:00:00')
    },
    {
      name: 'lib',
      type: 'directory',
      lastModified: new Date('2024-09-04T15:30:00')
    },
    {
      name: 'application.jar',
      type: 'file',
      size: 15728640, // 15MB
      lastModified: new Date('2024-09-03T14:20:00')
    },
    {
      name: 'readme.txt',
      type: 'file',
      size: 512,
      lastModified: new Date('2024-09-01T08:15:00')
    }
  ];

  displayedColumns: string[] = ['name', 'type', 'size', 'lastModified', 'actions'];

  ngOnInit() {
    // Select first online agent by default
    const firstOnlineAgent = this.agents.find(agent => agent.status === 'online');
    if (firstOnlineAgent) {
      this.selectedAgentId = firstOnlineAgent.id;
      this.loadFiles();
    }
  }

  onAgentChange() {
    if (this.selectedAgentId) {
      this.currentPath = '/';
      this.loadFiles();
    }
  }

  loadFiles() {
    if (!this.selectedAgentId) return;
    
    this.isLoading = true;
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      console.log(`Loading files for agent ${this.selectedAgentId} at ${this.currentPath}`);
    }, 1000);
  }

  navigateToDirectory(item: FileItem) {
    if (item.type === 'directory') {
      this.currentPath = this.currentPath === '/' ? 
        `/${item.name}` : 
        `${this.currentPath}/${item.name}`;
      this.loadFiles();
    }
  }

  navigateUp() {
    if (this.currentPath !== '/') {
      const pathParts = this.currentPath.split('/');
      pathParts.pop();
      this.currentPath = pathParts.length <= 1 ? '/' : pathParts.join('/');
      this.loadFiles();
    }
  }

  onFileAction(file: FileItem, action: string) {
    console.log(`Action ${action} for file ${file.name}`);
    // Implement file actions (download, edit, delete, etc.)
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '-';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  getFileIcon(item: FileItem): string {
    if (item.type === 'directory') {
      return 'folder';
    }
    
    const extension = item.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'txt': return 'description';
      case 'jar': return 'archive';
      case 'properties': return 'settings';
      case 'dll': return 'extension';
      case 'exe': return 'launch';
      default: return 'insert_drive_file';
    }
  }

  get selectedAgent(): Agent | undefined {
    return this.agents.find(agent => agent.id === this.selectedAgentId);
  }

  get canManageFiles(): boolean {
    return !!this.selectedAgent && this.selectedAgent.status === 'online';
  }
}