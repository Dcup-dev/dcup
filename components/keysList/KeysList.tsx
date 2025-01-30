import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import { Trash } from "lucide-react";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { apiKeys } from "@/db/schemas/users";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { databaseDrizzle } from "@/db";


export const KeysList = async () => {
  const sesstion = await getServerSession(authOptions);
  if (!sesstion?.user?.email) return notFound();
  const keys = await databaseDrizzle.query.apiKeys.findMany({
    where: (key, opt) => opt.eq(key.userEmail, sesstion.user?.email!),

  });
  return (
    <Card className="w-full max-w-xl mx-auto mt-8 p-4">
      <CardHeader>
        <CardTitle>Your API Keys</CardTitle>
        <CardDescription>
          These API keys allow other apps to access your account. Use it with
          caution – do not share your API key with others, or expose it in the
          browser or other client-side code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Name</TableHead>
              <TableHead className="text-center">Created Time</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => (
              <TableRow key={key.apiKey}>
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell className="text-center">
                  {format(key.generatedTime, "PP")}
                </TableCell>
                <TableCell className="text-right">
                  <form
                    action={async () => {
                      "use server";
                      await databaseDrizzle
                        .delete(apiKeys)
                        .where(eq(apiKeys.apiKey, key.apiKey));
                      revalidatePath("/integrate");
                    }}
                  >
                    <Button size="icon" variant="destructive">
                      <Trash />
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
