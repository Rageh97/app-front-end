"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { UserPlus, UserX, Loader2, User, UserCog, UserCheck } from 'lucide-react';
import { useGetUsersList, useGetUsersByRole } from '@/utils/users/getUsersList';

type UserRole = 'employee' | 'manager' | 'supervisor';

interface UserType {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}


const ManageUsers = () => {
  
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('employee');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemoving, setIsRemoving] = useState<number | null>(null);

  const roleConfig = {
    employee: {
      label: 'Employee',
      color: 'orange',
      icon: <User className="w-5 h-5" />,
      apiPath: 'employee',
      translationKey: 'employee',
    },
    manager: {
      label: 'Manager',
      color: 'blue',
      icon: <UserCog className="w-5 h-5" />,
      apiPath: 'manager',
      translationKey: 'manager',
    },
    supervisor: {
      label: 'Supervisor',
      color: 'purple',
      icon: <UserCheck className="w-5 h-5" />,
      apiPath: 'supervisor',
      translationKey: 'supervisor',
    },
  };

  // Use the new hook for each role
  const {
    data: employees,
    isLoading: isEmployeesLoading,
    refetch: refetchEmployees,
  } = useGetUsersByRole('employee');
  const {
    data: managers,
    isLoading: isManagersLoading,
    refetch: refetchManagers,
  } = useGetUsersByRole('manager');

  const {
    data: supervisors,
    isLoading: isSupervisorsLoading,
    refetch: refetchSupervisors,
  } = useGetUsersByRole('supervisor');

  // Helper to get users by role
  // Ensure we always have an array, even if data is undefined or null
  const usersByRole = {
    employee: Array.isArray(employees) ? employees : [],
    manager: Array.isArray(managers) ? managers : [],
    supervisor: Array.isArray(supervisors) ? supervisors : [],
  };
  
  // Debug logs
  
  
  
  const isLoadingByRole = {
    employee: isEmployeesLoading,
    manager: isManagersLoading,
    supervisor: isSupervisorsLoading,
  };
  const refetchByRole = {
    employee: refetchEmployees,
    manager: refetchManagers,
    supervisor: refetchSupervisors,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error(t('admin.emailRequired'));
      return;
    }
    
    const roleConfigItem = roleConfig[selectedRole];
    setIsSubmitting(true);
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/create-${roleConfigItem.apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const responseText = await response.text();
      
      if (response.ok) {
        toast.success(t('admin.addSuccess'));
        setEmail('');
        refetchByRole[selectedRole]();
      } else {
        const errorMessage = responseText || t('admin.failedToUpdateRole', { role: roleConfigItem.label.toLowerCase() });
        if (response.status === 404) {
          throw new Error(t('admin.userNotFound'));
        } else if (response.status === 400) {
          throw new Error(t('admin.invalidRequest'));
        } else {
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      console.error(`Error updating ${roleConfig[selectedRole].label.toLowerCase()} role:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to update ${roleConfig[selectedRole].label.toLowerCase()} role`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveUser = async (user: UserType) => {
    const roleConfigItem = roleConfig[user.role as UserRole];
    if (!roleConfigItem) return;
    
    const fullName = `${user.first_name} ${user.last_name}`.trim();
    const confirmMessage = `${t('admin.confirmRemoveRole')}

${fullName} (${user.email})
`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsRemoving(user.user_id);
    try {
      const token = localStorage.getItem('a');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/delete-${roleConfigItem.apiPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: user?.email }),
      });

      if (response.ok) {
        toast.success(t(`${t('admin.removeSuccess')}`));
        refetchByRole[user.role as UserRole]?.();
      } else {
        const data = await response.json();
        throw new Error(data.message || `Failed to remove ${roleConfigItem.label.toLowerCase()}`);
      }
    } catch (error) {
      console.error(`Error removing ${roleConfigItem.label.toLowerCase()}:`, error);
      toast.error(t(`admin.errorRemoving${roleConfigItem.label}`));
    } finally {
      setIsRemoving(null);
    }
  };

  const filteredUsers = (role: string) => {
    return usersByRole[role as UserRole] || [];
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="container  mx-auto px-4 py-8">
        
        <div className='max-w-4xl mx-auto bg-red/40 rounded-lg shadow-md p-6 mb-5'>
          <p className='text-white'>   <span className='text-[#00c48c] mx-2 font-bold'>تنبيه:</span>الموظف له صلاحيات (صفحة المستخدمين + الطلبات )</p>
        
          <p className='text-white'>   <span className='text-[#00c48c] mx-2 font-bold'>تنبيه:</span>المشرف له صلاحيات (صفحة المستخدمين + الطلبات  + الأدوات + الباقات )</p>
          <p className='text-white'>   <span className='text-[#00c48c] mx-2 font-bold'>تنبيه:</span>المدير له صلاحيات (كل شئ عدا الاعدادات)</p>
          
        </div>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Role Selection and Add User Form */}
          <div className="bg-[#190237] rounded-lg shadow-md p-6">
            {/* <h1 className="text-2xl font-bold text-white mb-6">
              {t('admin.ManageUsers')}
            </h1> */}
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#00c48c] mb-2">
                {t('admin.selectRole')}
              </label>
              <div className="flex flex-col   space-y-3 ">
                
                

           

                {Object.entries(roleConfig).map(([role, config]) => (
                  <label key={role} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      className={`form-radio h-6 w-6 text-${config.color}-500 focus:ring-${config.color}-500 border-1 border-orange bg-[#190237] mx-2 `}
                      checked={selectedRole === role}
                      onChange={() => setSelectedRole(role as UserRole)}
                    />
                    <span className="text-gray-300 flex items-center">
                      {/* {config.icon} */}
                      <span className="ml-1 inner-shadow bg-[#2e5164] px-2  rounded-lg text-center text-white">{t(`admin.${config.label}`)}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 ">
              <div className=''>
                <label htmlFor="email" className="block text-sm font-medium text-[#00c48c] mb-1">
                  {t('admin.email')}
                </label>
                <div className="flex space-x-2 space-y-3 flex-col lg:flex-row ">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`flex-1 px-4 py-2 max-w-xl ${i18n.language === 'ar' ? 'ml-10' : 'mr-10'} border border-gray-600 rounded-md shadow-sm  border-orange bg-[#190237] text-white`}
                    placeholder={t('admin.enterEmail')}
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 w-fit py-2 bg-[linear-gradient(135deg,_#4f008c,_#4f008c,_#190237)] skew-x-[-50deg] gradient-border-packet rounded-[15px] text-white`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center skew-x-[50deg]">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('admin.adding')}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center skew-x-[50deg]">
                        {/* <UserPlus className="w-4 h-4 mr-2" /> */}
                        {t(`admin.add${roleConfig[selectedRole].label}`)}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* User Lists */}
          {Object.entries(roleConfig).map(([role, config]) => {
            const users = filteredUsers(role);
            return (
              <div key={role} className="bg-[#190237] rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl text-[#00c48c] font-bold  flex items-center">
                    {/* <span className={`text-${config.color}-500 mr-2`}>
                      {config.icon}
                    </span> */}
                    {t(`admin.current${config.label}s`)}
                    {/* <span className="ml-2 text-sm text-gray-400">({users.length})</span> */}
                  </h2>
                </div>
                
                {users.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">
                    {t(`admin.no${config.label}s`)}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-orange  ">
                      <thead className="bg-[#00c48c70]">
                        <tr>
                          <th className={`px-6 py-3  ${i18n.language === 'ar' ? 'text-right' : 'text-left'}  text-xs font-medium text-orange uppercase tracking-wider`}>
                            {t('admin.name')}
                          </th>
                          <th className={`px-6 py-3 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}  text-xs font-medium text-orange uppercase tracking-wider`}>
                            {t('admin.email')}
                          </th>
                          <th className={`px-6 py-3 ${i18n.language === 'ar' ? 'text-right' : 'text-right'}  text-xs font-medium text-orange uppercase tracking-wider`}>
                            {t('admin.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-[#00c48c50]">
                        {users.map((user: UserType) => (
                          <tr key={user.user_id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                              {`${user.first_name} ${user.last_name}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-white text-right text-sm font-medium">
                              <button
                                onClick={() => handleRemoveUser(user)}
                                disabled={isRemoving === user.user_id}
                                className="text-white bg-red p-1 rounded-full disabled:text-red-700 flex items-center ml-auto"
                              >
                                {isRemoving === user.user_id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                    {t('admin.removing')}
                                  </>
                                ) : (
                                  <>
                                    {/* <UserX className="w-4 h-4 mr-1" /> */}
                                    {t('admin.remove')}
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ManageUsers;
