"use client";

import { type FC, useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LuMapPin, LuPhone, LuMail, LuCalendar, LuBuilding, LuPlus } from "react-icons/lu";
import CampusForm from "./CampusForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CampusClassGroups from "./CampusClassGroups";
import CampusPrograms from "./CampusPrograms";
import CampusClasses from "./CampusClasses";
import CampusTeachers from "./CampusTeachers";
import CampusStudents from "./CampusStudents";
import CampusCoordinators from "./CampusCoordinators";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

const CampusViewSkeleton: FC = () => {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
};

interface CampusViewProps {
  campusId: string;
}

const CampusView: FC<CampusViewProps> = ({ campusId }) => {
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const router = useRouter();

  const {
    data: campus,
    isLoading,
    error,
    refetch
  } = api.campus.getById.useQuery(
    campusId,
    {
      retry: 2,
      onError: (error) => {
        console.error("Failed to fetch campus:", error);
      },
    }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Campus</CardTitle>
        </CardHeader>
        <CardContent>
          <CampusViewSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Campus</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-gray-600">{error.message}</p>
          <div className="flex space-x-4">
            <Button onClick={() => refetch()}>Retry</Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/campus")}
            >
              Back to Campus List
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!campus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campus Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-gray-600">
            The requested campus could not be found.
          </p>
          <Button onClick={() => router.push("/dashboard/campus")}>
            Back to Campus List
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{campus.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={campus.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {campus.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {campus.type} Campus
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditFormOpen(true)}>
          Edit Campus
        </Button>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="classGroups">Class Groups</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="coordinators">Coordinators</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LuBuilding className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Campus Code</p>
                  <p className="text-sm text-muted-foreground">{campus.code}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Establishment Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(campus.establishmentDate).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LuMapPin className="h-5 w-5" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{campus.streetAddress}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">City, State</p>
                  <p className="text-sm text-muted-foreground">
                    {campus.city}, {campus.state}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Country</p>
                  <p className="text-sm text-muted-foreground">{campus.country}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Postal Code</p>
                  <p className="text-sm text-muted-foreground">{campus.postalCode}</p>
                </div>
                {campus.gpsCoordinates && (
                  <div>
                    <p className="text-sm font-medium">GPS Coordinates</p>
                    <p className="text-sm text-muted-foreground">{campus.gpsCoordinates}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LuPhone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Primary Phone</p>
                  <p className="text-sm text-muted-foreground">{campus.primaryPhone}</p>
                </div>
                {campus.secondaryPhone && (
                  <div>
                    <p className="text-sm font-medium">Secondary Phone</p>
                    <p className="text-sm text-muted-foreground">{campus.secondaryPhone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Email Address</p>
                  <p className="text-sm text-muted-foreground">{campus.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Emergency Contact</p>
                  <p className="text-sm text-muted-foreground">{campus.emergencyContact}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="classGroups">
          <CampusClassGroups campusId={campusId} />
        </TabsContent>

        <TabsContent value="programs">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => router.push(`/dashboard/campus/${campusId}/associate-program`)}>
              <LuPlus className="mr-2 h-4 w-4" />
              Associate Program
            </Button>
          </div>
          <CampusPrograms campusId={campusId} />
        </TabsContent>

        <TabsContent value="classes">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => router.push(`/dashboard/campus/${campusId}/classes/new`)}>
              <LuPlus className="mr-2 h-4 w-4" />
              Create Class
            </Button>
          </div>
          <CampusClasses campusId={campusId} />
        </TabsContent>

        <TabsContent value="teachers">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => router.push(`/dashboard/campus/${campusId}/teachers/new`)}>
              <LuPlus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          </div>
          <CampusTeachers campusId={campusId} />
        </TabsContent>

        <TabsContent value="students">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => router.push(`/dashboard/campus/${campusId}/students/new`)}>
              <LuPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>
          <CampusStudents campusId={campusId} />
        </TabsContent>

        <TabsContent value="coordinators">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => router.push(`/dashboard/campus/${campusId}/coordinators/new`)}>
              <LuPlus className="mr-2 h-4 w-4" />
              Add Coordinator
            </Button>
          </div>
          <CampusCoordinators campusId={campusId} />
        </TabsContent>
      </Tabs>

      {isEditFormOpen && (
        <CampusForm 
          isOpen={isEditFormOpen}
          onClose={() => setIsEditFormOpen(false)}
          campusId={campusId}
        />
      )}
    </div>
  );
};

export default CampusView;