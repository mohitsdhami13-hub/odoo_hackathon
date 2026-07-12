'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { departmentSchema } from '@/lib/validations/department';
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
} from '@/lib/hooks/useDepartments';
import { useEmployees } from '@/lib/hooks/useEmployees';

export default function DepartmentManager() {
  const { data: departments, isLoading, isError } = useDepartments();
  const { data: employees } = useEmployees();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '', headId: '' },
  });

  const onCreate = async (values) => {
    try {
      await createDepartment.mutateAsync({
        name: values.name,
        headId: values.headId || null,
      });
      reset();
    } catch {
      // surfaced via createDepartment.error below
    }
  };

  const toggleActive = (department) => {
    updateDepartment.mutate({ id: department.id, isActive: !department.isActive });
  };

  const changeHead = (department, headId) => {
    updateDepartment.mutate({ id: department.id, headId: headId || null });
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit(onCreate)}
        className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="dept-name" className="block text-sm font-medium text-slate-700">
            Department name
          </label>
          <input
            id="dept-name"
            type="text"
            {...register('name')}
            placeholder="e.g. Facilities"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div className="sm:w-56">
          <label htmlFor="dept-head" className="block text-sm font-medium text-slate-700">
            Department head (optional)
          </label>
          <select
            id="dept-head"
            {...register('headId')}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Unassigned</option>
            {employees?.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={createDepartment.isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {createDepartment.isPending ? 'Adding…' : 'Add department'}
        </button>
      </form>
      {createDepartment.isError && (
        <p className="text-sm text-red-600">{createDepartment.error.message}</p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Name</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Head</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Employees</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-2 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Loading departments…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-red-600">
                  Couldn&apos;t load departments.
                </td>
              </tr>
            )}
            {departments?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No departments yet. Add your first one above.
                </td>
              </tr>
            )}
            {departments?.map((dept) => (
              <tr key={dept.id} className={dept.isActive ? '' : 'opacity-50'}>
                <td className="px-4 py-3 font-medium text-slate-900">{dept.name}</td>
                <td className="px-4 py-3">
                  <select
                    value={dept.headId || ''}
                    onChange={(e) => changeHead(dept, e.target.value)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {employees?.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-600">{dept._count?.employees ?? 0}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      dept.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {dept.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleActive(dept)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    {dept.isActive ? 'Deactivate' : 'Reactivate'}
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