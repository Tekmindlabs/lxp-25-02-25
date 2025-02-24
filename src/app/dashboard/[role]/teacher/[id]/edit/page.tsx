import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TeacherForm from "@/components/dashboard/roles/super-admin/teacher/TeacherForm";
import { api } from "@/trpc/server";
import React from "react";

export default async function EditTeacherPage({
  params,
}: {
  params: { id: string; role: string };
}) {
  // Await the params to access route parameters
  const { id: teacherId } = await params;

  // Validate teacher ID
  if (!teacherId || typeof teacherId !== "string" || teacherId.trim() === "") {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent>
            <div className="text-center text-red-500">Invalid teacher ID provided</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  try {
    // Fetch initial data server-side
    const [teacher, subjects, classes] = await Promise.all([
      api.teacher.getTeacher.query({ id: teacherId }),
      api.subject.searchSubjects.query({}),
      api.class.searchClasses.query({}),
    ]);

    console.log("Fetched Teacher:", teacher);
    console.log("Fetched Subjects:", subjects);
    console.log("Fetched Classes:", classes);

    if (!teacher) {
      return (
        <div className="container mx-auto py-6">
          <Card>
            <CardContent>
              <div className="text-center text-red-500">Teacher not found</div>
            </CardContent>
          </Card>
        </div>
      );
    }

    const formattedTeacher = {
      id: teacher.id,
      name: teacher.name || "",
      email: teacher.email || "",
      phoneNumber: teacher.phoneNumber || "",
      status: teacher.status,
      teacherProfile: teacher.teacherProfile
        ? {
            teacherType: teacher.teacherProfile.teacherType ?? null,
            specialization: teacher.teacherProfile.specialization || "",
            availability: teacher.teacherProfile.availability || "",
            subjects: teacher.teacherProfile.subjects || [],
            classes: teacher.teacherProfile.classes || [],
          }
        : null,
    };

    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Edit Teacher</CardTitle>
          </CardHeader>
          <CardContent>
            <TeacherForm
              initialData={formattedTeacher}
              teacherId={teacher.id}
              subjects={subjects || []}
              classes={classes || []}
            />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error loading teacher:", error);
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent>
            <div className="text-center text-red-500">
              Error loading teacher data. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}