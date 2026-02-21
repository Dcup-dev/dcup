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
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { databaseDrizzle } from "@/db";
import { DeleteKey } from "../deleteKey/DeleteKey";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";


export const KeysList = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user.id) return notFound();

  const keys = await databaseDrizzle.query.apiKeys.findMany({
    where: (key, opt) => opt.eq(key.userId, session.user.id!),
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
                  <DeleteKey apikey={key.apiKey} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
