"use client";

import { type FC } from "react";
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LuUsers, LuSearch } from "react-icons/lu";
import { useState } from "react";

interface CampusClassesProps {
  campusId: string;
}

const CampusClasses: FC<CampusClassesProps> = ({ campusId }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "COMPLETED" | undefined>(
    "ACTIVE"
  );

  const { data: classes, isLoading } = api.campus.getClasses.useQuery({
    campusId,
    search,
    status,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading classes...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LuUsers className="h-5 w-5" />
              Campus Classes
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <LuSearch className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search classes..."
                  className="h-8 w-[150px] lg:w-[250px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                value={status}
                onValueChange={(value: typeof status) => setStatus(value)}
              >
                <SelectTrigger className="h-8 w-[150px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {classes?.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  No classes found
                </p>
              ) : (
                classes?.map((campusClass) => (
                  <Card key={campusClass.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {campusClass.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {campusClass.code}
                          </p>
                        </div>
                        <Badge
                          variant={
                            campusClass.status === "ACTIVE"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {campusClass.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <span className="font-medium">Program: </span>
                          {campusClass.classGroup.program.name}
                        </div>
                        <div>
                          <span className="font-medium">Class Group: </span>
                          {campusClass.classGroup.name}
                        </div>
                        <div>
                          <span className="font-medium">Students: </span>
                          {campusClass._count.students}
                        </div>
                        <div>
                          <span className="font-medium">Teachers: </span>
                          <div className="mt-1 space-y-1">
                            {campusClass.teacherAllocations.map((allocation) => (
                              <div
                                key={allocation.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <span>
                                  {allocation.teacher.user.firstName}{" "}
                                  {allocation.teacher.user.lastName}
                                </span>
                                <span className="text-muted-foreground">
                                  {allocation.subject.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampusClasses;
