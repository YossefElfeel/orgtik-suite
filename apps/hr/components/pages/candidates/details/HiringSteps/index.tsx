import Stage from "./Stage";
import Appointments from "./Appointments";
import type {
  IJobApplicationAppointment,
  IJobApplicationStage,
} from "@/types/job";

type Props = {
  applicationId?: number;
  stages: IJobApplicationStage[];
  appointment?: IJobApplicationAppointment | null;
};

function HiringSteps({ applicationId, stages, appointment }: Props) {
  return (
    <section className="space-y-6">
      <Stage applicationId={applicationId} stages={stages} />
      <Appointments appointment={appointment} />
    </section>
  );
}

export default HiringSteps;
