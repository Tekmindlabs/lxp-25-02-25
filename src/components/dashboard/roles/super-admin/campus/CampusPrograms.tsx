"use client";

import { type FC } from "react";
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { type TRPCClientError } from "@trpc/client";
import { type AppRouter } from "@/server/api/root";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap } from "lucide-react";

interface CampusProgramsProps {
  campusId: string;
}

const ProgramsSkeleton: FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
};

export const CampusPrograms: FC<CampusProgramsProps> = ({ campusId }) => {
  const router = useRouter();

  const {
    data: programs,
    isLoading,
    error,
    refetch
  } = api.campus.getPrograms.useQuery(
    {
      campusId,
      status: "ACTIVE",
    }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgramsSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-gray-600">{error.message}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Associated Programs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {programs && programs.length > 0 ? (
                programs.map((program) => (
                  <Card key={program.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{program.name}</CardTitle>
                        <Badge variant={program.status === "ACTIVE" ? "default" : "secondary"}>
                          {program.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Term System: </span>
                          {program.termSystem}
                        </div>
                        {program.description && (
                          <div>
                            <span className="font-medium">Description: </span>
                            {program.description}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Created: </span>
                          {new Date(program.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-sm text-gray-600">
                      No programs found. 
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
