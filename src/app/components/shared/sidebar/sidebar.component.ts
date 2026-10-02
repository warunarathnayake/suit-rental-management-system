import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  badge?: string;
  expanded?: boolean;
  children?: { label: string; route: string; badge?: string }[];
}

interface MenuGroup {
  title?: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  menuGroups: MenuGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        {
          label: 'Dashboard',
          icon: 'bi-grid-1x2-fill',
          route: '/dashboard'
        }
      ]
    },
    {
      title: 'OPERATION',
      items: [
        {
          label: 'Rental Pipeline',
          icon: 'bi-luggage-fill',
          route: '/rentals'
        },
        {
          label: 'Tailoring Pipeline',
          icon: 'bi-scissors',
          route: '/workflow-tasks'
        }
      ]
    },
    {
      title: 'INVENTORY',
      items: [
        {
          label: 'Suit Catalog',
          icon: 'bi-journal-bookmark-fill',
          route: '/inventory'
        }
      ]
    },
    {
      title: 'CLIENTS',
      items: [
        {
          label: 'Client Management',
          icon: 'bi-person-lines-fill',
          route: '/customers'
        }
      ]
    }
  ];
}
