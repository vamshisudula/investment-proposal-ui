
import { useAppContext } from "@/context/AppContext";
import { MainLayout } from "@/components/MainLayout";
import { ProfilingPage } from "./Profiling";
import { RiskPage } from "./Risk";
import { AllocationPage } from "./Allocation";
import { ProductsPage } from "./Products";
import { ProposalPage } from "./Proposal";
import { ManualAllocationPage } from "./ManualAllocation";

const Index = () => {
  const { state } = useAppContext();
  const { currentStep } = state;

  // Render the appropriate page based on the current step
  const renderPage = () => {
    switch (currentStep) {
      case 1:
        return <ProfilingPage />;
      case 2:
        return <RiskPage />;
      case 3:
        return <AllocationPage />;
      case 4:
        return <ProductsPage />;
      case 5:
        return <ProposalPage />;
      case 6:
        return <ManualAllocationPage />;
      default:
        return <ProfilingPage />;
    }
  };

  return (
    <MainLayout>
      {renderPage()}
    </MainLayout>
  );
};

export default Index;
