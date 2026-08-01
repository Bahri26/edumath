import React from 'react';
import { Home, BookOpen, Settings } from 'lucide-react';
import SidebarItem from './SidebarItem';

export default {
  title: 'UI/SidebarItem',
  component: SidebarItem,
  tags: ['autodocs'],
  argTypes: {
    icon: { control: false },
    active: { control: 'boolean' },
    isCollapsed: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
};

export const Default = {
  args: {
    icon: Home,
    label: 'Panel',
    active: false,
    isCollapsed: false,
  },
};

export const Active = {
  name: 'Aktif',
  args: {
    icon: BookOpen,
    label: 'Dersler',
    active: true,
    isCollapsed: false,
  },
};

export const Collapsed = {
  name: 'Daraltılmış',
  args: {
    icon: Settings,
    label: 'Ayarlar',
    active: false,
    isCollapsed: true,
  },
};

export const Sidebar = {
  name: 'Kenar çubuğu',
  render: () => (
    <div className="w-56 p-2 rounded-xl border bg-white dark:bg-slate-900 flex flex-col gap-1">
      <SidebarItem icon={Home} label="Panel" active isCollapsed={false} onClick={() => {}} />
      <SidebarItem icon={BookOpen} label="Dersler" active={false} isCollapsed={false} onClick={() => {}} />
      <SidebarItem icon={Settings} label="Ayarlar" active={false} isCollapsed={false} onClick={() => {}} />
    </div>
  ),
};
