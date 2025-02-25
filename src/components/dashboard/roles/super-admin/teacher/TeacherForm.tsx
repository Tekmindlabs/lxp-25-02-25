'use client';

import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Status, TeacherType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Type definitions
interface Campus {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
}

interface ApiError {
  message: string;
}

// Form schema matching the backend expectations
const teacherFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  teacherType: z.nativeEnum(TeacherType),
  specialization: z.string().optional(),
  subjectIds: z.array(z.string()).optional(),
  classIds: z.array(z.string()).optional(),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

interface TeacherFormProps {
  initialData?: Partial<TeacherFormValues> & { campusId?: string };
  teacherId?: string;
  classes?: Class[];
  isCreate?: boolean;
  onClose?: () => void;
}

export default function TeacherForm({
  initialData = {},
  teacherId,
  classes = [],
  isCreate,
  onClose,
}: TeacherFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Get subjects for the specific campus
  const { data: campusSubjects = [], isLoading: isLoadingSubjects } = api.subject.getAll.useQuery(
    undefined,
    { enabled: !!initialData.campusId }
  );

  // Get teacher data if editing
  const { data: teacherData, isLoading: isLoadingTeacher } = api.teacher.getById.useQuery(
    teacherId!,
    { enabled: !!teacherId }
  );

  // Create teacher mutation
  const createTeacher = api.teacher.createTeacher.useMutation({
    onSuccess: () => {
      toast.success("Teacher created successfully");
      setLoading(false);
      router.push(`/dashboard/super-admin/campus/${initialData.campusId}/teachers`);
      router.refresh();
    },
    onError: (error: ApiError) => {
      toast.error(error.message);
      setLoading(false);
    },
  });

  // Update teacher mutation
  const updateTeacher = api.teacher.updateTeacher.useMutation({
    onSuccess: () => {
      toast.success("Teacher updated successfully");
      setLoading(false);
      router.push(`/dashboard/super-admin/campus/${initialData.campusId}/teachers`);
      router.refresh();
    },
    onError: (error: ApiError) => {
      toast.error(error.message);
      setLoading(false);
    },
  });

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      name: initialData.name ?? "",
      email: initialData.email ?? "",
      phoneNumber: initialData.phoneNumber ?? "",
      teacherType: initialData.teacherType ?? TeacherType.CLASS,
      specialization: initialData.specialization ?? "",
      subjectIds: initialData.subjectIds ?? [],
      classIds: initialData.classIds ?? [],
    },
  });

  // Set form default values when teacher data is loaded
  useEffect(() => {
    if (teacherData) {
      form.reset({
        name: teacherData.name || "",
        email: teacherData.email || "",
        phoneNumber: teacherData.phoneNumber || "",
        teacherType: teacherData.teacherProfile?.teacherType || TeacherType.CLASS,
        specialization: teacherData.teacherProfile?.specialization || "",
        subjectIds: teacherData.teacherProfile?.subjects?.map((s: { id: string }) => s.id) ?? [],
        classIds: teacherData.teacherProfile?.classes?.map((c: { id: string }) => c.id) ?? [],
      });
    }
  }, [teacherData, form]);

  const onSubmit = async (data: TeacherFormValues) => {
    setLoading(true);
    try {
      if (teacherId) {
        await updateTeacher.mutateAsync({
          id: teacherId,
          ...data,
        });
      } else {
        await createTeacher.mutateAsync(data);
      }
    } catch (error) {
      console.error(teacherId ? "Failed to update teacher:" : "Failed to create teacher:", error);
      setLoading(false);
    }
  };

  // Show loading state while fetching teacher data
  if (teacherId && isLoadingTeacher) {
    return <div>Loading teacher data...</div>;
  }

  // Show error if teacher data failed to load
  if (teacherId && !teacherData && !isLoadingTeacher) {
    return <div>Error loading teacher data. Please try again later.</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="John Doe" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="john.doe@example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="+1234567890" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="teacherType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teacher Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={TeacherType.CLASS}>Class Teacher</SelectItem>
                    <SelectItem value={TeacherType.SUBJECT}>Subject Teacher</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="specialization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Specialization</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Mathematics, Science" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("teacherType") === TeacherType.CLASS && (
            <FormField
              control={form.control}
              name="subjectIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Subjects</FormLabel>
                  <FormControl>
                    <MultiSelect<string>
                      value={field.value ?? []}
                      options={
                        campusSubjects?.map((subject: Subject) => ({
                          label: subject.name,
                          value: subject.id,
                        })) ?? []
                      }
                      onChange={field.onChange}
                      placeholder="Select subjects"
                      disabled={isLoadingSubjects}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {form.watch("teacherType") === TeacherType.SUBJECT && (
            <FormField
              control={form.control}
              name="classIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Classes</FormLabel>
                  <FormControl>
                    <MultiSelect<string>
                      value={field.value ?? []}
                      options={
                        classes?.map((class_: Class) => ({
                          label: class_.name,
                          value: class_.id,
                        })) ?? []
                      }
                      onChange={field.onChange}
                      placeholder="Select classes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? (teacherId ? "Updating..." : "Creating...") : teacherId ? "Update Teacher" : "Create Teacher"}
        </Button>
      </form>
    </Form>
  );
}
