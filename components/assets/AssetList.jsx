'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAssets } from '@/lib/hooks/useAssets';
import { useAssetCategories } from '@/lib/hooks/useAssetCategories';

const STATUS_LABELS = {
  AVAILABLE: 'Available',
  ALLOCATED: 'Allocated',
  RESERVED: 'Reserved',
  UNDER_MAINTENANCE: 'Under maintenance',
  RETIRED: 'Retired',
};

const STATUS_STYLES = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  ALLOCATED: 'bg-indigo-100 text-indigo-700',
  RESERVED: 'bg-amber-100 text-amber-700',
  UNDER_MAINTENANCE: 'bg-orange-100 text-orange-700',
  RETIRED: 'bg-slate-200 text-slate-600',
};

export default function AssetList() {
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data: categories } = useAssetCategories();
  const { data: assets, isLoading, isError } = useAssets({ category, status, search });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="asset-search" className="block text-sm font-medium text-slate-700">
            Search
          </label>
          <input
            id="asset-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or asset tag"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="sm:w-48">
          <label htmlFor="asset-filter-category" className="block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            id="asset-filter-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All categories</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-48">
          <label htmlFor="asset-filter-status" className="block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="asset-filter-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Tag</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Name</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Category</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Held by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Loading assets…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-red-600">
                  Couldn&apos;t load assets.
                </td>
              </tr>
            )}
            {assets?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No assets match these filters.
                </td>
              </tr>
            )}
            {assets?.map((asset) => {
              const activeAllocation = asset.allocations?.[0];
              return (
                <tr key={asset.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    <Link href={`/admin/assets/${asset.id}`} className="text-indigo-600 hover:underline">
                      {asset.assetTag}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{asset.name}</td>
                  <td className="px-4 py-3 text-slate-600">{asset.category?.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[asset.status]}`}
                    >
                      {STATUS_LABELS[asset.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {activeAllocation
                      ? activeAllocation.employee?.name || activeAllocation.department?.name || '—'
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}