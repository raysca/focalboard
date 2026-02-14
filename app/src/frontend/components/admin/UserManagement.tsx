import React, { useState } from 'react'
import { useUsers, useUpdateUserRole, useDisableUser } from '../../hooks/useAdminSettings'

export function UserManagement() {
    const [page, setPage] = useState(0)
    const [search, setSearch] = useState('')
    const { data, isLoading } = useUsers(page, 50, search)
    const updateRole = useUpdateUserRole()
    const disableUser = useDisableUser()

    const handleRoleChange = async (userId: string, currentRoles: string) => {
        const isAdmin = currentRoles.includes('admin')
        const newRole = isAdmin ? 'user' : 'admin'

        if (confirm(`Are you sure you want to ${isAdmin ? 'revoke' : 'grant'} admin privileges?`)) {
            try {
                await updateRole.mutateAsync({ userId, role: newRole })
            } catch (error) {
                console.error('Failed to update role:', error)
                alert('Failed to update user role')
            }
        }
    }

    const handleDisable = async (userId: string, userName: string) => {
        if (confirm(`Are you sure you want to disable user ${userName}?`)) {
            try {
                await disableUser.mutateAsync(userId)
            } catch (error) {
                console.error('Failed to disable user:', error)
                alert('Failed to disable user')
            }
        }
    }

    if (isLoading) {
        return <div className="p-6">Loading users...</div>
    }

    return (
        <div className="max-w-6xl">
            <h2 className="text-2xl font-bold mb-6">User Management</h2>

            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(0)
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Username
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {data?.users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.name}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {user.username || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                user.roles.includes('admin')
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {user.roles.includes('admin') ? 'Admin' : 'User'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => handleRoleChange(user.id, user.roles)}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            {user.roles.includes('admin')
                                                ? 'Revoke Admin'
                                                : 'Make Admin'}
                                        </button>
                                        <button
                                            onClick={() => handleDisable(user.id, user.name)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Disable
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {data && (
                    <div className="px-6 py-4 border-t flex items-center justify-between">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-4 py-2 border rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-700">Page {page + 1}</span>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={!data.hasMore}
                            className="px-4 py-2 border rounded-md disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
