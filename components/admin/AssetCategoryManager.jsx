'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assetCategorySchema } from '@/lib/validations/assetCategory';
import {
  useAssetCategories,
  useCreateAssetCategory,
  useDeleteAssetCategory,
} from '@/lib/hooks/useAssetCategories';

export default function AssetCategoryManager() {
  const { data: categories, isLoading, isError } = useAssetCategories();
  const createCategory = useCreateAssetCategory();
  const deleteCategory = useDeleteAssetCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(assetCategorySchema),
    defaultValues: { name: '' },
  });

  const onCreate = async (values) => {
    try {
      await createCategory.mutateAsync(values);
      reset();
    } catch {
      // surfaced via createCategory.error below
    }
  };

  const onDelete = (category) => {
    if (category._count?.assets > 0) return;
    if (window.confirm(`Delete "${category.name}"? This can't be undone.`)) {
      deleteCategory.mutate(category.id);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit(onCreate)}
        className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="cat-name" className="block text-sm font-medium text-slate-700">
            Category name
          </label>
          <input
            id="cat-name"
            type="text"
            {...register('name')}
            placeholder="e.g. Laptops"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <button
          type="submit"
          disabled={createCategory.isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {createCategory.isPending ? 'Adding…' : 'Add category'}
        </button>
      </form>
      {createCategory.isError && (
        <p className="text-sm text-red-600">{createCategory.error.message}</p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Name</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Assets</th>
              <th className="px-4 py-2 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Loading categories…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-red-600">
                  Couldn&apos;t load categories.
                </td>
              </tr>
            )}
            {categories?.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  No categories yet. Add your first one above.
                </td>
              </tr>
            )}
            {categories?.map((cat) => (
              <tr key={cat.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{cat.name}</td>
                <td className="px-4 py-3 text-slate-600">{cat._count?.assets ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(cat)}
                    disabled={cat._count?.assets > 0}
                    title={
                      cat._count?.assets > 0
                        ? 'Remove or recategorize assets first'
                        : 'Delete category'
                    }
                    className="text-sm font-medium text-red-600 hover:text-red-500 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}