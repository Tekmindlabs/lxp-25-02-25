"use client";

import { type FC } from "react";
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap } from "lucide-react";

interface CampusProgramsProps {
  campusId: string;
}

const CampusPrograms: FC<CampusProgramsProps> = ({ campusId }) => {
  const { data: programs, isLoading } = api.campus.getPrograms.useQuery({
    campusId,
    status: "ACTIVE",
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading programs...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!programs?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No programs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This campus has no associated programs.
          </p>
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
              {programs.map((program) => (
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
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampusPrograms;
