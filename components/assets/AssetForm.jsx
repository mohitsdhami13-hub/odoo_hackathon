'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assetSchema } from '@/lib/validations/asset';
import { useCreateAsset } from '@/lib/hooks/useAssets';
import { useAssetCategories } from '@/lib/hooks/useAssetCategories';

export default function AssetForm() {
  const { data: categories } = useAssetCategories();
  const createAsset = useCreateAsset();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      serialNumber: '',
      condition: '',
      location: '',
      isBookable: false,
    },
  });

  const onCreate = async (values) => {
    try {
      await createAsset.mutateAsync(values);
      reset();
    } catch {
      // surfaced via createAsset.error below
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onCreate)}
      className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div>
        <label htmlFor="asset-name" className="block text-sm font-medium text-slate-700">
          Asset name
        </label>
        <input
          id="asset-name"
          type="text"
          {...register('name')}
          placeholder="e.g. Dell Latitude 5440"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="asset-category" className="block text-sm font-medium text-slate-700">
          Category
        </label>
        <select
          id="asset-category"
          {...register('categoryId')}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Select a category</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="mt-1 text-xs text-red-600">{errors.categoryId.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="asset-serial" className="block text-sm font-medium text-slate-700">
          Serial number
        </label>
        <input
          id="asset-serial"
          type="text"
          {...register('serialNumber')}
          placeholder="Optional"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="asset-condition" className="block text-sm font-medium text-slate-700">
          Condition
        </label>
        <input
          id="asset-condition"
          type="text"
          {...register('condition')}
          placeholder="e.g. New, Good, Worn"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="asset-location" className="block text-sm font-medium text-slate-700">
          Location
        </label>
        <input
          id="asset-location"
          type="text"
          {...register('location')}
          placeholder="e.g. HQ - 3rd floor"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex items-end gap-2 pb-2">
        <input
          id="asset-bookable"
          type="checkbox"
          {...register('isBookable')}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="asset-bookable" className="text-sm font-medium text-slate-700">
          Bookable resource
        </label>
      </div>

      <div className="sm:col-span-2 lg:col-span-3">
        <button
          type="submit"
          disabled={createAsset.isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {createAsset.isPending ? 'Registering…' : 'Register asset'}
        </button>
        {createAsset.isError && (
          <p className="mt-2 text-sm text-red-600">{createAsset.error.message}</p>
        )}
      </div>
    </form>
  );
}