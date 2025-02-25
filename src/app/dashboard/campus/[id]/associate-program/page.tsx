"use client";

import { type FC } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const AssociateProgramPage: FC = () => {
  const params = useParams();
  const campusId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const { data: availablePrograms, isLoading } = api.program.getAll.useQuery();
  const { data: campus } = api.campus.getById.useQuery(campusId);
  const associateProgramMutation = api.campus.associateProgram.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Program associated successfully",
      });
      router.push(`/dashboard/campus/${campusId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!campus) {
    return <div>Campus not found</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Associate Program with {campus.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {availablePrograms?.map((program) => (
              <Card key={program.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{program.name}</h3>
                    <p className="text-sm text-gray-500">{program.description}</p>
                  </div>
                  <Button
                    onClick={() =>
                      associateProgramMutation.mutate({
                        campusId,
                        programId: program.id,
                      })
                    }
                    disabled={associateProgramMutation.isLoading}
                  >
                    Associate
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AssociateProgramPage;
