"use client";

import React from "react";
import { type FC } from "react";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherForm } from "@/components/dashboard/roles/super-admin/teacher/TeacherForm";

const CreateTeacherPage: FC = () => {
  const pathname = usePathname();
  const campusId = pathname.split("/")[3]; // Get ID from path

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Teacher</CardTitle>
      </CardHeader>
      <CardContent>
        <TeacherForm 
          initialData={{ campusId }} 
          isCreate={true} 
        />
      </CardContent>
    </Card>
  );
};

export default CreateTeacherPage;