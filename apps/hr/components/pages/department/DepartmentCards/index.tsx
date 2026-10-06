import AbsenceRate from "./AbsenceRate";
import TotalDepartments from "./TotalDepartments";
import MostEmployees from "./MostEmployees";
import { IDepartmentStats } from "@/types/department";

type Props = {
  stats?: IDepartmentStats;
  isLoading?: boolean;
};

function TotalDepartmentsSkeleton() {
  return (
    <div className="border rounded-lg p-3 space-y-3 h-full">
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-md bg-line animate-pulse" />
        <div className="h-4 w-36 rounded bg-line animate-pulse" />
      </div>
      <div className="h-8 w-20 rounded bg-line animate-pulse" />
      <div className="h-4 w-52 rounded bg-line animate-pulse" />
      <div className="h-2 w-full rounded bg-sunken animate-pulse" />
      <div className="grid grid-cols-3 gap-2 ">
        <div className="h-14 rounded-md bg-sunken animate-pulse" />
        <div className="h-14 rounded-md bg-sunken animate-pulse" />
        <div className="h-14 rounded-md bg-sunken animate-pulse" />
        <div className="h-14 rounded-md bg-sunken animate-pulse" />
        <div className="h-14 rounded-md bg-sunken animate-pulse" />
        <div className="h-14 rounded-md bg-sunken animate-pulse" />
      </div>
    </div>
  );
}

function AbsenceRateSkeleton() {
  return (
    <div className="border rounded-lg p-3 space-y-3 h-full">
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-md bg-line animate-pulse" />
        <div className="h-4 w-40 rounded bg-line animate-pulse" />
      </div>
      <div className="h-[180px] rounded-md bg-sunken animate-pulse" />
      <div className="border rounded-md p-2 flex items-center gap-2">
        <div className="w-10 h-10 rounded-md bg-sunken animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 rounded bg-line animate-pulse" />
          <div className="h-3 w-20 rounded bg-line animate-pulse" />
        </div>
        <div className="h-5 w-12 rounded bg-line animate-pulse" />
      </div>
    </div>
  );
}

function MostEmployeesSkeleton() {
  return (
    <div className="border rounded-lg p-3 space-y-2 h-full">
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-md bg-line animate-pulse" />
        <div className="h-4 w-44 rounded bg-line animate-pulse" />
      </div>
      <div className="border rounded-md p-2 flex items-center gap-2">
        <div className="w-10 h-10 rounded-md bg-sunken animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-line animate-pulse" />
          <div className="h-3 w-16 rounded bg-line animate-pulse" />
        </div>
        <div className="h-5 w-10 rounded bg-line animate-pulse" />
      </div>
      <div className="border rounded-md p-2 flex items-center gap-2">
        <div className="w-10 h-10 rounded-md bg-sunken animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-line animate-pulse" />
          <div className="h-3 w-16 rounded bg-line animate-pulse" />
        </div>
        <div className="h-5 w-10 rounded bg-line animate-pulse" />
      </div>
      <div className="border rounded-md p-2 flex items-center gap-2">
        <div className="w-10 h-10 rounded-md bg-sunken animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-line animate-pulse" />
          <div className="h-3 w-16 rounded bg-line animate-pulse" />
        </div>
        <div className="h-5 w-10 rounded bg-line animate-pulse" />
      </div>
    </div>
  );
}

function DepartmentCards({ stats, isLoading }: Props) {
  if (isLoading) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2.5 h-full">
        <div className="col-span-1 md:col-span-3">
          <TotalDepartmentsSkeleton />
        </div>
        <div className="col-span-1 md:col-span-2">
          <AbsenceRateSkeleton />
        </div>
        <div className="col-span-1 md:col-span-2">
          <MostEmployeesSkeleton />
        </div>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2.5 h-full">
      <div className="col-span-1 md:col-span-3">
        <TotalDepartments stats={stats as unknown as IDepartmentStats} />
      </div>
      <div className="col-span-1 md:col-span-2">
        <AbsenceRate absenceByDepartment={stats?.absenceByDepartment} />
      </div>

      <div className="col-span-1 md:col-span-2">
        <MostEmployees mostEmployees={stats?.mostEmployees} />
      </div>
    </section>
  );
}

export default DepartmentCards;
