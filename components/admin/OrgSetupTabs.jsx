'use client';

import { useState } from 'react';
import DepartmentManager from './DepartmentManager';
import AssetCategoryManager from './AssetCategoryManager';
import EmployeeDirectory from './EmployeeDirectory';

const TABS = [
  { id: 'departments', label: 'Departments' },
  { id: 'categories', label: 'Asset categories' },
  { id: 'directory', label: 'Employee directory' },
];

export default function OrgSetupTabs() {
  const [activeTab, setActiveTab] = useState('departments');

  return (
    <div>
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6" aria-label="Org setup sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'departments' && <DepartmentManager />}
        {activeTab === 'categories' && <AssetCategoryManager />}
        {activeTab === 'directory' && <EmployeeDirectory />}
      </div>
    </div>
  );
}