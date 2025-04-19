import { QueryBtn } from "@/components/QueryBtn/QueryBtn";
import { QueryFilter } from "@/components/QueryFilter/QueryFilter";
import { QueryResults } from "@/components/QueryResults/QueryResults";
import { SearchInput } from "@/components/SearchInput/SearchInput";
import { QueryProvider } from "@/context/queryContext";

export default function page() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-6">
        <QueryProvider>
          <div className="flex gap-4 items-center">
            <SearchInput />
            <QueryFilter />
            <QueryBtn />
          </div>
          <QueryResults />
        </QueryProvider>
      </div>
    </div>)
}
