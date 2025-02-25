'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { StudentForm } from '@/components/dashboard/roles/super-admin/student/StudentForm';

export default function CreateStudentPage({
  params,
}: {
  params: { id: string; role: string };
}) {
  const router = useRouter();
  const campusId = use(params).id;

  // Fetch classes for this campus
  const { data: classes = [], isLoading } = api.campus.getClasses.useQuery({ 
    campusId 
  }, {
    enabled: !!campusId
  });

  // We only need this campus for the form
  const campuses = [{ id: campusId, name: '' }];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Add New Student</h2>
      <StudentForm 
        classes={classes}
        campuses={campuses}
        inCampusContext={true}
        onSuccess={() => {
          router.push(`/dashboard/${params.role}/campus/${campusId}/students`);
          router.refresh();
        }}
      />
    </div>
  );
}
