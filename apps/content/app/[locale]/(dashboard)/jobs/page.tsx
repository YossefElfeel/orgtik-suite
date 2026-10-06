import LanguageTabs from "@/components/pages/jobs/LanguageTabs";
import MainTitle from "@/components/shared/MainTitle";

function JobsPage() {
  return (
    <section>
      <MainTitle
        title="Jobs"
        subTitle="Here can manage Content of Somion’s pages"
      ></MainTitle>
      <LanguageTabs />
    </section>
  );
}

export default JobsPage;
