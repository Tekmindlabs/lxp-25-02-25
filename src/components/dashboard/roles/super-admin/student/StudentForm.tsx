'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Status } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/utils/api";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { StudentProfile } from "@/types/student";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  classId: z.string().min(1, "Class is required"),
  parentId: z.string().optional(),
  guardianInfo: z.object({
    name: z.string(),
    relationship: z.string(),
    contact: z.string(),
  }).optional(),
  status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]),
});

type FormValues = z.infer<typeof formSchema>;

interface StudentFormProps {
  selectedStudent?: {
    id: string;
    name: string;
    email: string;
    status: Status;
    studentProfile: StudentProfile;
  };
  classes: { 
    id: string; 
    name: string;
    campusId: string; 
    classGroup: { 
      id: string;
      name: string;
      program: { name: string | null; };
    }; 
  }[];
  campuses: { id: string; name: string; }[];
  onSuccess: () => void;
  inCampusContext?: boolean;
}

export const StudentForm = ({ 
  selectedStudent, 
  classes, 
  campuses, 
  onSuccess,
  inCampusContext = false 
}: StudentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const utils = api.useContext();
  const { toast } = useToast();

  if (!classes || !campuses) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Required data is missing</AlertTitle>
      </Alert>
    );
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: selectedStudent?.name || "",
      email: selectedStudent?.email || "",
      dateOfBirth: selectedStudent?.studentProfile.dateOfBirth 
        ? new Date(selectedStudent.studentProfile.dateOfBirth).toISOString().split('T')[0] 
        : "",
      classId: selectedStudent?.studentProfile.class?.id || "",
      status: selectedStudent?.status || Status.ACTIVE,
    },
  });

  const createStudent = api.student.createStudent.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student created successfully",
      });
      utils.student.searchStudents.invalidate();
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStudent = api.student.updateStudent.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
      utils.student.searchStudents.invalidate();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (selectedStudent) {
        await updateStudent.mutateAsync({
          id: selectedStudent.id,
          ...values,
        });
      } else {
        await createStudent.mutateAsync({
          ...values,
          campusId: inCampusContext ? campuses[0].id : values.campusId,
        });
      }
    } catch (error) {
      console.error('Failed to submit form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!inCampusContext && (
            <FormField
              control={form.control}
              name="campusId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campus</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select campus" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {campuses.map((campus) => (
                        <SelectItem key={campus.id} value={campus.id}>
                          {campus.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="classId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {classes.map((class_) => (
                      <SelectItem key={class_.id} value={class_.id}>
                        {class_.name} - {class_.classGroup.program.name || 'No Program'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={Status.ACTIVE}>Active</SelectItem>
                    <SelectItem value={Status.INACTIVE}>Inactive</SelectItem>
                    <SelectItem value={Status.ARCHIVED}>Archived</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            selectedStudent ? "Updating..." : "Creating..."
          ) : (
            selectedStudent ? "Update Student" : "Create Student"
          )}
        </Button>
      </form>
    </Form>
  );
};
