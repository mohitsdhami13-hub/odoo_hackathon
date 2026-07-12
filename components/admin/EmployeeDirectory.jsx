'use client';

import { useSession } from 'next-auth/react';
import { useDepartments } from '@/lib/hooks/useDepartments';
import { useEmployees, usePromoteEmployee, useAssignDepartment } from '@/lib/hooks/useEmployees';

const PROMOTABLE_ROLES = ['EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER'];

const ROLE_LABELS = {
  EMPLOYEE: 'Employee',
  DEPARTMENT_HEAD: 'Department head',
  ASSET_MANAGER: 'Asset manager',
  ADMIN: 'Admin',
};

export default function EmployeeDirectory() {
  const { data: session } = useSession();
  const { data: employees, isLoading, isError } = useEmployees();
  const { data: departments } = useDepartments(true);
  const promoteEmployee = usePromoteEmployee();
  const assignDepartment = useAssignDepartment();

  const onRoleChange = (employee, role) => {
    if (role === employee.role) return;
    promoteEmployee.mutate({ id: employee.id, role });
  };

  const onDepartmentChange = (employee, departmentId) => {
    assignDepartment.mutate({ id: employee.id, departmentId: departmentId || null });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Name</th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Email</th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Department</th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Role</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                Loading employees…
              </td>
            </tr>
          )}
          {isError && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-red-600">
                Couldn&apos;t load the employee directory.
              </td>
            </tr>
          )}
          {employees?.map((emp) => {
            const isSelf = emp.id === session?.user?.id;
            return (
              <tr key={emp.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {emp.name}
                  {isSelf && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                </td>
                <td className="px-4 py-3 text-slate-600">{emp.email}</td>
                <td className="px-4 py-3">
                  {emp.role === 'ADMIN' ? (
                    <span className="text-slate-400">—</span>
                  ) : (
                    <select
                      value={emp.department?.id || emp.departmentId || ''}
                      onChange={(e) => onDepartmentChange(emp, e.target.value)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    >
                      <option value="">Unassigned</option>
                      {departments?.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3">
                  {emp.role === 'ADMIN' ? (
                    <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      Admin
                    </span>
                  ) : (
                    <select
                      value={emp.role}
                      disabled={isSelf}
                      onChange={(e) => onRoleChange(emp, e.target.value)}
                      title={isSelf ? "You can't change your own role" : undefined}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      {PROMOTABLE_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {(promoteEmployee.isError || assignDepartment.isError) && (
        <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
          {(promoteEmployee.error || assignDepartment.error)?.message}
        </p>
      )}
    </div>
  );
}